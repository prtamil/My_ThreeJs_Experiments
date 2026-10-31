import {
  ClampToEdgeWrapping,
  Color,
  DataTexture,
  DoubleSide,
  Group,
  Mesh,
  NearestFilter,
  OrthographicCamera,
  PlaneGeometry,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  UnsignedByteType,
  Vector2,
  WebGLRenderTarget,
} from "three";
import { MAP, NOISE, SIM, THEMES } from "./config.js";

const VIEW_HEIGHT = 9.25;

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const computeFragmentShader = `
  uniform sampler2D uPermutation;
  uniform float uTime;
  uniform float uNoiseScale;
  uniform float uWarpAmount;
  uniform float uGamma;
  uniform int uPattern;
  uniform vec2 uGridSize;
  varying vec2 vUv;

  float wrap256(float value) {
    return mod(mod(value, 256.0) + 256.0, 256.0);
  }

  float permutation(float index) {
    float wrapped = wrap256(index);
    float sampleX = (wrapped + 0.5) / 256.0;
    return floor(texture2D(uPermutation, vec2(sampleX, 0.5)).r * 255.0 + 0.5);
  }

  float fadeNoise(float value) {
    return value * value * value * (value * (value * 6.0 - 15.0) + 10.0);
  }

  float gradient(float hashValue, vec2 point) {
    float h = mod(hashValue, 8.0);
    float u = h < 4.0 ? point.x : point.y;
    float v = h < 4.0 ? point.y : point.x;
    float signedU = mod(h, 2.0) >= 1.0 ? -u : u;
    float signedV = mod(floor(h / 2.0), 2.0) >= 1.0 ? -2.0 * v : 2.0 * v;
    return signedU + signedV;
  }

  float perlin2d(vec2 point) {
    vec2 gridPoint = floor(point);
    vec2 local = point - gridPoint;
    float xIndex = wrap256(gridPoint.x);
    float yIndex = wrap256(gridPoint.y);
    float a = permutation(xIndex) + yIndex;
    float b = permutation(xIndex + 1.0) + yIndex;
    float n00 = gradient(permutation(a), local);
    float n10 = gradient(permutation(b), local - vec2(1.0, 0.0));
    float n01 = gradient(permutation(a + 1.0), local - vec2(0.0, 1.0));
    float n11 = gradient(permutation(b + 1.0), local - vec2(1.0, 1.0));
    vec2 blend = vec2(fadeNoise(local.x), fadeNoise(local.y));
    return mix(mix(n00, n10, blend.x), mix(n01, n11, blend.x), blend.y);
  }

  float fbm(vec2 point) {
    float total = 0.0;
    float amplitude = 1.0;
    float frequency = 1.0;
    float maximumAmplitude = 0.0;

    for (int octave = 0; octave < ${NOISE.octaves}; octave++) {
      total += amplitude * perlin2d(point * frequency);
      maximumAmplitude += amplitude;
      amplitude *= ${NOISE.persistence.toFixed(1)};
      frequency *= ${NOISE.lacunarity.toFixed(1)};
    }

    return total / maximumAmplitude;
  }

  vec2 sampleWarp(vec2 base, vec4 offsets) {
    return vec2(
      fbm(base + offsets.xy + vec2(0.0, uTime)),
      fbm(base + offsets.zw + vec2(0.0, uTime))
    );
  }

  vec2 warpPosition(vec2 base, vec2 displacement) {
    return base + uWarpAmount * displacement;
  }

  float finalIntensity(vec2 point) {
    return fbm(point + vec2(0.0, uTime));
  }

  float remapUnit(float value) {
    return clamp(value * 0.5 + 0.5, 0.0, 1.0);
  }

  float gammaBoost(float value) {
    return pow(clamp(value, 0.0, 1.0), uGamma);
  }

  void main() {
    vec2 cell = floor(vUv * uGridSize);
    vec2 base = cell * uNoiseScale;
    vec2 q = vec2(0.0);
    vec2 r = vec2(0.0);
    vec2 s = vec2(0.0);
    float intensity = 0.0;
    float colorValue = 0.0;

    if (uPattern == 0) {
      float rawIntensity = finalIntensity(base);
      vec2 colorPosition = base + vec2(20.8, 5.2);
      intensity = gammaBoost(remapUnit(rawIntensity));
      colorValue = remapUnit(finalIntensity(colorPosition));
    } else {
      q = sampleWarp(base, vec4(0.0, 0.0, 5.2, 1.3));

      if (uPattern == 1) {
        intensity = gammaBoost(remapUnit(finalIntensity(warpPosition(base, q))));
        colorValue = remapUnit(q.x);
      } else {
        r = sampleWarp(warpPosition(base, q), vec4(1.7, 9.2, 8.3, 2.8));
        float warp2Intensity = remapUnit(finalIntensity(warpPosition(base, r)));

        if (uPattern == 2) {
          intensity = gammaBoost(warp2Intensity);
          colorValue = remapUnit(q.x);
        } else if (uPattern == 3) {
          s = sampleWarp(warpPosition(base, r), vec4(7.5, 3.1, 6.8, 4.4));
          intensity = gammaBoost(remapUnit(finalIntensity(warpPosition(base, s))));
          colorValue = remapUnit(s.x);
        } else {
          float ridge = 1.0 - 2.0 * abs(warp2Intensity - 0.5);
          intensity = ridge * ridge;
          colorValue = remapUnit(q.x);
        }
      }
    }

    gl_FragColor = vec4(clamp(intensity, 0.0, 1.0), clamp(colorValue, 0.0, 1.0), 0.0, 1.0);
  }
`;

const displayFragmentShader = `
  uniform sampler2D uField;
  uniform vec2 uGridSize;
  uniform vec3 uBands[4];
  uniform vec3 uFlashColor;
  uniform float uFlash;
  uniform bool uShowGlyphs;
  varying vec2 vUv;

  float segmentMask(vec2 point, vec2 start, vec2 end, float width) {
    vec2 segment = end - start;
    float projection = clamp(dot(point - start, segment) / dot(segment, segment), 0.0, 1.0);
    float distanceToSegment = length(point - (start + segment * projection));
    return 1.0 - smoothstep(width, width + 0.025, distanceToSegment);
  }

  float circleMask(vec2 point, vec2 center, float radius) {
    return 1.0 - smoothstep(radius, radius + 0.025, length(point - center));
  }

  float glyphMask(vec2 point, int glyph) {
    vec2 p = vec2(point.x, point.y * 2.0);
    if (glyph == 1) return circleMask(p, vec2(0.0), 0.065);
    if (glyph == 2) return max(circleMask(p, vec2(0.0, -0.19), 0.06), circleMask(p, vec2(0.0, 0.19), 0.06));

    float horizontal = segmentMask(p, vec2(-0.34, 0.0), vec2(0.34, 0.0), 0.045);
    if (glyph == 3) return horizontal;
    float upper = segmentMask(p, vec2(-0.34, 0.17), vec2(0.34, 0.17), 0.045);
    float lower = segmentMask(p, vec2(-0.34, -0.17), vec2(0.34, -0.17), 0.045);
    if (glyph == 4) return max(upper, lower);
    float vertical = segmentMask(p, vec2(0.0, -0.42), vec2(0.0, 0.42), 0.045);
    if (glyph == 5) return max(horizontal, vertical);
    float diagonalA = segmentMask(p, vec2(-0.27, -0.34), vec2(0.27, 0.34), 0.04);
    float diagonalB = segmentMask(p, vec2(-0.27, 0.34), vec2(0.27, -0.34), 0.04);
    if (glyph == 6) return max(max(horizontal, vertical), max(diagonalA, diagonalB));
    float left = segmentMask(p, vec2(-0.14, -0.43), vec2(-0.14, 0.43), 0.045);
    float right = segmentMask(p, vec2(0.14, -0.43), vec2(0.14, 0.43), 0.045);
    if (glyph == 7) return max(max(left, right), max(upper, lower));
    if (glyph == 8) {
      float dots = max(circleMask(p, vec2(-0.18, 0.27), 0.105), circleMask(p, vec2(0.18, -0.27), 0.105));
      return max(dots, diagonalB);
    }
    float radius = length(p);
    float ring = 1.0 - smoothstep(0.04, 0.075, abs(radius - 0.30));
    float inner = circleMask(p, vec2(0.02, 0.0), 0.11);
    float tail = segmentMask(p, vec2(0.10, -0.04), vec2(0.34, -0.20), 0.045);
    return max(ring, max(inner, tail));
  }

  vec3 bandColor(int band) {
    vec3 color = uBands[3];
    if (band == 0) color = uBands[0];
    else if (band == 1) color = uBands[1];
    else if (band == 2) color = uBands[2];
    return color;
  }

  void main() {
    vec4 field = texture2D(uField, vUv);
    float intensity = field.r;
    int colorBand = int(clamp(floor(field.g * 3.999), 0.0, 3.0));
    int glyph = int(clamp(floor(intensity * 9.999), 0.0, 9.0));
    vec3 background = vec3(0.0025, 0.0045, 0.012);
    float vignette = smoothstep(0.95, 0.28, distance(vUv, vec2(0.5)));
    vec3 color = background * (0.66 + 0.34 * vignette);

    if (uFlash > ${SIM.glowThreshold.toFixed(2)}) {
      vec2 cell = floor(vUv * uGridSize);
      float sparkle = 1.0 - step(0.5, mod(cell.x + cell.y * 3.0, 4.0));
      if (sparkle > 0.5 || intensity > ${SIM.glowThreshold.toFixed(2)}) {
        color = uFlashColor * (0.65 + 0.35 * uFlash);
      }
    } else if (glyph > 0) {
      vec3 palette = bandColor(colorBand);
      if (uShowGlyphs) {
        vec2 localCell = fract(vUv * uGridSize) - 0.5;
        float mask = glyphMask(localCell, glyph);
        color += palette * intensity * 0.16;
        color += palette * mask * (0.75 + intensity * 0.62);
      } else {
        color += palette * (0.18 + intensity * 0.95);
      }
    }

    float scanline = 0.965 + 0.035 * sin(vUv.y * uGridSize.y * 3.14159265);
    gl_FragColor = vec4(color * scanline, 1.0);
  }
`;

function createTheme(theme) {
  return {
    bands: theme.bands.map((rgb) => new Color().setRGB(...rgb, SRGBColorSpace)),
    flash: new Color().setRGB(...theme.flash, SRGBColorSpace),
  };
}

class DomainWarpSurface {
  constructor(renderer, simulation) {
    this.renderer = renderer;
    this.paletteCache = THEMES.map(createTheme);
    this.lastTheme = -1;
    this.lastNoiseRevision = -1;
    this.permutationData = new Uint8Array(256 * 4);
    this.permutationTexture = new DataTexture(this.permutationData, 256, 1, RGBAFormat, UnsignedByteType);
    this.permutationTexture.minFilter = NearestFilter;
    this.permutationTexture.magFilter = NearestFilter;
    this.permutationTexture.wrapS = ClampToEdgeWrapping;
    this.permutationTexture.wrapT = ClampToEdgeWrapping;
    this.permutationTexture.generateMipmaps = false;

    this.renderTarget = new WebGLRenderTarget(MAP.width, MAP.height, {
      minFilter: NearestFilter,
      magFilter: NearestFilter,
      format: RGBAFormat,
      type: UnsignedByteType,
      depthBuffer: false,
      stencilBuffer: false,
    });
    this.computeScene = new Scene();
    this.computeCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.computeGeometry = new PlaneGeometry(2, 2);
    this.computeMaterial = new ShaderMaterial({
      uniforms: {
        uPermutation: { value: this.permutationTexture },
        uTime: { value: simulation.fieldTime },
        uNoiseScale: { value: simulation.noiseScale },
        uWarpAmount: { value: simulation.warpAmount },
        uGamma: { value: simulation.intensityGamma },
        uPattern: { value: simulation.pattern },
        uGridSize: { value: new Vector2(MAP.width, MAP.height) },
      },
      vertexShader,
      fragmentShader: computeFragmentShader,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    });
    this.computeMesh = new Mesh(this.computeGeometry, this.computeMaterial);
    this.computeScene.add(this.computeMesh);

    this.group = new Group();
    this.displayGeometry = new PlaneGeometry(1, 1);
    this.displayMaterial = new ShaderMaterial({
      uniforms: {
        uField: { value: this.renderTarget.texture },
        uGridSize: { value: new Vector2(MAP.width, MAP.height) },
        uBands: { value: this.paletteCache[0].bands },
        uFlashColor: { value: this.paletteCache[0].flash },
        uFlash: { value: simulation.flash },
        uShowGlyphs: { value: simulation.showGlyphs },
      },
      vertexShader,
      fragmentShader: displayFragmentShader,
      depthTest: false,
      depthWrite: false,
      side: DoubleSide,
      toneMapped: false,
    });
    this.displayMesh = new Mesh(this.displayGeometry, this.displayMaterial);
    this.displayMesh.frustumCulled = false;
    this.group.add(this.displayMesh);

    this.resize(window.innerWidth, window.innerHeight);
    this.update(simulation);
  }

  shufflePermutation() {
    const values = Array.from({ length: 256 }, (_, index) => index);
    for (let index = 255; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [values[index], values[swapIndex]] = [values[swapIndex], values[index]];
    }
    for (let index = 0; index < 256; index += 1) {
      const pixel = index * 4;
      this.permutationData[pixel] = values[index];
      this.permutationData[pixel + 1] = 0;
      this.permutationData[pixel + 2] = 0;
      this.permutationData[pixel + 3] = 255;
    }
    this.permutationTexture.needsUpdate = true;
  }

  resize(width, height) {
    const safeWidth = Math.max(width, 1);
    const safeHeight = Math.max(height, 1);
    this.displayMesh.scale.set(VIEW_HEIGHT * (safeWidth / safeHeight), VIEW_HEIGHT, 1);
  }

  update(simulation) {
    if (simulation.noiseRevision !== this.lastNoiseRevision) {
      this.shufflePermutation();
      this.lastNoiseRevision = simulation.noiseRevision;
    }

    const compute = this.computeMaterial.uniforms;
    compute.uTime.value = simulation.fieldTime;
    compute.uNoiseScale.value = simulation.noiseScale;
    compute.uWarpAmount.value = simulation.warpAmount;
    compute.uGamma.value = simulation.intensityGamma;
    compute.uPattern.value = simulation.pattern;

    const display = this.displayMaterial.uniforms;
    display.uFlash.value = simulation.flash;
    display.uShowGlyphs.value = simulation.showGlyphs;
    if (simulation.theme !== this.lastTheme) {
      const palette = this.paletteCache[simulation.theme];
      display.uBands.value = palette.bands;
      display.uFlashColor.value.copy(palette.flash);
      this.lastTheme = simulation.theme;
    }

    const previousTarget = this.renderer.getRenderTarget();
    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.render(this.computeScene, this.computeCamera);
    this.renderer.setRenderTarget(previousTarget);
  }

  dispose() {
    this.computeGeometry.dispose();
    this.computeMaterial.dispose();
    this.displayGeometry.dispose();
    this.displayMaterial.dispose();
    this.permutationTexture.dispose();
    this.renderTarget.dispose();
    this.computeScene.clear();
    this.group.clear();
  }
}

export { DomainWarpSurface };

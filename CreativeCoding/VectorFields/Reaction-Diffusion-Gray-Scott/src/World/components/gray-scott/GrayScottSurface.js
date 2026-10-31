import {
  ClampToEdgeWrapping,
  Color,
  DataTexture,
  DoubleSide,
  Group,
  Mesh,
  NearestFilter,
  PlaneGeometry,
  RGBAFormat,
  ShaderMaterial,
  SRGBColorSpace,
  UnsignedByteType,
  Vector2,
} from "three";
import { MAP, SIM, THEMES } from "./config.js";
import { normalizeV } from "./GrayScottSimulation.js";

const VIEW_HEIGHT = 9.25;

const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D uField;
  uniform vec2 uGridSize;
  uniform vec3 uPalette[4];
  uniform bool uShowGlyphs;

  varying vec2 vUv;

  float segmentMask(vec2 point, vec2 start, vec2 end, float width) {
    vec2 segment = end - start;
    float projection = clamp(
      dot(point - start, segment) / dot(segment, segment),
      0.0,
      1.0
    );
    float distanceToSegment = length(point - (start + segment * projection));
    return 1.0 - smoothstep(width, width + 0.025, distanceToSegment);
  }

  float circleMask(vec2 point, float radius) {
    return 1.0 - smoothstep(radius, radius + 0.035, length(point));
  }

  float glyphMask(vec2 point, float glow) {
    point.y *= 1.15;
    if (glow <= 0.30) return circleMask(point, 0.085);

    float horizontal = segmentMask(
      point, vec2(-0.33, 0.0), vec2(0.33, 0.0), 0.055
    );
    float vertical = segmentMask(
      point, vec2(0.0, -0.37), vec2(0.0, 0.37), 0.055
    );

    if (glow <= 0.65) {
      float diagonalA = segmentMask(
        point, vec2(-0.25, -0.30), vec2(0.25, 0.30), 0.045
      );
      float diagonalB = segmentMask(
        point, vec2(-0.25, 0.30), vec2(0.25, -0.30), 0.045
      );
      return max(max(horizontal, vertical), max(diagonalA, diagonalB));
    }

    float left = segmentMask(
      point, vec2(-0.14, -0.40), vec2(-0.14, 0.40), 0.055
    );
    float right = segmentMask(
      point, vec2(0.14, -0.40), vec2(0.14, 0.40), 0.055
    );
    float lower = segmentMask(
      point, vec2(-0.34, -0.16), vec2(0.34, -0.16), 0.055
    );
    float upper = segmentMask(
      point, vec2(-0.34, 0.16), vec2(0.34, 0.16), 0.055
    );
    return max(max(left, right), max(lower, upper));
  }

  vec3 paletteColor(int band) {
    vec3 color = uPalette[0];
    if (band == 1) color = uPalette[1];
    else if (band == 2) color = uPalette[2];
    else if (band == 3) color = uPalette[3];
    return color;
  }

  void main() {
    vec2 sampleUv = vec2(vUv.x, 1.0 - vUv.y);
    float glow = texture2D(uField, sampleUv).r;
    int band = int(mod(floor(glow * 3.999), 4.0));
    vec3 palette = paletteColor(band);
    float vignette = smoothstep(0.92, 0.28, distance(vUv, vec2(0.5)));
    vec3 background = vec3(0.003, 0.009, 0.030);
    vec3 color = background * (0.64 + 0.36 * vignette);

    if (glow > ${SIM.glowThreshold.toFixed(2)}) {
      if (uShowGlyphs) {
        vec2 localCell = fract(vUv * uGridSize) - 0.5;
        float glyph = glyphMask(localCell, glow);
        color += palette * glow * 0.12;
        color += palette * glyph * (0.58 + glow * 0.86);
      } else {
        color += palette * (0.14 + glow * 1.04);
      }
    }

    float scanline = 0.965 + 0.035 * sin(
      vUv.y * uGridSize.y * 3.14159265
    );
    gl_FragColor = vec4(color * scanline, 1.0);
  }
`;

function createPalette(theme) {
  return theme.colors.map((rgb) =>
    new Color().setRGB(rgb[0], rgb[1], rgb[2], SRGBColorSpace),
  );
}

class GrayScottSurface {
  constructor(simulation) {
    this.group = new Group();
    this.textureData = new Uint8Array(MAP.width * MAP.height * 4);
    this.texture = new DataTexture(
      this.textureData,
      MAP.width,
      MAP.height,
      RGBAFormat,
      UnsignedByteType,
    );
    this.texture.magFilter = NearestFilter;
    this.texture.minFilter = NearestFilter;
    this.texture.wrapS = ClampToEdgeWrapping;
    this.texture.wrapT = ClampToEdgeWrapping;
    this.texture.generateMipmaps = false;
    this.texture.needsUpdate = true;
    this.palettes = THEMES.map(createPalette);
    this.lastTheme = -1;

    this.geometry = new PlaneGeometry(1, 1);
    this.material = new ShaderMaterial({
      uniforms: {
        uField: { value: this.texture },
        uGridSize: { value: new Vector2(MAP.width, MAP.height) },
        uPalette: { value: this.palettes[0] },
        uShowGlyphs: { value: simulation.showGlyphs },
      },
      vertexShader,
      fragmentShader,
      depthTest: false,
      depthWrite: false,
      side: DoubleSide,
      toneMapped: false,
    });
    this.mesh = new Mesh(this.geometry, this.material);
    this.mesh.frustumCulled = false;
    this.group.add(this.mesh);
    this.resize(window.innerWidth, window.innerHeight);
    this.update(simulation);
  }

  resize(width, height) {
    const safeWidth = Math.max(Number(width) || 1, 1);
    const safeHeight = Math.max(Number(height) || 1, 1);
    this.mesh.scale.set(VIEW_HEIGHT * safeWidth / safeHeight, VIEW_HEIGHT, 1);
  }

  update(simulation) {
    for (let index = 0; index < simulation.v.length; index += 1) {
      const offset = index * 4;
      this.textureData[offset] = Math.round(normalizeV(simulation.v[index]) * 255);
      this.textureData[offset + 1] = 0;
      this.textureData[offset + 2] = 0;
      this.textureData[offset + 3] = 255;
    }
    this.texture.needsUpdate = true;
    this.material.uniforms.uShowGlyphs.value = simulation.showGlyphs;

    if (simulation.theme !== this.lastTheme) {
      this.material.uniforms.uPalette.value = this.palettes[simulation.theme];
      this.lastTheme = simulation.theme;
    }
  }

  dispose() {
    this.texture.dispose();
    this.geometry.dispose();
    this.material.dispose();
    this.group.clear();
  }
}

export { GrayScottSurface };

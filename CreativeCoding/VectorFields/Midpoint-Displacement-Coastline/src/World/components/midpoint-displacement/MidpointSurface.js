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
import { MAP, THEMES } from "./config.js";

const VIEW_HEIGHT = 9.25;

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D uScene;
  uniform vec2 uGridSize;
  uniform vec3 uPalette[4];
  uniform int uGlyphSet;
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

  float ringMask(vec2 point, float radius, float width) {
    return 1.0 - smoothstep(width, width + 0.025, abs(length(point) - radius));
  }

  float crossMask(vec2 point) {
    float horizontal = segmentMask(point, vec2(-0.32, 0.0), vec2(0.32, 0.0), 0.05);
    float vertical = segmentMask(point, vec2(0.0, -0.42), vec2(0.0, 0.42), 0.05);
    return max(horizontal, vertical);
  }

  float starMask(vec2 point) {
    float a = segmentMask(point, vec2(-0.25, -0.34), vec2(0.25, 0.34), 0.045);
    float b = segmentMask(point, vec2(-0.25, 0.34), vec2(0.25, -0.34), 0.045);
    return max(crossMask(point), max(a, b));
  }

  float hashMask(vec2 point) {
    float left = segmentMask(point, vec2(-0.13, -0.43), vec2(-0.13, 0.43), 0.05);
    float right = segmentMask(point, vec2(0.13, -0.43), vec2(0.13, 0.43), 0.05);
    float lower = segmentMask(point, vec2(-0.32, -0.17), vec2(0.32, -0.17), 0.05);
    float upper = segmentMask(point, vec2(-0.32, 0.17), vec2(0.32, 0.17), 0.05);
    return max(max(left, right), max(lower, upper));
  }

  float mMask(vec2 point) {
    float left = segmentMask(point, vec2(-0.29, -0.43), vec2(-0.29, 0.43), 0.055);
    float right = segmentMask(point, vec2(0.29, -0.43), vec2(0.29, 0.43), 0.055);
    float a = segmentMask(point, vec2(-0.29, 0.43), vec2(0.0, 0.05), 0.055);
    float b = segmentMask(point, vec2(0.0, 0.05), vec2(0.29, 0.43), 0.055);
    return max(max(left, right), max(a, b));
  }

  float glyphMask(vec2 localCell, int density, int glyphSet) {
    vec2 point = vec2(localCell.x, localCell.y * 2.0);
    float dotGlyph = circleMask(point, vec2(0.0, -0.22), 0.065);
    float mask = 0.0;

    if (glyphSet == 0) {
      if (density == 0) {
        mask = dotGlyph;
      } else if (density == 1) {
        mask = segmentMask(point, vec2(0.0, 0.10), vec2(0.0, 0.35), 0.045);
      } else {
        mask = max(circleMask(point, vec2(0.0, -0.22), 0.06), circleMask(point, vec2(0.0, 0.22), 0.06));
      }
    } else if (glyphSet == 1) {
      mask = density == 0 ? dotGlyph : (density == 1 ? starMask(point) : crossMask(point));
    } else if (glyphSet == 2) {
      mask = density == 0 ? dotGlyph : (density == 1 ? starMask(point) : hashMask(point));
    } else if (glyphSet == 3) {
      if (density == 0) {
        mask = ringMask(point, 0.18, 0.055);
      } else if (density == 1) {
        mask = ringMask(point, 0.30, 0.07);
      } else {
        mask = max(ringMask(point, 0.31, 0.07), circleMask(point, vec2(0.08, -0.05), 0.11));
      }
    } else {
      mask = density == 0 ? crossMask(point) : (density == 1 ? hashMask(point) : mMask(point));
    }
    return mask;
  }

  vec3 paletteColor(int band) {
    vec3 color = uPalette[3];
    if (band == 0) color = uPalette[0];
    else if (band == 1) color = uPalette[1];
    else if (band == 2) color = uPalette[2];
    return color;
  }

  void main() {
    vec2 sampleUv = vec2(vUv.x, 1.0 - vUv.y);
    vec4 state = texture2D(uScene, sampleUv);
    float visible = state.r;
    int band = int(clamp(floor(state.g * 3.0 + 0.5), 0.0, 3.0));
    int density = int(clamp(floor(state.b * 2.0 + 0.5), 0.0, 2.0));
    vec3 background = vec3(0.0025, 0.0045, 0.012);
    float vignette = smoothstep(0.96, 0.28, distance(vUv, vec2(0.5)));
    vec3 color = background * (0.66 + 0.34 * vignette);

    if (visible > 0.5) {
      vec3 sceneColor = paletteColor(band);
      if (uShowGlyphs) {
        vec2 localCell = fract(vUv * uGridSize) - 0.5;
        float glyph = glyphMask(localCell, density, uGlyphSet);
        color += sceneColor * 0.11;
        color += sceneColor * glyph * 1.18;
      } else {
        color += sceneColor * 1.02;
      }
    }

    color *= 0.965 + 0.035 * sin(vUv.y * uGridSize.y * 3.14159265);
    gl_FragColor = vec4(color, 1.0);
  }
`;

function createPalette(theme) {
  return theme.bands.map((rgb) => new Color().setRGB(...rgb, SRGBColorSpace));
}

class MidpointSurface {
  constructor(simulation) {
    this.group = new Group();
    this.textureData = new Uint8Array(MAP.width * MAP.height * 4);
    this.sceneTexture = new DataTexture(
      this.textureData,
      MAP.width,
      MAP.height,
      RGBAFormat,
      UnsignedByteType,
    );
    this.sceneTexture.minFilter = NearestFilter;
    this.sceneTexture.magFilter = NearestFilter;
    this.sceneTexture.wrapS = ClampToEdgeWrapping;
    this.sceneTexture.wrapT = ClampToEdgeWrapping;
    this.sceneTexture.generateMipmaps = false;

    this.paletteCache = THEMES.map(createPalette);
    this.lastTheme = -1;
    this.geometry = new PlaneGeometry(1, 1);
    this.material = new ShaderMaterial({
      uniforms: {
        uScene: { value: this.sceneTexture },
        uGridSize: { value: new Vector2(MAP.width, MAP.height) },
        uPalette: { value: this.paletteCache[0] },
        uGlyphSet: { value: simulation.glyphSet },
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
    const safeWidth = Math.max(width, 1);
    const safeHeight = Math.max(height, 1);
    this.mesh.scale.set(VIEW_HEIGHT * (safeWidth / safeHeight), VIEW_HEIGHT, 1);
  }

  update(simulation) {
    for (let index = 0; index < simulation.cellCount; index += 1) {
      const pixel = index * 4;
      this.textureData[pixel] = simulation.visible[index] * 255;
      this.textureData[pixel + 1] = Math.round(simulation.bands[index] / 3 * 255);
      this.textureData[pixel + 2] = Math.round(simulation.densities[index] / 2 * 255);
      this.textureData[pixel + 3] = 255;
    }
    this.sceneTexture.needsUpdate = true;
    this.material.uniforms.uGlyphSet.value = simulation.glyphSet;
    this.material.uniforms.uShowGlyphs.value = simulation.showGlyphs;
    if (simulation.theme !== this.lastTheme) {
      this.material.uniforms.uPalette.value = this.paletteCache[simulation.theme];
      this.lastTheme = simulation.theme;
    }
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
    this.sceneTexture.dispose();
    this.group.clear();
  }
}

export { MidpointSurface };

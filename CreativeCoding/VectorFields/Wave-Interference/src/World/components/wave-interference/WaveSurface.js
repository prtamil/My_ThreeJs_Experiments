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
  uniform sampler2D uField;
  uniform vec2 uGridSize;
  uniform vec3 uPalette[8];
  uniform bool uShowGlyphs;
  varying vec2 vUv;

  float segmentMask(vec2 point, vec2 start, vec2 end, float width) {
    vec2 segment = end - start;
    float along = clamp(dot(point - start, segment) / dot(segment, segment), 0.0, 1.0);
    return 1.0 - smoothstep(width, width + 0.025, length(point - start - segment * along));
  }

  float dotMask(vec2 point, vec2 centre) {
    return 1.0 - smoothstep(0.075, 0.105, length(point - centre));
  }

  float glyphMask(vec2 point, int band) {
    point.y *= 1.15;
    float horizontal = segmentMask(point, vec2(-0.32, 0.0), vec2(0.32, 0.0), 0.05);
    float vertical = segmentMask(point, vec2(0.0, -0.36), vec2(0.0, 0.36), 0.05);
    float diagonalA = segmentMask(point, vec2(-0.25, -0.30), vec2(0.25, 0.30), 0.04);
    float diagonalB = segmentMask(point, vec2(-0.25, 0.30), vec2(0.25, -0.30), 0.04);
    if (band == 1) return dotMask(point, vec2(0.0));
    if (band == 2) return max(dotMask(point, vec2(0.0, -0.15)), dotMask(point, vec2(0.0, 0.15)));
    if (band == 3) return horizontal;
    if (band == 4) {
      return max(
        segmentMask(point, vec2(-0.32, -0.13), vec2(0.32, -0.13), 0.045),
        segmentMask(point, vec2(-0.32, 0.13), vec2(0.32, 0.13), 0.045)
      );
    }
    if (band == 5) return max(horizontal, vertical);
    if (band == 6) return max(max(horizontal, vertical), max(diagonalA, diagonalB));
    float left = segmentMask(point, vec2(-0.14, -0.38), vec2(-0.14, 0.38), 0.045);
    float right = segmentMask(point, vec2(0.14, -0.38), vec2(0.14, 0.38), 0.045);
    float low = segmentMask(point, vec2(-0.33, -0.14), vec2(0.33, -0.14), 0.045);
    float high = segmentMask(point, vec2(-0.33, 0.14), vec2(0.33, 0.14), 0.045);
    return max(max(left, right), max(low, high));
  }

  vec3 paletteColor(int band) {
    vec3 color = uPalette[0];
    if (band == 1) color = uPalette[1];
    else if (band == 2) color = uPalette[2];
    else if (band == 3) color = uPalette[3];
    else if (band == 4) color = uPalette[4];
    else if (band == 5) color = uPalette[5];
    else if (band == 6) color = uPalette[6];
    else if (band == 7) color = uPalette[7];
    return color;
  }

  void main() {
    vec2 sampleUv = vec2(vUv.x, 1.0 - vUv.y);
    vec4 field = texture2D(uField, sampleUv);
    int band = int(floor(field.r * 255.0 + 0.5));
    float glow = field.g;
    float vignette = smoothstep(0.95, 0.28, distance(vUv, vec2(0.5)));
    vec3 color = vec3(0.0025, 0.006, 0.020) * (0.65 + 0.35 * vignette);
    if (band > 0) {
      vec3 palette = paletteColor(band);
      if (uShowGlyphs) {
        vec2 localCell = fract(vUv * uGridSize) - 0.5;
        float glyph = glyphMask(localCell, band);
        color += palette * glow * 0.10;
        color += palette * glyph * (0.72 + glow * 0.62);
      } else {
        color += palette * (0.18 + glow * 0.92);
      }
    }
    float scanline = 0.965 + 0.035 * sin(vUv.y * uGridSize.y * 3.14159265);
    gl_FragColor = vec4(color * scanline, 1.0);
  }
`;

function createPalette(theme) {
  return theme.colors.map((rgb) =>
    new Color().setRGB(rgb[0], rgb[1], rgb[2], SRGBColorSpace),
  );
}

class WaveSurface {
  constructor(simulation) {
    this.group = new Group();
    this.data = new Uint8Array(MAP.width * MAP.height * 4);
    this.texture = new DataTexture(
      this.data,
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
    for (let index = 0; index < simulation.glow.length; index += 1) {
      const offset = index * 4;
      this.data[offset] = simulation.bands[index];
      this.data[offset + 1] = Math.round(simulation.glow[index] * 255);
      this.data[offset + 2] = 0;
      this.data[offset + 3] = 255;
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

export { WaveSurface };

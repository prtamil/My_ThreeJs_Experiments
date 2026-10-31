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
  uniform vec3 uPalette[4];
  uniform bool uShowGlyphs;
  varying vec2 vUv;

  float segmentMask(vec2 point, vec2 start, vec2 end, float width) {
    vec2 segment = end - start;
    float along = clamp(dot(point - start, segment) / dot(segment, segment), 0.0, 1.0);
    return 1.0 - smoothstep(width, width + 0.025, length(point - start - segment * along));
  }
  float dotMask(vec2 point) {
    return 1.0 - smoothstep(0.075, 0.11, length(point));
  }
  float arrowMask(vec2 point, int direction) {
    float angle = float(direction) * 0.78539816339;
    float cosine = cos(angle);
    float sine = sin(angle);
    vec2 local = vec2(
      cosine * point.x - sine * point.y,
      sine * point.x + cosine * point.y
    );
    float shaft = segmentMask(local, vec2(-0.34, 0.0), vec2(0.24, 0.0), 0.045);
    float headA = segmentMask(local, vec2(0.08, -0.18), vec2(0.32, 0.0), 0.045);
    float headB = segmentMask(local, vec2(0.08, 0.18), vec2(0.32, 0.0), 0.045);
    return max(shaft, max(headA, headB));
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
    vec4 field = texture2D(uField, sampleUv);
    int direction = int(floor(field.r * 255.0 + 0.5));
    int band = int(floor(field.g * 255.0 + 0.5));
    vec3 palette = paletteColor(band);
    float vignette = smoothstep(0.95, 0.28, distance(vUv, vec2(0.5)));
    vec3 color = vec3(0.0025, 0.006, 0.020) * (0.65 + 0.35 * vignette);
    if (uShowGlyphs) {
      vec2 localCell = fract(vUv * uGridSize) - 0.5;
      localCell.y *= 1.12;
      float glyph = direction == 8 ? dotMask(localCell) : arrowMask(localCell, direction);
      color += palette * 0.08;
      color += palette * glyph * 1.32;
    } else {
      color += palette * 0.92;
    }
    float scanline = 0.965 + 0.035 * sin(vUv.y * uGridSize.y * 3.14159265);
    gl_FragColor = vec4(color * scanline, 1.0);
  }
`;

function createPalette(theme) {
  return theme.colors.map((rgb) => new Color().setRGB(...rgb, SRGBColorSpace));
}

class VectorFieldSurface {
  constructor(simulation) {
    this.group = new Group();
    this.data = new Uint8Array(MAP.width * MAP.height * 4);
    this.texture = new DataTexture(this.data, MAP.width, MAP.height, RGBAFormat, UnsignedByteType);
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
      vertexShader, fragmentShader, depthTest: false, depthWrite: false,
      side: DoubleSide, toneMapped: false,
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
    for (let index = 0; index < simulation.directions.length; index += 1) {
      const offset = index * 4;
      this.data[offset] = simulation.directions[index];
      this.data[offset + 1] = simulation.bands[index];
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
    this.texture.dispose(); this.geometry.dispose(); this.material.dispose(); this.group.clear();
  }
}

export { VectorFieldSurface };

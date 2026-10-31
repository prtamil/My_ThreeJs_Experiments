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
import { GLYPH, MAP, THEMES } from "./config.js";

const VIEW_HEIGHT = 9.25;

const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  #define BAND_COUNT 4

  uniform sampler2D uContours;
  uniform vec2 uGridSize;
  uniform vec3 uPalette[BAND_COUNT];
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

  float circleMask(vec2 point, vec2 center, float radius) {
    return 1.0 - smoothstep(radius, radius + 0.025, length(point - center));
  }

  float glyphMask(vec2 localCell, int glyph) {
    vec2 point = vec2(localCell.x, localCell.y * 2.0);
    float mask = 0.0;
    float horizontal = segmentMask(
      point,
      vec2(-0.38, 0.0),
      vec2(0.38, 0.0),
      0.055
    );
    float vertical = segmentMask(
      point,
      vec2(0.0, -0.44),
      vec2(0.0, 0.44),
      0.055
    );
    float slash = segmentMask(
      point,
      vec2(-0.34, -0.40),
      vec2(0.34, 0.40),
      0.055
    );
    float backslash = segmentMask(
      point,
      vec2(-0.34, 0.40),
      vec2(0.34, -0.40),
      0.055
    );

    if (glyph == ${GLYPH.slash}) {
      mask = slash;
    } else if (glyph == ${GLYPH.backslash}) {
      mask = backslash;
    } else if (glyph == ${GLYPH.dash}) {
      mask = horizontal;
    } else if (glyph == ${GLYPH.bar}) {
      mask = vertical;
    } else if (glyph == ${GLYPH.x}) {
      mask = max(slash, backslash);
    } else if (glyph == ${GLYPH.dot}) {
      mask = circleMask(point, vec2(0.0, -0.17), 0.07);
    } else if (glyph == ${GLYPH.plus}) {
      mask = max(horizontal, vertical);
    } else if (glyph == ${GLYPH.hash}) {
      float left = segmentMask(
        point,
        vec2(-0.13, -0.43),
        vec2(-0.13, 0.43),
        0.05
      );
      float right = segmentMask(
        point,
        vec2(0.13, -0.43),
        vec2(0.13, 0.43),
        0.05
      );
      float lower = segmentMask(
        point,
        vec2(-0.34, -0.17),
        vec2(0.34, -0.17),
        0.05
      );
      float upper = segmentMask(
        point,
        vec2(-0.34, 0.17),
        vec2(0.34, 0.17),
        0.05
      );
      mask = max(max(left, right), max(lower, upper));
    }

    return mask;
  }

  vec3 paletteColor(int band) {
    vec3 color = uPalette[3];
    if (band == 0) {
      color = uPalette[0];
    } else if (band == 1) {
      color = uPalette[1];
    } else if (band == 2) {
      color = uPalette[2];
    }
    return color;
  }

  void main() {
    vec2 sampleUv = vec2(vUv.x, 1.0 - vUv.y);
    vec4 contour = texture2D(uContours, sampleUv);
    float visible = contour.r;
    int band = int(clamp(floor(contour.g * 3.0 + 0.5), 0.0, 3.0));
    int glyph = int(clamp(floor(contour.b * 8.0 + 0.5), 0.0, 8.0));
    vec3 background = vec3(0.0025, 0.0045, 0.012);
    float vignette = smoothstep(0.96, 0.28, distance(vUv, vec2(0.5)));
    vec3 color = background * (0.66 + 0.34 * vignette);

    if (visible > 0.5 && glyph > 0) {
      vec3 lineColor = paletteColor(band);
      if (uShowGlyphs) {
        vec2 localCell = fract(vUv * uGridSize) - 0.5;
        float glyphShape = glyphMask(localCell, glyph);
        color += lineColor * 0.10;
        color += lineColor * glyphShape * 1.22;
      } else {
        color += lineColor * 1.02;
      }
    }

    float scanline = 0.965 + 0.035 * sin(
      vUv.y * uGridSize.y * 3.14159265
    );
    color *= scanline;
    gl_FragColor = vec4(color, 1.0);
  }
`;

function createPalette(theme) {
  return theme.bands.map((rgb) =>
    new Color().setRGB(...rgb, SRGBColorSpace),
  );
}

class MarchingSquaresSurface {
  constructor(simulation) {
    this.group = new Group();
    this.textureData = new Uint8Array(MAP.width * MAP.height * 4);
    this.contourTexture = new DataTexture(
      this.textureData,
      MAP.width,
      MAP.height,
      RGBAFormat,
      UnsignedByteType,
    );
    this.contourTexture.minFilter = NearestFilter;
    this.contourTexture.magFilter = NearestFilter;
    this.contourTexture.wrapS = ClampToEdgeWrapping;
    this.contourTexture.wrapT = ClampToEdgeWrapping;
    this.contourTexture.generateMipmaps = false;

    this.paletteCache = THEMES.map(createPalette);
    this.lastTheme = -1;
    this.geometry = new PlaneGeometry(1, 1);
    this.material = new ShaderMaterial({
      uniforms: {
        uContours: { value: this.contourTexture },
        uGridSize: { value: new Vector2(MAP.width, MAP.height) },
        uPalette: { value: this.paletteCache[0] },
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
      this.textureData[pixel] = simulation.glow[index] * 255;
      this.textureData[pixel + 1] = Math.round(
        (simulation.bands[index] / 3) * 255,
      );
      this.textureData[pixel + 2] = Math.round(
        (simulation.glyphs[index] / (GLYPH.count - 1)) * 255,
      );
      this.textureData[pixel + 3] = 255;
    }

    this.contourTexture.needsUpdate = true;
    this.material.uniforms.uShowGlyphs.value = simulation.showGlyphs;

    if (simulation.theme !== this.lastTheme) {
      this.material.uniforms.uPalette.value =
        this.paletteCache[simulation.theme];
      this.lastTheme = simulation.theme;
    }
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
    this.contourTexture.dispose();
    this.group.clear();
  }
}

export { MarchingSquaresSurface };

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

const VIEW_HEIGHT = 9.25;

const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  #define SHADE_COUNT ${SIM.shadeCount}

  uniform sampler2D uMedium;
  uniform vec2 uGridSize;
  uniform vec3 uShades[SHADE_COUNT];
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
    return 1.0 - smoothstep(
      radius,
      radius + 0.025,
      length(point - center)
    );
  }

  float glyphMask(vec2 point, int band) {
    vec2 physicalPoint = vec2(point.x, point.y * 2.0);

    if (band == 1) {
      return circleMask(physicalPoint, vec2(0.0), 0.07);
    }

    if (band == 2) {
      return max(
        circleMask(physicalPoint, vec2(0.0, -0.19), 0.065),
        circleMask(physicalPoint, vec2(0.0, 0.19), 0.065)
      );
    }

    float horizontal = segmentMask(
      physicalPoint,
      vec2(-0.34, 0.0),
      vec2(0.34, 0.0),
      0.05
    );

    if (band == 3) return horizontal;

    float upperHorizontal = segmentMask(
      physicalPoint,
      vec2(-0.34, 0.17),
      vec2(0.34, 0.17),
      0.05
    );
    float lowerHorizontal = segmentMask(
      physicalPoint,
      vec2(-0.34, -0.17),
      vec2(0.34, -0.17),
      0.05
    );

    if (band == 4) return max(upperHorizontal, lowerHorizontal);

    float vertical = segmentMask(
      physicalPoint,
      vec2(0.0, -0.42),
      vec2(0.0, 0.42),
      0.05
    );

    if (band == 5) return max(horizontal, vertical);

    float diagonalA = segmentMask(
      physicalPoint,
      vec2(-0.27, -0.34),
      vec2(0.27, 0.34),
      0.045
    );
    float diagonalB = segmentMask(
      physicalPoint,
      vec2(-0.27, 0.34),
      vec2(0.27, -0.34),
      0.045
    );

    if (band == 6) {
      return max(max(horizontal, vertical), max(diagonalA, diagonalB));
    }

    float left = segmentMask(
      physicalPoint,
      vec2(-0.14, -0.43),
      vec2(-0.14, 0.43),
      0.05
    );
    float right = segmentMask(
      physicalPoint,
      vec2(0.14, -0.43),
      vec2(0.14, 0.43),
      0.05
    );
    return max(max(left, right), max(upperHorizontal, lowerHorizontal));
  }

  vec3 shadeColor(int band) {
    vec3 color = uShades[7];

    if (band == 0) {
      color = uShades[0];
    } else if (band == 1) {
      color = uShades[1];
    } else if (band == 2) {
      color = uShades[2];
    } else if (band == 3) {
      color = uShades[3];
    } else if (band == 4) {
      color = uShades[4];
    } else if (band == 5) {
      color = uShades[5];
    } else if (band == 6) {
      color = uShades[6];
    }

    return color;
  }

  void main() {
    vec2 sampleUv = vec2(vUv.x, 1.0 - vUv.y);
    vec4 state = texture2D(uMedium, sampleUv);
    float excitation = state.r;
    int band = int(clamp(
      floor(excitation * float(SHADE_COUNT)),
      0.0,
      float(SHADE_COUNT - 1)
    ));
    vec3 background = vec3(0.006, 0.0025, 0.0015);
    float vignette = smoothstep(0.96, 0.28, distance(vUv, vec2(0.5)));
    vec3 color = background * (0.66 + 0.34 * vignette);

    if (band > 0) {
      vec3 waveColor = shadeColor(band);

      if (uShowGlyphs) {
        vec2 localCell = fract(vUv * uGridSize) - 0.5;
        float glyph = glyphMask(localCell, band);
        color += waveColor * (0.07 + excitation * 0.15);
        color += waveColor * glyph * 1.22;
      } else {
        color += waveColor * (0.20 + excitation * 0.90);
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
  return theme.shades.map((rgb) =>
    new Color().setRGB(...rgb, SRGBColorSpace),
  );
}

class BarkleySurface {
  constructor(simulation) {
    this.group = new Group();
    this.textureData = new Uint8Array(MAP.width * MAP.height * 4);
    this.mediumTexture = new DataTexture(
      this.textureData,
      MAP.width,
      MAP.height,
      RGBAFormat,
      UnsignedByteType,
    );
    this.mediumTexture.minFilter = NearestFilter;
    this.mediumTexture.magFilter = NearestFilter;
    this.mediumTexture.wrapS = ClampToEdgeWrapping;
    this.mediumTexture.wrapT = ClampToEdgeWrapping;
    this.mediumTexture.generateMipmaps = false;

    this.paletteCache = THEMES.map(createPalette);
    this.lastTheme = -1;
    this.geometry = new PlaneGeometry(1, 1);
    this.material = new ShaderMaterial({
      uniforms: {
        uMedium: { value: this.mediumTexture },
        uGridSize: { value: new Vector2(MAP.width, MAP.height) },
        uShades: { value: this.paletteCache[0] },
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
      this.textureData[pixel] = Math.round(simulation.u[index] * 255);
      this.textureData[pixel + 1] = Math.round(simulation.v[index] * 255);
      this.textureData[pixel + 2] = 0;
      this.textureData[pixel + 3] = 255;
    }

    this.mediumTexture.needsUpdate = true;
    this.material.uniforms.uShowGlyphs.value = simulation.showGlyphs;

    if (simulation.theme !== this.lastTheme) {
      this.material.uniforms.uShades.value =
        this.paletteCache[simulation.theme];
      this.lastTheme = simulation.theme;
    }
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
    this.mediumTexture.dispose();
    this.group.clear();
  }
}

export { BarkleySurface };

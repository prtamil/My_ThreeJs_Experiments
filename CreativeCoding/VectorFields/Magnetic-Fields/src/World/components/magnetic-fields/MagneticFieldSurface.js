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
  #define BAND_COUNT ${SIM.colorBands}
  #define MAX_POLES ${SIM.maxPoles}

  uniform sampler2D uTrails;
  uniform vec2 uGridSize;
  uniform vec3 uPalette[BAND_COUNT];
  uniform vec2 uPolePositions[MAX_POLES];
  uniform float uPolePolarities[MAX_POLES];
  uniform int uPoleCount;
  uniform int uGlyphSet;
  uniform bool uShowGlyphs;
  uniform bool uShowPoles;

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

  float ringMask(vec2 point, float radius, float width) {
    float distanceToRing = abs(length(point) - radius);
    return 1.0 - smoothstep(width, width + 0.025, distanceToRing);
  }

  float crossMask(vec2 point) {
    float horizontal = segmentMask(point, vec2(-0.32, 0.0), vec2(0.32, 0.0), 0.05);
    float vertical = segmentMask(point, vec2(0.0, -0.42), vec2(0.0, 0.42), 0.05);
    return max(horizontal, vertical);
  }

  float starMask(vec2 point) {
    float diagonalA = segmentMask(point, vec2(-0.25, -0.34), vec2(0.25, 0.34), 0.045);
    float diagonalB = segmentMask(point, vec2(-0.25, 0.34), vec2(0.25, -0.34), 0.045);
    return max(crossMask(point), max(diagonalA, diagonalB));
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
    float diagonalA = segmentMask(point, vec2(-0.29, 0.43), vec2(0.0, 0.05), 0.055);
    float diagonalB = segmentMask(point, vec2(0.0, 0.05), vec2(0.29, 0.43), 0.055);
    return max(max(left, right), max(diagonalA, diagonalB));
  }

  float glyphMask(vec2 localCell, int density, int glyphSet) {
    vec2 point = vec2(localCell.x, localCell.y * 2.0);
    float dotGlyph = circleMask(point, vec2(0.0, -0.22), 0.065);
    float mask = 0.0;

    if (glyphSet == 0) {
      if (density == 1) {
        mask = dotGlyph;
      } else if (density == 2) {
        mask = segmentMask(point, vec2(0.0, 0.10), vec2(0.0, 0.35), 0.045);
      } else {
        mask = max(
          circleMask(point, vec2(0.0, -0.22), 0.06),
          circleMask(point, vec2(0.0, 0.22), 0.06)
        );
      }
    } else if (glyphSet == 1) {
      if (density == 1) {
        mask = dotGlyph;
      } else if (density == 2) {
        mask = starMask(point);
      } else {
        mask = crossMask(point);
      }
    } else if (glyphSet == 2) {
      if (density == 1) {
        mask = dotGlyph;
      } else if (density == 2) {
        mask = starMask(point);
      } else {
        mask = hashMask(point);
      }
    } else if (glyphSet == 3) {
      if (density == 1) {
        mask = ringMask(point, 0.18, 0.055);
      } else if (density == 2) {
        mask = ringMask(point, 0.30, 0.07);
      } else {
        mask = max(
          ringMask(point, 0.31, 0.07),
          circleMask(point, vec2(0.08, -0.05), 0.11)
        );
      }
    } else if (density == 1) {
      mask = crossMask(point);
    } else if (density == 2) {
      mask = hashMask(point);
    } else {
      mask = mMask(point);
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

  float northLetter(vec2 point) {
    float left = segmentMask(point, vec2(-0.28, -0.42), vec2(-0.28, 0.42), 0.075);
    float right = segmentMask(point, vec2(0.28, -0.42), vec2(0.28, 0.42), 0.075);
    float diagonal = segmentMask(point, vec2(-0.28, 0.42), vec2(0.28, -0.42), 0.075);
    return max(max(left, right), diagonal);
  }

  float southLetter(vec2 point) {
    float top = segmentMask(point, vec2(-0.28, 0.38), vec2(0.28, 0.38), 0.075);
    float middle = segmentMask(point, vec2(-0.28, 0.0), vec2(0.28, 0.0), 0.075);
    float bottom = segmentMask(point, vec2(-0.28, -0.38), vec2(0.28, -0.38), 0.075);
    float upperLeft = segmentMask(point, vec2(-0.28, 0.0), vec2(-0.28, 0.38), 0.075);
    float lowerRight = segmentMask(point, vec2(0.28, -0.38), vec2(0.28, 0.0), 0.075);
    return max(max(top, middle), max(bottom, max(upperLeft, lowerRight)));
  }

  void main() {
    vec2 sampleUv = vec2(vUv.x, 1.0 - vUv.y);
    vec2 cell = sampleUv * uGridSize;
    vec4 trail = texture2D(uTrails, sampleUv);
    float glow = trail.r;
    int band = int(clamp(floor(trail.g * 3.0 + 0.5), 0.0, 3.0));
    int density = glow > 0.65 ? 3 : (glow > 0.30 ? 2 : 1);
    vec3 background = vec3(0.0025, 0.0045, 0.012);
    float vignette = smoothstep(0.96, 0.28, distance(vUv, vec2(0.5)));
    vec3 color = background * (0.66 + 0.34 * vignette);

    if (glow > ${SIM.glowThreshold.toFixed(2)}) {
      vec3 trailColor = paletteColor(band);
      if (uShowGlyphs) {
        vec2 localCell = fract(vUv * uGridSize) - 0.5;
        float glyph = glyphMask(localCell, density, uGlyphSet);
        color += trailColor * glow * 0.16;
        color += trailColor * glyph * (0.48 + glow * 0.82);
      } else {
        color += trailColor * (0.15 + glow * 0.92);
      }
    }

    if (uShowPoles) {
      float north = 0.0;
      float south = 0.0;
      for (int index = 0; index < MAX_POLES; index++) {
        if (index >= uPoleCount) break;
        vec2 point = cell - uPolePositions[index];
        point.y *= 2.0;
        float marker = uPolePolarities[index] > 0.0
          ? northLetter(point)
          : southLetter(point);
        if (uPolePolarities[index] > 0.0) {
          north = max(north, marker);
        } else {
          south = max(south, marker);
        }
      }
      color = mix(color, vec3(1.0, 0.02, 0.01), north);
      color = mix(color, vec3(0.01, 0.25, 1.0), south);
    }

    float scanline = 0.965 + 0.035 * sin(vUv.y * uGridSize.y * 3.14159265);
    color *= scanline;
    gl_FragColor = vec4(color, 1.0);
  }
`;

function createPalette(theme) {
  return theme.trails.map((rgb) =>
    new Color().setRGB(...rgb, SRGBColorSpace),
  );
}

class MagneticFieldSurface {
  constructor(simulation) {
    this.group = new Group();
    this.textureData = new Uint8Array(MAP.width * MAP.height * 4);
    this.trailTexture = new DataTexture(
      this.textureData,
      MAP.width,
      MAP.height,
      RGBAFormat,
      UnsignedByteType,
    );
    this.trailTexture.minFilter = NearestFilter;
    this.trailTexture.magFilter = NearestFilter;
    this.trailTexture.wrapS = ClampToEdgeWrapping;
    this.trailTexture.wrapT = ClampToEdgeWrapping;
    this.trailTexture.generateMipmaps = false;

    this.paletteCache = THEMES.map(createPalette);
    this.lastTheme = -1;
    this.polePositions = Array.from(
      { length: SIM.maxPoles },
      () => new Vector2(),
    );
    this.polePolarities = new Float32Array(SIM.maxPoles);

    this.geometry = new PlaneGeometry(1, 1);
    this.material = new ShaderMaterial({
      uniforms: {
        uTrails: { value: this.trailTexture },
        uGridSize: { value: new Vector2(MAP.width, MAP.height) },
        uPalette: { value: this.paletteCache[0] },
        uPolePositions: { value: this.polePositions },
        uPolePolarities: { value: this.polePolarities },
        uPoleCount: { value: simulation.activePoles.length },
        uGlyphSet: { value: simulation.glyphSet },
        uShowGlyphs: { value: simulation.showGlyphs },
        uShowPoles: { value: simulation.showPoles },
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
      this.textureData[pixel] = Math.round(simulation.glow[index] * 255);
      this.textureData[pixel + 1] = Math.round(
        (simulation.colors[index] / (SIM.colorBands - 1)) * 255,
      );
      this.textureData[pixel + 2] = 0;
      this.textureData[pixel + 3] = 255;
    }
    this.trailTexture.needsUpdate = true;

    for (let index = 0; index < SIM.maxPoles; index += 1) {
      const pole = simulation.activePoles[index];
      if (pole) {
        this.polePositions[index].set(pole.x, pole.y);
        this.polePolarities[index] = pole.polarity;
      }
    }

    const uniforms = this.material.uniforms;
    uniforms.uPoleCount.value = simulation.activePoles.length;
    uniforms.uGlyphSet.value = simulation.glyphSet;
    uniforms.uShowGlyphs.value = simulation.showGlyphs;
    uniforms.uShowPoles.value = simulation.showPoles;

    if (simulation.theme !== this.lastTheme) {
      uniforms.uPalette.value = this.paletteCache[simulation.theme];
      this.lastTheme = simulation.theme;
    }
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
    this.trailTexture.dispose();
    this.group.clear();
  }
}

export { MagneticFieldSurface };

import {
  Color,
  DoubleSide,
  Group,
  Mesh,
  PlaneGeometry,
  ShaderMaterial,
  SRGBColorSpace,
  Vector2,
} from "three";
import { FIELD, MAP, SIM, THEMES } from "./config.js";

const VIEW_HEIGHT = 9.25;

const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  #define MAX_CHARGES ${SIM.maxCharges}
  #define LEVEL_COUNT ${FIELD.levels}

  uniform vec2 uGridSize;
  uniform vec2 uChargePositions[MAX_CHARGES];
  uniform float uChargeStrengths[MAX_CHARGES];
  uniform int uChargeCount;
  uniform vec3 uNegative[LEVEL_COUNT];
  uniform vec3 uPositive[LEVEL_COUNT];
  uniform bool uShowGlyphs;
  uniform bool uShowContours;

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

  float glyphMask(vec2 point, int level) {
    vec2 physicalPoint = vec2(point.x, point.y * ${FIELD.cellAspect.toFixed(1)});

    if (level == 1) {
      return circleMask(physicalPoint, vec2(0.0), 0.075);
    }

    if (level == 2) {
      return max(
        circleMask(physicalPoint, vec2(0.0, -0.19), 0.07),
        circleMask(physicalPoint, vec2(0.0, 0.19), 0.07)
      );
    }

    float horizontal = segmentMask(
      physicalPoint,
      vec2(-0.34, 0.0),
      vec2(0.34, 0.0),
      0.055
    );
    float vertical = segmentMask(
      physicalPoint,
      vec2(0.0, -0.42),
      vec2(0.0, 0.42),
      0.055
    );

    if (level == 3) {
      return max(horizontal, vertical);
    }

    if (level == 4) {
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
    float lower = segmentMask(
      physicalPoint,
      vec2(-0.34, -0.18),
      vec2(0.34, -0.18),
      0.05
    );
    float upper = segmentMask(
      physicalPoint,
      vec2(-0.34, 0.18),
      vec2(0.34, 0.18),
      0.05
    );
    return max(max(left, right), max(lower, upper));
  }

  vec3 paletteColor(bool positive, int level) {
    vec3 color = positive ? uPositive[5] : uNegative[5];

    if (level == 0) {
      color = positive ? uPositive[0] : uNegative[0];
    } else if (level == 1) {
      color = positive ? uPositive[1] : uNegative[1];
    } else if (level == 2) {
      color = positive ? uPositive[2] : uNegative[2];
    } else if (level == 3) {
      color = positive ? uPositive[3] : uNegative[3];
    } else if (level == 4) {
      color = positive ? uPositive[4] : uNegative[4];
    }

    return color;
  }

  float markerMask(vec2 cell, vec2 chargePosition, bool positive) {
    vec2 point = cell - chargePosition;
    float horizontal = segmentMask(
      point,
      vec2(-0.42, 0.0),
      vec2(0.42, 0.0),
      0.10
    );

    if (!positive) return horizontal;

    float vertical = segmentMask(
      point,
      vec2(0.0, -0.22),
      vec2(0.0, 0.22),
      0.10
    );
    return max(horizontal, vertical);
  }

  void main() {
    vec2 sampleUv = vec2(vUv.x, 1.0 - vUv.y);
    vec2 cell = sampleUv * uGridSize;
    float potential = 0.0;
    float marker = 0.0;

    for (int index = 0; index < MAX_CHARGES; index++) {
      if (index >= uChargeCount) break;

      vec2 delta = cell - uChargePositions[index];
      delta.y *= ${FIELD.cellAspect.toFixed(1)};
      float distanceToCharge = max(length(delta), ${FIELD.soften.toFixed(1)});
      float strength = uChargeStrengths[index];
      potential += strength / distanceToCharge;
      marker = max(
        marker,
        markerMask(cell, uChargePositions[index], strength >= 0.0)
      );
    }

    float normalized = potential / (abs(potential) + ${FIELD.halfVoltage.toFixed(2)});
    float magnitude = abs(normalized);
    int level = int(clamp(
      floor(magnitude * float(LEVEL_COUNT)),
      0.0,
      float(LEVEL_COUNT - 1)
    ));
    vec3 bandColor = paletteColor(normalized >= 0.0, level);
    vec3 background = vec3(0.0025, 0.0045, 0.012);
    float vignette = smoothstep(0.95, 0.30, distance(vUv, vec2(0.5)));
    vec3 color = background * (0.65 + 0.35 * vignette);

    if (level > 0) {
      if (uShowGlyphs) {
        vec2 localCell = fract(vUv * uGridSize) - 0.5;
        float glyph = glyphMask(localCell, level);
        color += bandColor * (0.09 + magnitude * 0.17);
        color += bandColor * glyph * 1.18;
      } else {
        color += bandColor * (0.22 + magnitude * 0.88);
      }

      if (uShowContours) {
        float bandPhase = fract(magnitude * float(LEVEL_COUNT));
        float edgeDistance = min(bandPhase, 1.0 - bandPhase);
        float contour = 1.0 - smoothstep(0.0, 0.055, edgeDistance);
        color += bandColor * contour * 0.48;
      }
    }

    float scanline = 0.965 + 0.035 * sin(
      vUv.y * uGridSize.y * 3.14159265
    );
    color *= scanline;
    color = mix(color, vec3(1.0, 0.98, 0.82), marker);

    gl_FragColor = vec4(color, 1.0);
  }
`;

function themeColors(theme) {
  return {
    negative: theme.negative.map((rgb) =>
      new Color().setRGB(...rgb, SRGBColorSpace),
    ),
    positive: theme.positive.map((rgb) =>
      new Color().setRGB(...rgb, SRGBColorSpace),
    ),
  };
}

class ElectricPotentialSurface {
  constructor(simulation) {
    this.group = new Group();
    this.paletteCache = THEMES.map(themeColors);
    this.lastTheme = -1;
    this.chargePositions = Array.from(
      { length: SIM.maxCharges },
      () => new Vector2(),
    );
    this.chargeStrengths = new Float32Array(SIM.maxCharges);

    this.geometry = new PlaneGeometry(1, 1);
    this.material = new ShaderMaterial({
      uniforms: {
        uGridSize: { value: new Vector2(MAP.width, MAP.height) },
        uChargePositions: { value: this.chargePositions },
        uChargeStrengths: { value: this.chargeStrengths },
        uChargeCount: { value: simulation.chargeCount },
        uNegative: { value: this.paletteCache[0].negative },
        uPositive: { value: this.paletteCache[0].positive },
        uShowGlyphs: { value: simulation.showGlyphs },
        uShowContours: { value: simulation.showContours },
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
    for (let index = 0; index < SIM.maxCharges; index += 1) {
      const charge = simulation.charges[index];
      this.chargePositions[index].set(charge.x, charge.y);
      this.chargeStrengths[index] = charge.q;
    }

    const uniforms = this.material.uniforms;
    uniforms.uChargeCount.value = simulation.chargeCount;
    uniforms.uShowGlyphs.value = simulation.showGlyphs;
    uniforms.uShowContours.value = simulation.showContours;

    if (simulation.theme !== this.lastTheme) {
      const palette = this.paletteCache[simulation.theme];
      uniforms.uNegative.value = palette.negative;
      uniforms.uPositive.value = palette.positive;
      this.lastTheme = simulation.theme;
    }
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
    this.group.clear();
  }
}

export { ElectricPotentialSurface };

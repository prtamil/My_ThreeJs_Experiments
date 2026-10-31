const MAP = Object.freeze({
  width: 200,
  height: 56,
});

const SIM = Object.freeze({
  fpsMin: 10,
  fpsDefault: 60,
  fpsMax: 240,
  fpsStep: 10,
  particleCount: 256,
  ageMinTicks: 60,
  ageMaxTicks: 360,
  speedMin: 1,
  speedDefault: 8,
  speedMax: 64,
  trailGlowDecay: 0.6,
  glowThreshold: 0.05,
  velocityEpsilon: 1e-6,
  trailHitIntensity: 1,
  driftRate: 0.2,
});

const FIELD = Object.freeze({
  epsilonR2: 4,
  vortexStrength: 80,
  magnetStrength: 50,
  turbulentStrength: 6,
  waveFrequency: 0.15,
  saddleRate: 0.05,
  spiralStrength: 80,
  spiralInflow: 20,
  radialRate: 0.5,
  shearRate: 0.3,
  rippleWaveNumber: 0.3,
  rippleFrequency: 1.5,
  rippleAmplitude: 5,
  circularRate: 0.3,
  chainStrength: 50,
  chainCount: 6,
  chainZigzagY: 4,
  gridStrength: 30,
  gridCount: 3,
  galaxyStrength: 80,
  galaxyArmAmplitude: 0.4,
  galaxyArmPitch: 0.15,
  galaxyInflow: 20,
  duffingDamping: 0.2,
  duffingScale: 0.05,
  vanDerPolMu: 1.5,
  vanDerPolScale: 0.07,
  pendulumScale: 0.08,
  lotkaAlpha: 1,
  lotkaBeta: 1,
  lotkaGamma: 1,
  lotkaDelta: 1,
  lotkaScale: 0.012,
  lotkaOffset: 1,
  hopfMu: 1,
  hopfScale: 0.06,
  newtonScale: 0.04,
  jetStrength: 5,
  hurricaneRadius: 15,
  hurricaneStrength: 10,
  hurricaneInflow: 3,
  hamiltonScale: 0.07,
  wakeFreeStream: 3,
  wakeObstacleRelativeX: 0.3,
  wakeObstacleGap: 8,
  wakeZigzagAmplitude: 3,
  wakeVortexCount: 5,
  wakeVortexStrength: 30,
  standingK: 0.3,
  standingOmega: 1,
  standingAmplitude: 5,
  planeKx: 0.2,
  planeKy: 0.1,
  planeOmega: 0.7,
  planeAmplitude: 5,
  quadpoleStrength: 30,
  quadpoleSeparation: 0.18,
  gradientSigma: 10,
  gradientStrength: 80,
  eddySigma: 12,
  eddyStrength: 2,
  pitchforkMu: 1,
  pitchforkScale: 0.05,
  henonA: 1.4,
  henonB: 0.3,
  henonScale: 0.03,
});

const PATTERN = Object.freeze({
  VORTICES: 0,
  WAVE: 1,
  SADDLE: 2,
  MAGNET: 3,
  TURBULENT: 4,
  SPIRAL: 5,
  RADIAL: 6,
  SHEAR: 7,
  RIPPLE: 8,
  CIRCULAR: 9,
  CHAIN: 10,
  GRID: 11,
  GALAXY: 12,
  DUFFING: 13,
  VANDERPOL: 14,
  PENDULUM: 15,
  LOTKA: 16,
  HOPF: 17,
  NEWTON: 18,
  JET: 19,
  HURRICANE: 20,
  HAMILTON: 21,
  WAKE: 22,
  STANDING: 23,
  PLANE: 24,
  QUADPOLE: 25,
  GRADIENT: 26,
  EDDY: 27,
  PITCHFORK: 28,
  HENON: 29,
});

const PATTERN_NAMES = Object.freeze([
  "VORTICES",
  "WAVE",
  "SADDLE",
  "MAGNET",
  "TURBULENT",
  "SPIRAL",
  "RADIAL",
  "SHEAR",
  "RIPPLE",
  "CIRCULAR",
  "CHAIN",
  "GRID",
  "GALAXY",
  "DUFFING",
  "VANDERPOL",
  "PENDULUM",
  "LOTKA",
  "HOPF",
  "NEWTON",
  "JET",
  "HURRICANE",
  "HAMILTON",
  "WAKE",
  "STANDING",
  "PLANE",
  "QUADPOLE",
  "GRADIENT",
  "EDDY",
  "PITCHFORK",
  "HENON",
]);

const ANSI_16 = [
  0x000000, 0x800000, 0x008000, 0x808000,
  0x000080, 0x800080, 0x008080, 0xc0c0c0,
  0x808080, 0xff0000, 0x00ff00, 0xffff00,
  0x0000ff, 0xff00ff, 0x00ffff, 0xffffff,
];

function xterm256ToRgb(index) {
  let hex;

  if (index < 16) {
    hex = ANSI_16[index];
  } else if (index < 232) {
    const value = index - 16;
    const levels = [0, 95, 135, 175, 215, 255];
    const red = levels[Math.floor(value / 36)];
    const green = levels[Math.floor((value % 36) / 6)];
    const blue = levels[value % 6];
    hex = (red << 16) | (green << 8) | blue;
  } else {
    const gray = 8 + (index - 232) * 10;
    hex = (gray << 16) | (gray << 8) | gray;
  }

  return [
    ((hex >> 16) & 0xff) / 255,
    ((hex >> 8) & 0xff) / 255,
    (hex & 0xff) / 255,
  ];
}

const THEME_DEFINITIONS = [
  ["DEFAULT", [33, 117, 220, 220], 226],
  ["MATRIX", [22, 34, 46, 118], 226],
  ["NOVA", [53, 129, 201, 219], 226],
  ["MONO", [240, 244, 250, 254], 226],
  ["OCEAN", [17, 33, 39, 51], 226],
  ["FIRE", [88, 124, 208, 226], 196],
  ["EARTH", [58, 100, 173, 230], 226],
  ["FOREST", [22, 28, 64, 144], 226],
  ["DESERT", [94, 130, 173, 222], 226],
  ["ARCTIC", [18, 39, 159, 231], 226],
];

const THEMES = Object.freeze(
  THEME_DEFINITIONS.map(([name, trail, flash]) =>
    Object.freeze({
      name,
      trail: Object.freeze(trail.map(xterm256ToRgb)),
      flash: Object.freeze(xterm256ToRgb(flash)),
    }),
  ),
);

const GLYPH_STYLES = Object.freeze([
  "SLIM",
  "LIGHT",
  "MEDIUM",
  "HEAVY",
  "FAT",
]);

export {
  FIELD,
  GLYPH_STYLES,
  MAP,
  PATTERN,
  PATTERN_NAMES,
  SIM,
  THEMES,
};

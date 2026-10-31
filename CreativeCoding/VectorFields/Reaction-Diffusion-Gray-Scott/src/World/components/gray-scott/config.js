const MAP = Object.freeze({ width: 200, height: 56 });

const SIM = Object.freeze({
  diffusionU: 0.16,
  diffusionV: 0.08,
  timeStep: 1,
  renderGain: 2.5,
  glowThreshold: 0.05,
  minSubSteps: 1,
  defaultSubSteps: 6,
  maxSubSteps: 128,
  minTickRate: 10,
  defaultTickRate: 60,
  maxTickRate: 240,
  tickRateStep: 10,
  maxFrameDelta: 0.1,
  maxTicksPerFrame: 24,
  seedRadiusDenominator: 12,
  minimumSeedRadius: 3,
  seedU: 0.5,
  seedV: 0.25,
  jitterGain: 0.0002,
});

const PATTERN_NAMES = Object.freeze([
  "SPOTS", "STRIPES", "MAZES", "CORAL", "WORMS",
  "ALPHA", "BETA", "GAMMA", "DELTA", "EPSILON",
  "MITOSIS", "SOLITON", "FINGERS", "SKATE", "PSI",
  "WAVES", "PULSES", "NEBULA", "NEURONS", "CHAOS",
  "HOLES", "BUBBLES", "SLUDGE", "PLANKTON", "CRYSTAL",
  "THICKET", "DRIFT", "ZEBRA", "BANDS", "BARNACLE",
]);

const PRESETS = Object.freeze([
  Object.freeze({ feed: 0.035, kill: 0.065 }),
  Object.freeze({ feed: 0.022, kill: 0.051 }),
  Object.freeze({ feed: 0.029, kill: 0.057 }),
  Object.freeze({ feed: 0.054, kill: 0.063 }),
  Object.freeze({ feed: 0.046, kill: 0.063 }),
  Object.freeze({ feed: 0.010, kill: 0.048 }),
  Object.freeze({ feed: 0.014, kill: 0.045 }),
  Object.freeze({ feed: 0.026, kill: 0.055 }),
  Object.freeze({ feed: 0.042, kill: 0.059 }),
  Object.freeze({ feed: 0.018, kill: 0.055 }),
  Object.freeze({ feed: 0.0367, kill: 0.0649 }),
  Object.freeze({ feed: 0.014, kill: 0.054 }),
  Object.freeze({ feed: 0.046, kill: 0.065 }),
  Object.freeze({ feed: 0.062, kill: 0.0609 }),
  Object.freeze({ feed: 0.044, kill: 0.063 }),
  Object.freeze({ feed: 0.014, kill: 0.045 }),
  Object.freeze({ feed: 0.025, kill: 0.060 }),
  Object.freeze({ feed: 0.018, kill: 0.051 }),
  Object.freeze({ feed: 0.041, kill: 0.0635 }),
  Object.freeze({ feed: 0.046, kill: 0.0594 }),
  Object.freeze({ feed: 0.039, kill: 0.058 }),
  Object.freeze({ feed: 0.012, kill: 0.052 }),
  Object.freeze({ feed: 0.018, kill: 0.053 }),
  Object.freeze({ feed: 0.022, kill: 0.0585 }),
  Object.freeze({ feed: 0.040, kill: 0.0608 }),
  Object.freeze({ feed: 0.060, kill: 0.062 }),
  Object.freeze({ feed: 0.020, kill: 0.057 }),
  Object.freeze({ feed: 0.026, kill: 0.052 }),
  Object.freeze({ feed: 0.034, kill: 0.060 }),
  Object.freeze({ feed: 0.0376, kill: 0.06277 }),
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
  ["DEFAULT", [17, 33, 220, 231]],
  ["MATRIX", [22, 34, 46, 118]],
  ["NOVA", [53, 129, 201, 219]],
  ["MONO", [234, 244, 250, 254]],
  ["OCEAN", [17, 33, 39, 51]],
  ["FIRE", [52, 124, 208, 226]],
  ["EARTH", [58, 100, 173, 230]],
  ["FOREST", [22, 28, 64, 144]],
  ["DESERT", [94, 130, 173, 222]],
  ["ARCTIC", [18, 39, 159, 231]],
];

const THEMES = Object.freeze(
  THEME_DEFINITIONS.map(([name, colors]) =>
    Object.freeze({ name, colors: Object.freeze(colors.map(xterm256ToRgb)) }),
  ),
);

export { MAP, PATTERN_NAMES, PRESETS, SIM, THEMES };

const MAP = Object.freeze({ width: 200, height: 56 });

const SIM = Object.freeze({
  minTickRate: 10,
  defaultTickRate: 60,
  maxTickRate: 240,
  tickRateStep: 10,
  maxFrameDelta: 0.1,
  maxStepsPerFrame: 24,
  fieldScale: 0.08,
  fieldDrift: 0.2,
  minDriftMultiplier: 1,
  defaultDriftMultiplier: 1,
  maxDriftMultiplier: 16,
  defaultThreshold: 0.5,
  thresholdStep: 0.05,
  minThreshold: 0.05,
  maxThreshold: 0.95,
  sweepPeriod: 6,
});

const PATTERNS = Object.freeze([
  ["CONTOUR", "1-SINGLE"],
  ["THICK", "1-SINGLE"],
  ["INVERT", "1-SINGLE"],
  ["DOTS", "1-SINGLE"],
  ["UNIFORM", "1-SINGLE"],
  ["TOPO", "2-MULTI"],
  ["DENSE", "2-MULTI"],
  ["SPARSE", "2-MULTI"],
  ["STEPS", "2-MULTI"],
  ["RAINBOW", "2-MULTI"],
  ["DUAL", "3-PAIRS"],
  ["SHELL", "3-PAIRS"],
  ["INNER", "3-PAIRS"],
  ["OUTER", "3-PAIRS"],
  ["SANDWICH", "3-PAIRS"],
  ["SADDLE", "4-TOPOLOGY"],
  ["ORTHO", "4-TOPOLOGY"],
  ["DIAGONALS", "4-TOPOLOGY"],
  ["JUNCTIONS", "4-TOPOLOGY"],
  ["ROUGHNESS", "4-TOPOLOGY"],
  ["ABOVE", "5-REGIONS"],
  ["BELOW", "5-REGIONS"],
  ["STRIPE", "5-REGIONS"],
  ["ZEBRA", "5-REGIONS"],
  ["PERIMETER", "5-REGIONS"],
  ["SWEEP", "6-ANIMATED"],
  ["PULSE", "6-ANIMATED"],
  ["RIPPLE", "6-ANIMATED"],
  ["STAIRS", "6-ANIMATED"],
  ["CHAOS", "6-ANIMATED"],
].map(([name, tier]) => Object.freeze({ name, tier })));

const GLYPH = Object.freeze({
  blank: 0,
  slash: 1,
  backslash: 2,
  dash: 3,
  bar: 4,
  x: 5,
  dot: 6,
  plus: 7,
  hash: 8,
  count: 9,
});

const CASE_GLYPHS = Object.freeze([
  GLYPH.blank,
  GLYPH.slash,
  GLYPH.backslash,
  GLYPH.dash,
  GLYPH.backslash,
  GLYPH.x,
  GLYPH.bar,
  GLYPH.slash,
  GLYPH.slash,
  GLYPH.bar,
  GLYPH.x,
  GLYPH.backslash,
  GLYPH.dash,
  GLYPH.backslash,
  GLYPH.slash,
  GLYPH.blank,
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
  THEME_DEFINITIONS.map(([name, bands]) =>
    Object.freeze({
      name,
      bands: Object.freeze(bands.map(xterm256ToRgb)),
    }),
  ),
);

export { CASE_GLYPHS, GLYPH, MAP, PATTERNS, SIM, THEMES };

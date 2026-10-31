const MAP = Object.freeze({ width: 200, height: 56 });

const SIM = Object.freeze({
  noiseScale: 0.10,
  fieldDrift: 0.40,
  wobbleAmount: 0.20,
  glowThreshold: 0.05,
  glyphMidThreshold: 0.30,
  glyphHighThreshold: 0.65,
  minDrift: 1,
  defaultDrift: 1,
  maxDrift: 16,
  minTickRate: 10,
  defaultTickRate: 60,
  maxTickRate: 240,
  tickRateStep: 10,
  maxFrameDelta: 0.1,
  maxTicksPerFrame: 24,
  fbmOctaves: 3,
  fbmAmplitudeSum: 1.75,
});

const PATTERN_NAMES = Object.freeze([
  "F1", "F2", "F3", "F2-F1", "F1/F2",
  "F1+F2", "F1*F2", "F3-F2", "F2-F1 INV", "F1 INVERT",
  "MANHATTAN", "CHEBYSHEV", "SUPRELLIPS", "STAR", "STRETCHED",
  "CELL_ID", "WEIGHTED", "TWINKLE", "RND_GLOW", "CRACKLE",
  "WORLEY_FBM", "TURBULENCE", "RIDGED", "NESTED", "CHECKER",
  "DOM_WARP", "MTRC_BLEND", "HALO", "ENERGY", "CHAOS",
]);

const PATTERN_TIERS = Object.freeze([
  "1-FN", "1-FN", "1-FN", "1-FN", "1-FN",
  "2-COMBO", "2-COMBO", "2-COMBO", "2-COMBO", "2-COMBO",
  "3-METR", "3-METR", "3-METR", "3-METR", "3-METR",
  "4-IDENT", "4-IDENT", "4-IDENT", "4-IDENT", "4-IDENT",
  "5-MULTI", "5-MULTI", "5-MULTI", "5-MULTI", "5-MULTI",
  "6-HYB", "6-HYB", "6-HYB", "6-HYB", "6-HYB",
]);

const ANSI_16 = [
  0x000000, 0x800000, 0x008000, 0x808000,
  0x000080, 0x800080, 0x008080, 0xc0c0c0,
  0x808080, 0xff0000, 0x00ff00, 0xffff00,
  0x0000ff, 0xff00ff, 0x00ffff, 0xffffff,
];

function xterm256ToRgb(index) {
  let hex;
  if (index < 16) hex = ANSI_16[index];
  else if (index < 232) {
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
  return [((hex >> 16) & 0xff) / 255, ((hex >> 8) & 0xff) / 255, (hex & 0xff) / 255];
}

const DEFINITIONS = [
  ["DEFAULT", [17, 33, 220, 231]], ["MATRIX", [22, 34, 46, 118]],
  ["NOVA", [53, 129, 201, 219]], ["MONO", [234, 244, 250, 254]],
  ["OCEAN", [17, 33, 39, 51]], ["FIRE", [52, 124, 208, 226]],
  ["EARTH", [58, 100, 173, 230]], ["FOREST", [22, 28, 64, 144]],
  ["DESERT", [94, 130, 173, 222]], ["ARCTIC", [18, 39, 159, 231]],
];

const THEMES = Object.freeze(DEFINITIONS.map(([name, colors]) =>
  Object.freeze({ name, colors: Object.freeze(colors.map(xterm256ToRgb)) }),
));

export { MAP, PATTERN_NAMES, PATTERN_TIERS, SIM, THEMES };

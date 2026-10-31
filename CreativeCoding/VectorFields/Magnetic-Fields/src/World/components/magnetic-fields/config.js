const MAP = Object.freeze({
  width: 200,
  height: 56,
});

const SIM = Object.freeze({
  minTickRate: 10,
  defaultTickRate: 60,
  maxTickRate: 240,
  tickRateStep: 10,
  maxFrameDelta: 0.1,
  maxStepsPerFrame: 24,
  minParticles: 32,
  defaultParticles: 256,
  maxParticles: 1024,
  minAgeTicks: 60,
  maxAgeTicks: 360,
  minSpeed: 1,
  defaultSpeed: 8,
  maxSpeed: 64,
  maxPoles: 32,
  trailDecay: 0.6,
  glowThreshold: 0.05,
  fieldEpsilon: 1e-6,
  fieldSofteningSquared: 4,
  driftRate: 0.2,
  colorBands: 4,
});

const PATTERN_NAMES = Object.freeze([
  "MONOPOLE",
  "DIPOLE",
  "DIPOLE_V",
  "REPELLER",
  "ATTRACT",
  "TRIPOLE",
  "TRIANGLE",
  "HORSESHOE",
  "QUAD",
  "CROSS",
  "PINWHEEL",
  "CHAIN",
  "CHAIN_V",
  "HEXAPOLE",
  "TWIN_DIP",
  "STAR_5",
  "OCTUPOLE",
  "MIRROR",
  "NESTED",
  "SUNSPOT",
  "GRID3",
  "RING_8",
  "DBL_RING",
  "COIL",
  "HELMHLTZ",
  "SOLENOID",
  "PLASMA",
  "MAZE",
  "AURORA",
  "CHAOS",
]);

const GLYPH_SETS = Object.freeze([
  Object.freeze({ name: "SLIM", low: ".", mid: "'", high: ":" }),
  Object.freeze({ name: "LIGHT", low: ".", mid: "*", high: "+" }),
  Object.freeze({ name: "MEDIUM", low: ".", mid: "*", high: "#" }),
  Object.freeze({ name: "HEAVY", low: "o", mid: "O", high: "@" }),
  Object.freeze({ name: "FAT", low: "+", mid: "#", high: "M" }),
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
  ["DEFAULT", [33, 117, 220, 220]],
  ["MATRIX", [22, 34, 46, 118]],
  ["NOVA", [53, 129, 201, 219]],
  ["MONO", [240, 244, 250, 254]],
  ["OCEAN", [17, 33, 39, 51]],
  ["FIRE", [88, 124, 208, 226]],
  ["EARTH", [58, 100, 173, 230]],
  ["FOREST", [22, 28, 64, 144]],
  ["DESERT", [94, 130, 173, 222]],
  ["ARCTIC", [18, 39, 159, 231]],
];

const THEMES = Object.freeze(
  THEME_DEFINITIONS.map(([name, trails]) =>
    Object.freeze({
      name,
      trails: Object.freeze(trails.map(xterm256ToRgb)),
    }),
  ),
);

export { GLYPH_SETS, MAP, PATTERN_NAMES, SIM, THEMES };

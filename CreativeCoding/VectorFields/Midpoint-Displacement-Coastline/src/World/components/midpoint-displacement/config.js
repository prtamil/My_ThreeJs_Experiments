const MAP = Object.freeze({ width: 200, height: 56 });

const SIM = Object.freeze({
  linePoints: 257,
  maxLines: 8,
  defaultMorphRate: 0.1,
  minMorphRate: 0.01,
  maxMorphRate: 2,
  minTickRate: 10,
  defaultTickRate: 60,
  maxTickRate: 240,
  tickRateStep: 10,
  maxFrameDelta: 0.1,
  maxStepsPerFrame: 24,
});

const STYLE = Object.freeze({
  fillBelow: 0,
  fillAbove: 1,
  thinLine: 2,
});

const DENSITY = Object.freeze({ low: 0, mid: 1, high: 2 });

const PATTERN_NAMES = Object.freeze([
  "COASTLINE", "SKYLINE", "HORIZON", "DUNES", "CITY",
  "VALLEY", "CAVE", "CLIFF", "PLATEAU", "REEF",
  "MOUNTAINS", "HILLS", "ALPS", "RIDGES", "TERRACES",
  "WAVES", "STRATA", "FOREST", "RAPIDS", "SEDIMENT",
  "ATOLLS", "CRYSTAL", "SAWTOOTH", "NEBULA", "STORM",
  "AURORA", "CEILING", "ISLANDS", "PETRA", "CHAOS",
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
  ["DEFAULT", [39, 117, 220, 231]],
  ["MATRIX", [46, 82, 118, 154]],
  ["NOVA", [99, 165, 213, 219]],
  ["MONO", [245, 248, 251, 254]],
  ["OCEAN", [39, 51, 81, 159]],
  ["FIRE", [166, 208, 220, 226]],
  ["EARTH", [137, 173, 215, 230]],
  ["FOREST", [64, 107, 144, 187]],
  ["DESERT", [179, 215, 222, 230]],
  ["ARCTIC", [117, 153, 195, 231]],
];

const THEMES = Object.freeze(
  THEME_DEFINITIONS.map(([name, bands]) =>
    Object.freeze({
      name,
      bands: Object.freeze(bands.map(xterm256ToRgb)),
    }),
  ),
);

export {
  DENSITY,
  GLYPH_SETS,
  MAP,
  PATTERN_NAMES,
  SIM,
  STYLE,
  THEMES,
};

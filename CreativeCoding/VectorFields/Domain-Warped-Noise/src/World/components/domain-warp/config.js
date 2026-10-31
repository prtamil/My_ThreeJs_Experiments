const MAP = Object.freeze({ width: 200, height: 56 });

const SIM = Object.freeze({
  fpsMin: 10,
  fpsDefault: 60,
  fpsMax: 240,
  fpsStep: 10,
  frameCap: 60,
  maxFrameDelta: 0.1,
  maxStepsPerFrame: 32,
  driftMin: 1,
  driftDefault: 1,
  driftMax: 32,
  fieldDrift: 0.1,
  flashDecay: 4,
  flashInitial: 1,
  glowThreshold: 0.05,
});

const NOISE = Object.freeze({
  scale: 0.04,
  octaves: 4,
  persistence: 0.5,
  lacunarity: 2,
  warpAmount: 4,
  gamma: 0.65,
});

const PATTERN_NAMES = Object.freeze([
  "RAW",
  "WARP1",
  "WARP2",
  "WARP3",
  "RIDGE",
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
  ["DEFAULT", [17, 33, 220, 231], 226],
  ["MATRIX", [22, 34, 46, 118], 226],
  ["NOVA", [53, 129, 201, 219], 226],
  ["MONO", [234, 244, 250, 254], 226],
  ["OCEAN", [17, 33, 39, 51], 226],
  ["FIRE", [52, 124, 208, 226], 196],
  ["EARTH", [58, 100, 173, 230], 226],
  ["FOREST", [22, 28, 64, 144], 226],
  ["DESERT", [94, 130, 173, 222], 226],
  ["ARCTIC", [18, 39, 159, 231], 226],
];

const THEMES = Object.freeze(
  THEME_DEFINITIONS.map(([name, bands, flash]) =>
    Object.freeze({
      name,
      bands: Object.freeze(bands.map(xterm256ToRgb)),
      flash: Object.freeze(xterm256ToRgb(flash)),
    }),
  ),
);

export { MAP, NOISE, PATTERN_NAMES, SIM, THEMES };

const MAP = Object.freeze({
  width: 200,
  height: 56,
});

const SIM = Object.freeze({
  minCharges: 2,
  maxCharges: 8,
  defaultCharges: 4,
  chargeMagnitudeMin: 1,
  chargeMagnitudeMax: 2,
  driftMin: 1.5,
  driftMax: 4,
  maxFrameDelta: 0.1,
});

const FIELD = Object.freeze({
  levels: 6,
  cellAspect: 2,
  soften: 1.5,
  halfVoltage: 0.25,
});

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
  [
    "REDBLUE",
    [24, 25, 27, 33, 39, 45],
    [52, 88, 124, 160, 196, 203],
  ],
  [
    "COOLWARM",
    [24, 31, 38, 44, 51, 123],
    [94, 130, 166, 202, 214, 220],
  ],
  [
    "GREENMAGENTA",
    [53, 90, 127, 164, 201, 207],
    [24, 28, 34, 70, 76, 82],
  ],
];

const THEMES = Object.freeze(
  THEME_DEFINITIONS.map(([name, negative, positive]) =>
    Object.freeze({
      name,
      negative: Object.freeze(negative.map(xterm256ToRgb)),
      positive: Object.freeze(positive.map(xterm256ToRgb)),
    }),
  ),
);

export { FIELD, MAP, SIM, THEMES };

const MAP = Object.freeze({ width: 200, height: 56 });

const SIM = Object.freeze({
  minSources: 1,
  maxSources: 6,
  defaultSources: 2,
  shadeCount: 8,
  cellAspect: 2,
  minWavelength: 5,
  maxWavelength: 28,
  defaultWavelength: 10,
  wavelengthStep: 1,
  frequency: 0.5,
  maxFrameDelta: 0.10,
});

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
  return [
    ((hex >> 16) & 0xff) / 255,
    ((hex >> 8) & 0xff) / 255,
    (hex & 0xff) / 255,
  ];
}

const THEME_DEFINITIONS = [
  ["OCEAN", [24, 25, 31, 38, 45, 51, 123, 195]],
  ["FIRE", [52, 88, 124, 160, 196, 202, 214, 226]],
  ["PLASMA", [54, 92, 128, 164, 200, 206, 213, 219]],
  ["FOREST", [24, 28, 34, 70, 76, 82, 118, 191]],
  ["MONO", [240, 243, 246, 248, 250, 252, 254, 255]],
];

const THEMES = Object.freeze(
  THEME_DEFINITIONS.map(([name, colors]) =>
    Object.freeze({ name, colors: Object.freeze(colors.map(xterm256ToRgb)) }),
  ),
);

export { MAP, SIM, THEMES };

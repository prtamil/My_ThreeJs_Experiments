const FIELD_NAMES = Object.freeze([
  "Radial (outward)",
  "Circular (Z axis)",
  "Attractive (inward)",
  "Dynamic waves",
]);

const FIELD_SETTINGS = Object.freeze({
  gridSize: 10,
  spacing: 1,
  arrowLength: 0.56,
  headLength: 0.18,
  shaftRadius: 0.026,
  headRadius: 0.09,
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

export { FIELD_NAMES, FIELD_SETTINGS, THEMES };

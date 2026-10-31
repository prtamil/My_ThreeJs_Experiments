const MAP = Object.freeze({ width: 200, height: 56 });

const SIM = Object.freeze({
  fieldDrift: 1,
  arrowDeadZone: 0.06,
  noiseFrequency: 0.10,
  minDrift: 1,
  defaultDrift: 4,
  maxDrift: 16,
  minTickRate: 10,
  defaultTickRate: 60,
  maxTickRate: 240,
  tickRateStep: 10,
  maxFrameDelta: 0.1,
  maxTicksPerFrame: 24,
});

const PATTERN_NAMES = Object.freeze([
  "GRAD-PARAB", "GRAD-SADDL", "GRAD-PERIO", "GRAD-RIPPL", "GRAD-NOISE",
  "RADIAL-OUT", "RADIAL-IN", "ROTATION", "SHEAR-X", "UNIF-TILT",
  "POINT-CHG", "DIPOLE", "WIRE-MAG", "GRAVITY", "QUADRUPOLE",
  "CURL-NOISE", "STREAM-GRD", "VORTX-PAIR", "CHAN-FLOW", "NOISY-UNI",
  "STBL-NODE", "STBL-SPRL", "HOPF-CYCLE", "VAN-DR-POL", "PENDULUM",
  "ROT-DIPOLE", "TRAV-WAVE", "BREATHE", "ORBT-VORTX", "DRIFT-CURL",
]);

const PATTERN_TIERS = Object.freeze([
  "1-GRAD", "1-GRAD", "1-GRAD", "1-GRAD", "1-GRAD",
  "2-ANLY", "2-ANLY", "2-ANLY", "2-ANLY", "2-ANLY",
  "3-PHYS", "3-PHYS", "3-PHYS", "3-PHYS", "3-PHYS",
  "4-SOLN", "4-SOLN", "4-SOLN", "4-SOLN", "4-SOLN",
  "5-DYNS", "5-DYNS", "5-DYNS", "5-DYNS", "5-DYNS",
  "6-ANIM", "6-ANIM", "6-ANIM", "6-ANIM", "6-ANIM",
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
  ["DEFAULT", [75, 123, 220, 231]], ["MATRIX", [77, 118, 156, 194]],
  ["NOVA", [135, 171, 207, 219]], ["MONO", [247, 250, 253, 255]],
  ["OCEAN", [81, 117, 159, 195]], ["FIRE", [208, 214, 220, 227]],
  ["EARTH", [143, 179, 215, 222]], ["FOREST", [114, 150, 157, 194]],
  ["DESERT", [179, 215, 222, 229]], ["ARCTIC", [117, 159, 195, 231]],
];
const THEMES = Object.freeze(DEFINITIONS.map(([name, colors]) =>
  Object.freeze({ name, colors: Object.freeze(colors.map(xterm256ToRgb)) }),
));

export { MAP, PATTERN_NAMES, PATTERN_TIERS, SIM, THEMES };

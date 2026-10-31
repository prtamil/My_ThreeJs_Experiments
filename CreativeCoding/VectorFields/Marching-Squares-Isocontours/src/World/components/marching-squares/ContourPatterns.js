import { CASE_GLYPHS, GLYPH } from "./config.js";
import { hash32 } from "./ScalarField.js";

const THICK_BAND_HALF = 0.04;
const DUAL_LOW = 0.35;
const DUAL_HIGH = 0.65;
const SHELL_LOW = 0.46;
const SHELL_HIGH = 0.54;
const INNER_THRESHOLD = 0.7;
const OUTER_THRESHOLD = 0.3;
const SANDWICH_LEVELS = [0.3, 0.5, 0.7];
const STRIPE_HALF_WIDTH = 0.07;
const ZEBRA_BANDS = 8;
const SWEEP_MIN = 0.05;
const SWEEP_MAX = 0.95;
const PULSE_PERIOD = 3;
const RIPPLE_AMPLITUDE = 0.1;
const RIPPLE_FREQUENCY = 10;
const RIPPLE_SPEED = 2;
const STAIRS_LEVELS = 5;
const STAIRS_PERIOD = 8;
const CHAOS_AMPLITUDE = 0.1;

function emit(band, glyph) {
  return glyph | ((band & 3) << 4);
}

function unpackBand(packed) {
  return (packed >> 4) & 3;
}

function unpackGlyph(packed) {
  return packed & 15;
}

function isContourCase(marchingCase) {
  return marchingCase > 0 && marchingCase < 15;
}

function isSaddle(marchingCase) {
  return marchingCase === 5 || marchingCase === 10;
}

function isOrthogonal(marchingCase) {
  return (
    marchingCase === 3 ||
    marchingCase === 6 ||
    marchingCase === 9 ||
    marchingCase === 12
  );
}

function isDiagonal(marchingCase) {
  return (
    marchingCase === 1 ||
    marchingCase === 2 ||
    marchingCase === 4 ||
    marchingCase === 7 ||
    marchingCase === 8 ||
    marchingCase === 11 ||
    marchingCase === 13 ||
    marchingCase === 14
  );
}

function emitCase(field, x, y, threshold, band) {
  const marchingCase = field.classify(x, y, threshold);
  const glyph = CASE_GLYPHS[marchingCase];
  return glyph === GLYPH.blank ? 0 : emit(band, glyph);
}

function emitMultipleLevels(field, x, y, levelCount, realGlyphs = false) {
  let packed = 0;
  for (let level = 0; level < levelCount; level += 1) {
    const threshold = (level + 1) / (levelCount + 1);
    const marchingCase = field.classify(x, y, threshold);
    if (isContourCase(marchingCase)) {
      packed = emit(
        level,
        realGlyphs ? CASE_GLYPHS[marchingCase] : GLYPH.plus,
      );
    }
  }
  return packed;
}

function evaluatePattern(
  field,
  pattern,
  x,
  y,
  userThreshold,
  fieldTime,
  sweepPhase,
) {
  let marchingCase;

  switch (pattern) {
    case 0:
      return emitCase(field, x, y, userThreshold, 2);

    case 1: {
      const lowCase = field.classify(x, y, userThreshold - THICK_BAND_HALF);
      const centerCase = field.classify(x, y, userThreshold);
      const highCase = field.classify(x, y, userThreshold + THICK_BAND_HALF);
      if (
        !isContourCase(lowCase) &&
        !isContourCase(centerCase) &&
        !isContourCase(highCase)
      ) return 0;
      return emit(
        2,
        isContourCase(centerCase) ? CASE_GLYPHS[centerCase] : GLYPH.hash,
      );
    }

    case 2:
      marchingCase = field.classify(x, y, userThreshold);
      return isContourCase(marchingCase)
        ? emit(marchingCase, CASE_GLYPHS[marchingCase])
        : 0;

    case 3:
      marchingCase = field.classify(x, y, userThreshold);
      return isContourCase(marchingCase) ? emit(1, GLYPH.dot) : 0;

    case 4:
      marchingCase = field.classify(x, y, userThreshold);
      return isContourCase(marchingCase) ? emit(2, GLYPH.plus) : 0;

    case 5:
      return emitMultipleLevels(field, x, y, 8);

    case 6:
      return emitMultipleLevels(field, x, y, 16);

    case 7:
      return emitMultipleLevels(field, x, y, 4);

    case 8:
      return emitMultipleLevels(field, x, y, 6, true);

    case 9: {
      let packed = 0;
      for (let level = 0; level < 12; level += 1) {
        const threshold = (level + 1) / 13;
        marchingCase = field.classify(x, y, threshold);
        if (isContourCase(marchingCase)) {
          packed = emit(level + marchingCase, GLYPH.plus);
        }
      }
      return packed;
    }

    case 10: {
      let packed = 0;
      marchingCase = field.classify(x, y, DUAL_LOW);
      if (isContourCase(marchingCase)) {
        packed = emit(1, CASE_GLYPHS[marchingCase]);
      }
      marchingCase = field.classify(x, y, DUAL_HIGH);
      if (isContourCase(marchingCase)) {
        packed = emit(3, CASE_GLYPHS[marchingCase]);
      }
      return packed;
    }

    case 11: {
      const value = field.at(x, y);
      return value >= SHELL_LOW && value <= SHELL_HIGH
        ? emit(2, GLYPH.hash)
        : 0;
    }

    case 12:
      return emitCase(field, x, y, INNER_THRESHOLD, 3);

    case 13:
      return emitCase(field, x, y, OUTER_THRESHOLD, 1);

    case 14: {
      let packed = 0;
      for (let level = 0; level < SANDWICH_LEVELS.length; level += 1) {
        marchingCase = field.classify(x, y, SANDWICH_LEVELS[level]);
        if (isContourCase(marchingCase)) {
          packed = emit(level + 1, CASE_GLYPHS[marchingCase]);
        }
      }
      return packed;
    }

    case 15:
      marchingCase = field.classify(x, y, userThreshold);
      if (!isContourCase(marchingCase)) return 0;
      return isSaddle(marchingCase)
        ? emit(3, GLYPH.x)
        : emit(1, CASE_GLYPHS[marchingCase]);

    case 16:
      marchingCase = field.classify(x, y, userThreshold);
      return isOrthogonal(marchingCase)
        ? emit(2, CASE_GLYPHS[marchingCase])
        : 0;

    case 17:
      marchingCase = field.classify(x, y, userThreshold);
      return isDiagonal(marchingCase)
        ? emit(2, CASE_GLYPHS[marchingCase])
        : 0;

    case 18:
      for (let level = 0; level < 8; level += 1) {
        const threshold = (level + 1) / 9;
        if (isSaddle(field.classify(x, y, threshold))) {
          return emit(3, GLYPH.x);
        }
      }
      marchingCase = field.classify(x, y, userThreshold);
      return isContourCase(marchingCase)
        ? emit(1, CASE_GLYPHS[marchingCase])
        : 0;

    case 19:
      marchingCase = field.classify(x, y, userThreshold);
      return isContourCase(marchingCase)
        ? emit(marchingCase, CASE_GLYPHS[marchingCase])
        : 0;

    case 20:
      return field.at(x, y) >= userThreshold ? emit(3, GLYPH.hash) : 0;

    case 21:
      return field.at(x, y) < userThreshold ? emit(1, GLYPH.hash) : 0;

    case 22: {
      const value = field.at(x, y);
      return (
        value >= userThreshold - STRIPE_HALF_WIDTH &&
        value <= userThreshold + STRIPE_HALF_WIDTH
      ) ? emit(2, GLYPH.hash) : 0;
    }

    case 23: {
      const band = Math.trunc(field.at(x, y) * ZEBRA_BANDS);
      return band % 2 === 0 ? emit(band, GLYPH.hash) : 0;
    }

    case 24:
      marchingCase = field.classify(x, y, userThreshold);
      return isContourCase(marchingCase) ? emit(2, GLYPH.hash) : 0;

    case 25: {
      const middle = (SWEEP_MIN + SWEEP_MAX) * 0.5;
      const amplitude = (SWEEP_MAX - SWEEP_MIN) * 0.5;
      const threshold = middle + amplitude * Math.sin(sweepPhase * Math.PI * 2);
      return emitCase(field, x, y, threshold, 2);
    }

    case 26: {
      const sine = Math.sin(fieldTime * (Math.PI * 2 / PULSE_PERIOD));
      const threshold = SWEEP_MIN + (SWEEP_MAX - SWEEP_MIN) * sine * sine;
      return emitCase(field, x, y, threshold, 2);
    }

    case 27: {
      const dx = x - field.width * 0.5;
      const dy = y - field.height * 0.5;
      const distance = Math.hypot(dx, dy);
      const threshold = userThreshold + RIPPLE_AMPLITUDE * Math.sin(
        distance / RIPPLE_FREQUENCY - fieldTime * RIPPLE_SPEED,
      );
      return emitCase(field, x, y, threshold, 2);
    }

    case 28: {
      const phase = (fieldTime % STAIRS_PERIOD) / STAIRS_PERIOD;
      const step = Math.min(Math.trunc(phase * STAIRS_LEVELS), STAIRS_LEVELS - 1);
      const threshold = (step + 1) / (STAIRS_LEVELS + 1);
      return emitCase(field, x, y, threshold, step);
    }

    case 29: {
      const timeStep = Math.trunc(fieldTime * 7);
      const mixed = (
        Math.imul(x, 374761393) +
        Math.imul(y, 668265263) +
        Math.imul(timeStep, 2147483647)
      ) >>> 0;
      const jitter = (((hash32(mixed) >>> 8) / 16777215) - 0.5) * 2;
      return emitCase(
        field,
        x,
        y,
        userThreshold + jitter * CHAOS_AMPLITUDE,
        2,
      );
    }

    default:
      return 0;
  }
}

function evaluateAllCells(
  field,
  pattern,
  userThreshold,
  fieldTime,
  sweepPhase,
  glow,
  bands,
  glyphs,
) {
  for (let y = 0; y < field.height; y += 1) {
    for (let x = 0; x < field.width; x += 1) {
      const index = y * field.width + x;
      const packed = evaluatePattern(
        field,
        pattern,
        x,
        y,
        userThreshold,
        fieldTime,
        sweepPhase,
      );
      glow[index] = packed === 0 ? 0 : 1;
      bands[index] = unpackBand(packed);
      glyphs[index] = unpackGlyph(packed);
    }
  }
}

export {
  evaluateAllCells,
  evaluatePattern,
  isDiagonal,
  isOrthogonal,
  isSaddle,
};

import { DENSITY, SIM, STYLE } from "./config.js";

function lineSpec(height, options) {
  return {
    yCenter: height * options.y,
    amplitude: height * options.amplitude,
    roughness: options.roughness,
    leftOffset: height * (options.left ?? 0),
    rightOffset: height * (options.right ?? 0),
    band: options.band,
    outlineBand: options.outline ?? -1,
    style: options.style ?? STYLE.fillBelow,
    density: options.density ?? DENSITY.high,
  };
}

function layeredSpecs(height, settings) {
  return settings.slice(0, SIM.maxLines).map((setting) =>
    lineSpec(height, setting),
  );
}

function coarseRandom(random) {
  return Math.floor(random() * 1000) / 1000;
}

function createChaos(height, random) {
  const specs = [];
  for (let index = 0; index < SIM.maxLines; index += 1) {
    const outline = Math.floor(random() * 3) === 0
      ? Math.floor(random() * 4)
      : -1;
    specs.push(lineSpec(height, {
      y: 0.1 + coarseRandom(random) * 0.8,
      amplitude: 0.05 + coarseRandom(random) * 0.2,
      roughness: 0.3 + coarseRandom(random) * 0.55,
      band: Math.floor(random() * 4),
      outline,
      style: Math.floor(random() * 3),
      density: DENSITY.high,
    }));
  }
  return specs;
}

function createPatternSpecs(pattern, height, random = Math.random) {
  switch (pattern) {
    case 0:
      return layeredSpecs(height, [
        { y: 0.6, amplitude: 0.2, roughness: 0.55, band: 0, outline: 2 },
      ]);
    case 1:
      return layeredSpecs(height, [
        { y: 0.3, amplitude: 0.18, roughness: 0.55, band: 3, outline: 1, style: STYLE.fillAbove },
      ]);
    case 2:
      return layeredSpecs(height, [
        { y: 0.5, amplitude: 0.1, roughness: 0.5, band: 2, style: STYLE.thinLine },
      ]);
    case 3:
      return layeredSpecs(height, [
        { y: 0.65, amplitude: 0.15, roughness: 0.4, band: 1, density: DENSITY.mid },
      ]);
    case 4:
      return layeredSpecs(height, [
        { y: 0.7, amplitude: 0.3, roughness: 0.75, band: 1, outline: 3 },
      ]);
    case 5:
      return layeredSpecs(height, [
        { y: 0.25, amplitude: 0.15, roughness: 0.55, band: 2, style: STYLE.fillAbove, density: DENSITY.mid },
        { y: 0.75, amplitude: 0.15, roughness: 0.55, band: 0, density: DENSITY.mid },
      ]);
    case 6:
      return layeredSpecs(height, [
        { y: 0.4, amplitude: 0.08, roughness: 0.55, band: 2, outline: 3, style: STYLE.fillAbove },
        { y: 0.6, amplitude: 0.08, roughness: 0.55, band: 2, outline: 3 },
      ]);
    case 7:
      return layeredSpecs(height, [
        { y: 0.5, amplitude: 0.1, roughness: 0.55, left: -0.25, right: 0.25, band: 1, outline: 3 },
      ]);
    case 8:
      return layeredSpecs(height, [
        { y: 0.5, amplitude: 0.25, roughness: 0.3, band: 1, outline: 3 },
      ]);
    case 9:
      return layeredSpecs(height, [
        { y: 0.85, amplitude: 0.06, roughness: 0.55, band: 0, density: DENSITY.low },
        { y: 0.6, amplitude: 0.18, roughness: 0.65, band: 2, outline: 3 },
      ]);
    case 10:
      return layeredSpecs(height, [
        { y: 0.45, amplitude: 0.18, roughness: 0.58, band: 3, density: DENSITY.low },
        { y: 0.55, amplitude: 0.2, roughness: 0.58, band: 2, density: DENSITY.low },
        { y: 0.65, amplitude: 0.22, roughness: 0.58, band: 1, density: DENSITY.mid },
        { y: 0.75, amplitude: 0.25, roughness: 0.58, band: 0 },
      ]);
    case 11:
      return layeredSpecs(height, [
        { y: 0.55, amplitude: 0.18, roughness: 0.4, band: 3, density: DENSITY.low },
        { y: 0.65, amplitude: 0.2, roughness: 0.4, band: 2, density: DENSITY.mid },
        { y: 0.75, amplitude: 0.22, roughness: 0.4, band: 0 },
      ]);
    case 12:
      return layeredSpecs(height, [
        { y: 0.4, amplitude: 0.25, roughness: 0.7, band: 3, density: DENSITY.low },
        { y: 0.55, amplitude: 0.28, roughness: 0.72, band: 2, density: DENSITY.mid },
        { y: 0.7, amplitude: 0.3, roughness: 0.75, band: 0 },
      ]);
    case 13:
      return layeredSpecs(height, [
        { y: 0.3, amplitude: 0.1, roughness: 0.65, band: 3, style: STYLE.thinLine },
        { y: 0.45, amplitude: 0.12, roughness: 0.65, band: 2, style: STYLE.thinLine },
        { y: 0.6, amplitude: 0.15, roughness: 0.65, band: 1, style: STYLE.thinLine },
        { y: 0.75, amplitude: 0.18, roughness: 0.65, band: 0, style: STYLE.thinLine },
      ]);
    case 14:
      return layeredSpecs(height, [
        { y: 0.3, amplitude: 0.08, roughness: 0.3, band: 3, density: DENSITY.low },
        { y: 0.45, amplitude: 0.08, roughness: 0.3, band: 2, density: DENSITY.low },
        { y: 0.6, amplitude: 0.08, roughness: 0.3, band: 1, density: DENSITY.mid },
        { y: 0.75, amplitude: 0.08, roughness: 0.3, band: 0 },
      ]);
    case 15:
      return layeredSpecs(height, Array.from({ length: 6 }, (_, index) => ({
        y: (index + 1) / 7,
        amplitude: 0.04,
        roughness: 0.55,
        band: index & 3,
        style: STYLE.thinLine,
      })));
    case 16:
      return layeredSpecs(height, Array.from({ length: 7 }, (_, index) => ({
        y: (index + 1) / 8,
        amplitude: 0.02,
        roughness: 0.35,
        band: index & 3,
        style: STYLE.thinLine,
      })));
    case 17:
      return layeredSpecs(height, [
        { y: 0.4, amplitude: 0.1, roughness: 0.65, band: 3, density: DENSITY.low },
        { y: 0.5, amplitude: 0.1, roughness: 0.65, band: 2, density: DENSITY.low },
        { y: 0.6, amplitude: 0.1, roughness: 0.65, band: 1, density: DENSITY.mid },
        { y: 0.7, amplitude: 0.1, roughness: 0.65, band: 2, density: DENSITY.mid },
        { y: 0.8, amplitude: 0.1, roughness: 0.65, band: 0 },
      ]);
    case 18:
      return layeredSpecs(height, [0.45, 0.5, 0.55, 0.6, 0.65].map((y, index) => ({
        y, amplitude: 0.02, roughness: 0.7, band: index & 3, style: STYLE.thinLine,
      })));
    case 19:
      return layeredSpecs(height, [
        { y: 0.45, amplitude: 0.1, roughness: 0.4, band: 3, density: DENSITY.low },
        { y: 0.55, amplitude: 0.1, roughness: 0.4, band: 2, density: DENSITY.low },
        { y: 0.65, amplitude: 0.1, roughness: 0.4, band: 1, density: DENSITY.mid },
        { y: 0.75, amplitude: 0.1, roughness: 0.4, band: 0 },
        { y: 0.85, amplitude: 0.1, roughness: 0.4, band: 0 },
      ]);
    case 20:
      return layeredSpecs(height, [
        { y: 0.78, amplitude: 0.1, roughness: 0.8, band: 0, outline: 3 },
      ]);
    case 21:
      return layeredSpecs(height, [
        { y: 0.55, amplitude: 0.3, roughness: 0.85, band: 2, outline: 3 },
      ]);
    case 22:
      return layeredSpecs(height, [
        { y: 0.55, amplitude: 0.25, roughness: 0.7, left: -0.2, right: 0.2, band: 1, outline: 3 },
      ]);
    case 23:
      return layeredSpecs(height, [0.2, 0.3, 0.45, 0.55, 0.7, 0.85].map((y, index) => ({
        y, amplitude: 0.12, roughness: 0.4, band: index & 3, style: STYLE.thinLine,
      })));
    case 24:
      return layeredSpecs(height, [
        { y: 0.15, amplitude: 0.15, roughness: 0.7, band: 2, style: STYLE.fillAbove, density: DENSITY.low },
        { y: 0.25, amplitude: 0.18, roughness: 0.7, band: 1, style: STYLE.fillAbove, density: DENSITY.mid },
        { y: 0.35, amplitude: 0.2, roughness: 0.7, band: 0, style: STYLE.fillAbove },
        { y: 0.85, amplitude: 0.1, roughness: 0.55, band: 0 },
      ]);
    case 25:
      return layeredSpecs(height, [
        { y: 0.2, amplitude: 0.15, roughness: 0.35, band: 3, style: STYLE.thinLine },
        { y: 0.25, amplitude: 0.12, roughness: 0.35, band: 2, style: STYLE.thinLine },
        { y: 0.3, amplitude: 0.1, roughness: 0.35, band: 1, style: STYLE.thinLine },
        { y: 0.35, amplitude: 0.08, roughness: 0.35, band: 0, style: STYLE.thinLine },
      ]);
    case 26:
      return layeredSpecs(height, [
        { y: 0.3, amplitude: 0.15, roughness: 0.8, band: 1, outline: 3, style: STYLE.fillAbove },
      ]);
    case 27:
      return layeredSpecs(height, [
        { y: 0.75, amplitude: 0.1, roughness: 0.65, band: 0, outline: 2 },
      ]);
    case 28:
      return layeredSpecs(height, [
        { y: 0.45, amplitude: 0.1, roughness: 0.5, left: -0.1, right: 0.05, band: 3, density: DENSITY.low },
        { y: 0.6, amplitude: 0.1, roughness: 0.5, left: 0.05, right: -0.1, band: 2, density: DENSITY.mid },
        { y: 0.75, amplitude: 0.1, roughness: 0.5, left: -0.05, right: 0.1, band: 1 },
      ]);
    case 29:
      return createChaos(height, random);
    default:
      return createPatternSpecs(0, height, random);
  }
}

export { createPatternSpecs };

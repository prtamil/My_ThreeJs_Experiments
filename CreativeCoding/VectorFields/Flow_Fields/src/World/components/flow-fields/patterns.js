import { FIELD, PATTERN } from "./config.js";

function vortices(attractors, x, y, out) {
  let velocityX = 0;
  let velocityY = 0;

  for (const attractor of attractors) {
    const dx = x - attractor.x;
    const dy = y - attractor.y;
    const radiusSquared = dx * dx + dy * dy + FIELD.epsilonR2;
    const weight =
      (attractor.strength / radiusSquared) * attractor.sign;
    velocityX += -dy * weight;
    velocityY += dx * weight;
  }

  out[0] = velocityX;
  out[1] = velocityY;
}

function magnet(attractors, x, y, out) {
  let velocityX = 0;
  let velocityY = 0;

  for (const attractor of attractors) {
    const dx = x - attractor.x;
    const dy = y - attractor.y;
    const radiusSquared = dx * dx + dy * dy + FIELD.epsilonR2;
    const weight =
      (-attractor.sign * attractor.strength) / radiusSquared;
    velocityX += dx * weight;
    velocityY += dy * weight;
  }

  out[0] = velocityX;
  out[1] = velocityY;
}

function spiral(attractors, x, y, out) {
  let velocityX = 0;
  let velocityY = 0;

  for (const attractor of attractors) {
    const dx = x - attractor.x;
    const dy = y - attractor.y;
    const radiusSquared = dx * dx + dy * dy + FIELD.epsilonR2;
    const weight =
      (attractor.strength / radiusSquared) * attractor.sign;
    velocityX += -dy * weight - (dx * FIELD.spiralInflow) / radiusSquared;
    velocityY += dx * weight - (dy * FIELD.spiralInflow) / radiusSquared;
  }

  out[0] = velocityX;
  out[1] = velocityY;
}

function galaxy(attractors, x, y, out) {
  let velocityX = 0;
  let velocityY = 0;

  for (const attractor of attractors) {
    const dx = x - attractor.x;
    const dy = y - attractor.y;
    const radiusSquared = dx * dx + dy * dy + FIELD.epsilonR2;
    const radius = Math.sqrt(radiusSquared);
    const theta = Math.atan2(dy, dx);
    const arm =
      1 +
      FIELD.galaxyArmAmplitude *
        Math.cos(theta * 2 - radius * FIELD.galaxyArmPitch);
    const weight =
      (attractor.strength / radiusSquared) * attractor.sign * arm;
    velocityX += -dy * weight - (dx * FIELD.galaxyInflow) / radiusSquared;
    velocityY += dx * weight - (dy * FIELD.galaxyInflow) / radiusSquared;
  }

  out[0] = velocityX;
  out[1] = velocityY;
}

function wake(attractors, x, y, out) {
  let velocityX = FIELD.wakeFreeStream;
  let velocityY = 0;

  for (const attractor of attractors) {
    const dx = x - attractor.x;
    const dy = y - attractor.y;
    const radiusSquared = dx * dx + dy * dy + FIELD.epsilonR2;
    const weight =
      (attractor.strength / radiusSquared) * attractor.sign;
    velocityX += -dy * weight;
    velocityY += dx * weight;
  }

  out[0] = velocityX;
  out[1] = velocityY;
}

function sampleVelocity(simulation, x, y, out) {
  const { activeAttractors, pattern, time, width, height } = simulation;
  const centreX = width * 0.5;
  const centreY = height * 0.5;
  let dx;
  let dy;
  let radius;
  let radiusSquared;
  let scaledX;
  let scaledY;

  switch (pattern) {
    case PATTERN.VORTICES:
    case PATTERN.CHAIN:
    case PATTERN.GRID:
    case PATTERN.TURBULENT:
      vortices(activeAttractors, x, y, out);
      return;

    case PATTERN.WAVE:
      out[0] = Math.sin(y * FIELD.waveFrequency + time) * 5;
      out[1] = Math.cos(x * FIELD.waveFrequency - time * 0.7) * 5;
      return;

    case PATTERN.SADDLE:
      out[0] = (x - centreX) * FIELD.saddleRate;
      out[1] = -(y - centreY) * FIELD.saddleRate;
      return;

    case PATTERN.MAGNET:
    case PATTERN.QUADPOLE:
      magnet(activeAttractors, x, y, out);
      return;

    case PATTERN.SPIRAL:
      spiral(activeAttractors, x, y, out);
      return;

    case PATTERN.RADIAL:
      out[0] = (x - centreX) * FIELD.radialRate;
      out[1] = (y - centreY) * FIELD.radialRate;
      return;

    case PATTERN.SHEAR:
      out[0] = (y - centreY) * FIELD.shearRate;
      out[1] = 0;
      return;

    case PATTERN.RIPPLE: {
      dx = x - centreX;
      dy = y - centreY;
      radius = Math.sqrt(dx * dx + dy * dy) + 0.001;
      const wave = Math.sin(
        radius * FIELD.rippleWaveNumber - time * FIELD.rippleFrequency,
      );
      out[0] = (dx / radius) * wave * FIELD.rippleAmplitude;
      out[1] = (dy / radius) * wave * FIELD.rippleAmplitude;
      return;
    }

    case PATTERN.CIRCULAR:
      out[0] = -(y - centreY) * FIELD.circularRate;
      out[1] = (x - centreX) * FIELD.circularRate;
      return;

    case PATTERN.GALAXY:
      galaxy(activeAttractors, x, y, out);
      return;

    case PATTERN.DUFFING:
      scaledX = (x - centreX) * FIELD.duffingScale;
      scaledY = (y - centreY) * FIELD.duffingScale;
      out[0] = scaledY;
      out[1] =
        -scaledX -
        FIELD.duffingDamping * scaledY -
        scaledX * scaledX * scaledX;
      return;

    case PATTERN.VANDERPOL:
      scaledX = (x - centreX) * FIELD.vanDerPolScale;
      scaledY = (y - centreY) * FIELD.vanDerPolScale;
      out[0] = scaledY;
      out[1] =
        FIELD.vanDerPolMu * (1 - scaledX * scaledX) * scaledY - scaledX;
      return;

    case PATTERN.PENDULUM:
      scaledX = (x - centreX) * FIELD.pendulumScale;
      scaledY = (y - centreY) * FIELD.pendulumScale;
      out[0] = scaledY;
      out[1] = -Math.sin(scaledX);
      return;

    case PATTERN.LOTKA:
      scaledX =
        Math.max((x - centreX) * FIELD.lotkaScale + FIELD.lotkaOffset, 0.01);
      scaledY =
        Math.max((y - centreY) * FIELD.lotkaScale + FIELD.lotkaOffset, 0.01);
      out[0] =
        FIELD.lotkaAlpha * scaledX -
        FIELD.lotkaBeta * scaledX * scaledY;
      out[1] =
        FIELD.lotkaDelta * scaledX * scaledY -
        FIELD.lotkaGamma * scaledY;
      return;

    case PATTERN.HOPF:
      scaledX = (x - centreX) * FIELD.hopfScale;
      scaledY = (y - centreY) * FIELD.hopfScale;
      radiusSquared = scaledX * scaledX + scaledY * scaledY;
      out[0] =
        FIELD.hopfMu * scaledX - scaledY - scaledX * radiusSquared;
      out[1] =
        scaledX + FIELD.hopfMu * scaledY - scaledY * radiusSquared;
      return;

    case PATTERN.NEWTON: {
      const zx = (x - centreX) * FIELD.newtonScale;
      const zy = (y - centreY) * FIELD.newtonScale;
      const functionReal = zx * zx * zx - 3 * zx * zy * zy - 1;
      const functionImaginary = 3 * zx * zx * zy - zy * zy * zy;
      const derivativeReal = 3 * (zx * zx - zy * zy);
      const derivativeImaginary = 6 * zx * zy;
      const denominator =
        derivativeReal * derivativeReal +
        derivativeImaginary * derivativeImaginary +
        FIELD.epsilonR2;
      out[0] =
        -(functionReal * derivativeReal +
          functionImaginary * derivativeImaginary) /
        denominator;
      out[1] =
        -(functionImaginary * derivativeReal -
          functionReal * derivativeImaginary) /
        denominator;
      return;
    }

    case PATTERN.JET:
      dy = Math.max(-1, Math.min(1, (y - centreY) / (height * 0.5)));
      out[0] = FIELD.jetStrength * (1 - dy * dy);
      out[1] = 0;
      return;

    case PATTERN.HURRICANE: {
      dx = x - centreX;
      dy = y - centreY;
      radius = Math.sqrt(dx * dx + dy * dy);
      const normalizedRadius = radius / FIELD.hurricaneRadius;
      const envelope =
        normalizedRadius * Math.exp(-normalizedRadius * normalizedRadius);
      const inverseRadius = 1 / (radius + 1);
      out[0] =
        (-dy * FIELD.hurricaneStrength - dx * FIELD.hurricaneInflow) *
        envelope *
        inverseRadius;
      out[1] =
        (dx * FIELD.hurricaneStrength - dy * FIELD.hurricaneInflow) *
        envelope *
        inverseRadius;
      return;
    }

    case PATTERN.HAMILTON:
      scaledX = (x - centreX) * FIELD.hamiltonScale;
      scaledY = (y - centreY) * FIELD.hamiltonScale;
      out[0] = scaledY;
      out[1] = scaledX - 2 * scaledX * scaledX * scaledX;
      return;

    case PATTERN.WAKE:
      wake(activeAttractors, x, y, out);
      return;

    case PATTERN.STANDING: {
      const temporal = Math.cos(time * FIELD.standingOmega);
      out[0] =
        Math.sin(x * FIELD.standingK) * temporal * FIELD.standingAmplitude;
      out[1] =
        Math.sin(y * FIELD.standingK) * temporal * FIELD.standingAmplitude;
      return;
    }

    case PATTERN.PLANE: {
      const phase =
        FIELD.planeKx * x + FIELD.planeKy * y - FIELD.planeOmega * time;
      const waveNumberMagnitude = Math.sqrt(
        FIELD.planeKx * FIELD.planeKx + FIELD.planeKy * FIELD.planeKy,
      );
      const wave = Math.sin(phase) * FIELD.planeAmplitude;
      out[0] = (FIELD.planeKx / waveNumberMagnitude) * wave;
      out[1] = (FIELD.planeKy / waveNumberMagnitude) * wave;
      return;
    }

    case PATTERN.GRADIENT: {
      dx = x - centreX;
      dy = y - centreY;
      radiusSquared = dx * dx + dy * dy;
      const sigmaSquared = FIELD.gradientSigma * FIELD.gradientSigma;
      const falloff = Math.exp(-radiusSquared / (2 * sigmaSquared));
      out[0] =
        (-dx / sigmaSquared) * falloff * FIELD.gradientStrength;
      out[1] =
        (-dy / sigmaSquared) * falloff * FIELD.gradientStrength;
      return;
    }

    case PATTERN.EDDY: {
      dx = x - centreX;
      dy = y - centreY;
      radiusSquared = dx * dx + dy * dy;
      const falloff = Math.exp(
        -radiusSquared / (2 * FIELD.eddySigma * FIELD.eddySigma),
      );
      out[0] = -dy * FIELD.eddyStrength * falloff;
      out[1] = dx * FIELD.eddyStrength * falloff;
      return;
    }

    case PATTERN.PITCHFORK:
      scaledX = (x - centreX) * FIELD.pitchforkScale;
      scaledY = (y - centreY) * FIELD.pitchforkScale;
      out[0] =
        FIELD.pitchforkMu * scaledX - scaledX * scaledX * scaledX;
      out[1] = -scaledY;
      return;

    case PATTERN.HENON:
      scaledX = (x - centreX) * FIELD.henonScale;
      scaledY = (y - centreY) * FIELD.henonScale;
      out[0] =
        1 - FIELD.henonA * scaledX * scaledX + scaledY - scaledX;
      out[1] = FIELD.henonB * scaledX - scaledY;
      return;

    default:
      out[0] = 0;
      out[1] = 0;
  }
}

export { sampleVelocity };

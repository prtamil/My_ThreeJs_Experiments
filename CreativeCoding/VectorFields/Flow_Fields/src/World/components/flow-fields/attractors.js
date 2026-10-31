import { FIELD, PATTERN, SIM } from "./config.js";

function marker(x, y) {
  return { bx: x, by: y, ox: 0, oy: 0, phase: 0, strength: 0, sign: 1 };
}

function vortex(bx, by, ox, oy, phase, strength, sign) {
  return { bx, by, ox, oy, phase, strength, sign };
}

function centreMarker(cx, cy) {
  return [marker(cx, cy)];
}

function vorticesAtQuarters(cx, cy, width, height) {
  const attractors = [];
  const radiusX = width * 0.25;
  const radiusY = height * 0.25;

  for (let index = 0; index < 4; index += 1) {
    const angle = index * Math.PI * 0.5;
    attractors.push(
      vortex(
        cx + radiusX * Math.cos(angle),
        cy + radiusY * Math.sin(angle),
        4,
        4,
        index * 0.7,
        FIELD.vortexStrength,
        index % 2 === 0 ? 1 : -1,
      ),
    );
  }

  return attractors;
}

function magnetDipole(cx, cy, width) {
  const offsetX = width * 0.2;
  return [
    vortex(cx - offsetX, cy, 3, 2, 0, FIELD.magnetStrength, 1),
    vortex(cx + offsetX, cy, 3, 2, Math.PI, FIELD.magnetStrength, -1),
  ];
}

function turbulentField(width, height) {
  const attractors = [];

  for (let index = 0; index < 20; index += 1) {
    attractors.push(
      vortex(
        Math.random() * width,
        Math.random() * height,
        2,
        2,
        index * 0.31,
        FIELD.turbulentStrength,
        Math.random() < 0.5 ? 1 : -1,
      ),
    );
  }

  return attractors;
}

function chain(cy, width) {
  const attractors = [];
  const spacing = width / (FIELD.chainCount + 1);

  for (let index = 0; index < FIELD.chainCount; index += 1) {
    attractors.push(
      vortex(
        spacing * (index + 1),
        cy + (index % 2 === 0 ? -FIELD.chainZigzagY : FIELD.chainZigzagY),
        2,
        2,
        index * 0.5,
        FIELD.chainStrength,
        index % 2 === 0 ? 1 : -1,
      ),
    );
  }

  return attractors;
}

function vortexGrid(width, height) {
  const attractors = [];
  const spacingX = width / (FIELD.gridCount + 1);
  const spacingY = height / (FIELD.gridCount + 1);
  let index = 0;

  for (let gridY = 0; gridY < FIELD.gridCount; gridY += 1) {
    for (let gridX = 0; gridX < FIELD.gridCount; gridX += 1) {
      attractors.push(
        vortex(
          spacingX * (gridX + 1),
          spacingY * (gridY + 1),
          1.5,
          1.5,
          index * 0.4,
          FIELD.gridStrength,
          (gridX + gridY) % 2 === 0 ? 1 : -1,
        ),
      );
      index += 1;
    }
  }

  return attractors;
}

function wake(cy, width) {
  const obstacleX = width * FIELD.wakeObstacleRelativeX;
  const downstreamStart = obstacleX + FIELD.wakeObstacleGap;
  const spacing =
    (width - downstreamStart) / (FIELD.wakeVortexCount + 1);
  const attractors = [marker(obstacleX, cy)];

  for (let index = 0; index < FIELD.wakeVortexCount; index += 1) {
    attractors.push(
      vortex(
        downstreamStart + spacing * index,
        cy +
          (index % 2 === 0
            ? -FIELD.wakeZigzagAmplitude
            : FIELD.wakeZigzagAmplitude),
        1.5,
        1.5,
        index * 0.4,
        FIELD.wakeVortexStrength,
        index % 2 === 0 ? 1 : -1,
      ),
    );
  }

  return attractors;
}

function quadpole(cx, cy, width, height) {
  const dx = width * FIELD.quadpoleSeparation;
  const dy = height * FIELD.quadpoleSeparation;
  return [
    vortex(cx - dx, cy - dy, 0, 0, 0, FIELD.quadpoleStrength, 1),
    vortex(cx + dx, cy - dy, 0, 0, 0, FIELD.quadpoleStrength, -1),
    vortex(cx + dx, cy + dy, 0, 0, 0, FIELD.quadpoleStrength, 1),
    vortex(cx - dx, cy + dy, 0, 0, 0, FIELD.quadpoleStrength, -1),
  ];
}

function duffingMarkers(cx, cy) {
  const distance = 1 / FIELD.duffingScale;
  return [marker(cx - distance, cy), marker(cx + distance, cy)];
}

function newtonMarkers(cx, cy) {
  const distance = 1 / FIELD.newtonScale;
  const rootY = Math.sin(Math.PI / 3) / FIELD.newtonScale;
  return [
    marker(cx + distance, cy),
    marker(cx - distance * 0.5, cy + rootY),
    marker(cx - distance * 0.5, cy - rootY),
  ];
}

function hamiltonMarkers(cx, cy) {
  const distance = 1 / (Math.sqrt(2) * FIELD.hamiltonScale);
  return [
    marker(cx, cy),
    marker(cx + distance, cy),
    marker(cx - distance, cy),
  ];
}

function pitchforkMarkers(cx, cy) {
  const distance = Math.sqrt(FIELD.pitchforkMu) / FIELD.pitchforkScale;
  return [
    marker(cx, cy),
    marker(cx + distance, cy),
    marker(cx - distance, cy),
  ];
}

function createAttractors(pattern, width, height) {
  const cx = width * 0.5;
  const cy = height * 0.5;

  switch (pattern) {
    case PATTERN.VORTICES:
      return vorticesAtQuarters(cx, cy, width, height);
    case PATTERN.MAGNET:
      return magnetDipole(cx, cy, width);
    case PATTERN.TURBULENT:
      return turbulentField(width, height);
    case PATTERN.SPIRAL:
      return [vortex(cx, cy, 0, 0, 0, FIELD.spiralStrength, 1)];
    case PATTERN.GALAXY:
      return [vortex(cx, cy, 0, 0, 0, FIELD.galaxyStrength, 1)];
    case PATTERN.CHAIN:
      return chain(cy, width);
    case PATTERN.GRID:
      return vortexGrid(width, height);
    case PATTERN.WAKE:
      return wake(cy, width);
    case PATTERN.QUADPOLE:
      return quadpole(cx, cy, width, height);
    case PATTERN.DUFFING:
      return duffingMarkers(cx, cy);
    case PATTERN.NEWTON:
      return newtonMarkers(cx, cy);
    case PATTERN.HAMILTON:
      return hamiltonMarkers(cx, cy);
    case PATTERN.PITCHFORK:
      return pitchforkMarkers(cx, cy);
    case PATTERN.RADIAL:
    case PATTERN.RIPPLE:
    case PATTERN.CIRCULAR:
    case PATTERN.VANDERPOL:
    case PATTERN.PENDULUM:
    case PATTERN.LOTKA:
    case PATTERN.HOPF:
    case PATTERN.HURRICANE:
    case PATTERN.GRADIENT:
    case PATTERN.EDDY:
      return centreMarker(cx, cy);
    default:
      return [];
  }
}

function updateActiveAttractors(base, active, time) {
  active.length = base.length;

  for (let index = 0; index < base.length; index += 1) {
    const source = base[index];
    const angle = time * SIM.driftRate + source.phase;
    const target = active[index] ?? {};

    target.x = source.bx + source.ox * Math.cos(angle);
    target.y = source.by + source.oy * Math.sin(angle);
    target.strength = source.strength;
    target.sign = source.sign;
    active[index] = target;
  }
}

export { createAttractors, updateActiveAttractors };

import { SIM } from "./config.js";

const TWO_PI = Math.PI * 2;

const STRENGTH = Object.freeze({
  MONOPOLE: 40,
  DIPOLE: 50,
  DIPOLE_V: 50,
  REPELLER: 40,
  ATTRACT: 40,
  TRIPOLE: 40,
  TRIANGLE: 35,
  HORSESHOE: 45,
  QUAD: 40,
  CROSS: 35,
  PINWHEEL: 25,
  CHAIN: 35,
  CHAIN_V: 35,
  HEXAPOLE: 30,
  TWIN_DIP: 35,
  STAR_5: 30,
  OCTUPOLE: 25,
  MIRROR: 40,
  NESTED: 25,
  SUNSPOT: 20,
  GRID3: 25,
  RING_8: 25,
  DBL_RING: 20,
  COIL: 18,
  HELMHLTZ: 20,
  SOLENOID: 20,
  PLASMA: 25,
  MAZE: 20,
  AURORA: 18,
  CHAOS: 18,
});

function makePole(bx, by, ox, oy, phase, strength, polarity) {
  return { bx, by, ox, oy, phase, strength, polarity };
}

function addPole(poles, pole) {
  if (poles.length < SIM.maxPoles) poles.push(pole);
}

function placeChainAlong(
  poles,
  x0,
  y0,
  x1,
  y1,
  count,
  startSign,
  strength,
  ox,
  oy,
) {
  for (let index = 0; index < count; index += 1) {
    const t = count > 1 ? index / (count - 1) : 0.5;
    addPole(
      poles,
      makePole(
        x0 + (x1 - x0) * t,
        y0 + (y1 - y0) * t,
        ox,
        oy,
        index * 0.4,
        strength,
        index % 2 === 0 ? startSign : -startSign,
      ),
    );
  }
}

function placeRing(
  poles,
  cx,
  cy,
  rx,
  ry,
  count,
  alternate,
  startSign,
  strength,
  ox,
  oy,
) {
  for (let index = 0; index < count; index += 1) {
    const angle = (index * TWO_PI) / count;
    const polarity = alternate && index % 2 === 1 ? -startSign : startSign;
    addPole(
      poles,
      makePole(
        cx + rx * Math.cos(angle),
        cy + ry * Math.sin(angle),
        ox,
        oy,
        angle,
        strength,
        polarity,
      ),
    );
  }
}

function placeGrid(poles, cx, cy, dx, dy, rows, columns, strength) {
  let phaseIndex = 0;

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      addPole(
        poles,
        makePole(
          cx + (column - (columns - 1) * 0.5) * dx,
          cy + (row - (rows - 1) * 0.5) * dy,
          1,
          1,
          phaseIndex * 0.3,
          strength,
          (column + row) % 2 === 0 ? 1 : -1,
        ),
      );
      phaseIndex += 1;
    }
  }
}

function placeRandom(poles, width, height, count, strength, jitter) {
  const marginX = Math.floor(width / 10);
  const marginY = Math.floor(height / 8);

  for (let index = 0; index < count; index += 1) {
    const x = marginX + Math.random() * (width - marginX * 2);
    const y = marginY + Math.random() * (height - marginY * 2);
    const randomScale = 1 + (Math.random() * 2 - 1) * jitter;
    addPole(
      poles,
      makePole(
        x,
        y,
        1,
        1,
        index * 0.31,
        strength * randomScale,
        Math.random() < 0.5 ? -1 : 1,
      ),
    );
  }
}

function createPatternPoles(pattern, width, height) {
  const poles = [];
  const cx = width * 0.5;
  const cy = height * 0.5;

  switch (pattern) {
    case 0:
      addPole(poles, makePole(cx, cy, 1, 1, 0, STRENGTH.MONOPOLE, 1));
      break;

    case 1: {
      const dx = width * 0.2;
      addPole(poles, makePole(cx - dx, cy, 3, 2, 0, STRENGTH.DIPOLE, 1));
      addPole(poles, makePole(cx + dx, cy, 3, 2, Math.PI, STRENGTH.DIPOLE, -1));
      break;
    }

    case 2: {
      const dy = height * 0.25;
      addPole(poles, makePole(cx, cy - dy, 2, 3, 0, STRENGTH.DIPOLE_V, 1));
      addPole(poles, makePole(cx, cy + dy, 2, 3, Math.PI, STRENGTH.DIPOLE_V, -1));
      break;
    }

    case 3: {
      const dx = width * 0.12;
      addPole(poles, makePole(cx - dx, cy, 2, 2, 0, STRENGTH.REPELLER, 1));
      addPole(poles, makePole(cx + dx, cy, 2, 2, Math.PI, STRENGTH.REPELLER, 1));
      break;
    }

    case 4: {
      const dx = width * 0.12;
      addPole(poles, makePole(cx - dx, cy, 2, 2, 0, STRENGTH.ATTRACT, -1));
      addPole(poles, makePole(cx + dx, cy, 2, 2, Math.PI, STRENGTH.ATTRACT, -1));
      break;
    }

    case 5: {
      const spacing = width * 0.18;
      for (let index = 0; index < 3; index += 1) {
        addPole(
          poles,
          makePole(
            cx + (index - 1) * spacing,
            cy,
            2,
            1.5,
            index * 0.5,
            STRENGTH.TRIPOLE,
            index % 2 === 0 ? 1 : -1,
          ),
        );
      }
      break;
    }

    case 6: {
      const radius = height * 0.3;
      for (let index = 0; index < 3; index += 1) {
        const angle = (index * TWO_PI) / 3 - Math.PI * 0.5;
        addPole(
          poles,
          makePole(
            cx + radius * Math.cos(angle),
            cy + radius * Math.sin(angle),
            1.5,
            1.5,
            angle,
            STRENGTH.TRIANGLE,
            index === 0 ? 1 : -1,
          ),
        );
      }
      break;
    }

    case 7: {
      const gap = width * 0.06;
      const y = cy - height * 0.15;
      addPole(poles, makePole(cx - gap, y, 1, 1, 0, STRENGTH.HORSESHOE, 1));
      addPole(poles, makePole(cx + gap, y, 1, 1, Math.PI, STRENGTH.HORSESHOE, -1));
      break;
    }

    case 8: {
      const ax = width * 0.18;
      const ay = height * 0.22;
      const layout = [
        [-ax, -ay, 1],
        [ax, -ay, -1],
        [-ax, ay, -1],
        [ax, ay, 1],
      ];
      layout.forEach(([dx, dy, polarity], index) =>
        addPole(
          poles,
          makePole(cx + dx, cy + dy, 2, 2, index * 0.5, STRENGTH.QUAD, polarity),
        ),
      );
      break;
    }

    case 9: {
      const radius = height * 0.28;
      const aspect = height / width;
      const layout = [
        [cx, cy - radius, 1],
        [cx + radius / aspect, cy, -1],
        [cx, cy + radius, 1],
        [cx - radius / aspect, cy, -1],
      ];
      layout.forEach(([x, y, polarity], index) =>
        addPole(
          poles,
          makePole(x, y, 1.5, 1.5, index * 0.4, STRENGTH.CROSS, polarity),
        ),
      );
      break;
    }

    case 10: {
      const radius = height * 0.22;
      const gap = height * 0.06;
      for (let index = 0; index < 4; index += 1) {
        const angle = index * Math.PI * 0.5;
        const tangentX = -Math.sin(angle);
        const tangentY = Math.cos(angle);
        const x = cx + radius * Math.cos(angle);
        const y = cy + radius * Math.sin(angle);
        addPole(
          poles,
          makePole(
            x + gap * tangentX,
            y + gap * tangentY,
            1,
            1,
            angle,
            STRENGTH.PINWHEEL,
            1,
          ),
        );
        addPole(
          poles,
          makePole(
            x - gap * tangentX,
            y - gap * tangentY,
            1,
            1,
            angle + Math.PI,
            STRENGTH.PINWHEEL,
            -1,
          ),
        );
      }
      break;
    }

    case 11:
      placeChainAlong(
        poles,
        cx - width * 0.35,
        cy,
        cx + width * 0.35,
        cy,
        6,
        1,
        STRENGTH.CHAIN,
        2,
        1,
      );
      break;

    case 12:
      placeChainAlong(
        poles,
        cx,
        cy - height * 0.4,
        cx,
        cy + height * 0.4,
        6,
        1,
        STRENGTH.CHAIN_V,
        1,
        2,
      );
      break;

    case 13:
      placeRing(
        poles,
        cx,
        cy,
        width * 0.25,
        height * 0.28,
        6,
        true,
        1,
        STRENGTH.HEXAPOLE,
        1.5,
        1.5,
      );
      break;

    case 14: {
      const dx = width * 0.2;
      const dy = height * 0.18;
      const layout = [
        [-dx, -dy, 0, 1],
        [dx, -dy, Math.PI, -1],
        [-dx, dy, 0.5, 1],
        [dx, dy, Math.PI + 0.5, -1],
      ];
      layout.forEach(([x, y, phase, polarity]) =>
        addPole(
          poles,
          makePole(cx + x, cy + y, 2, 1, phase, STRENGTH.TWIN_DIP, polarity),
        ),
      );
      break;
    }

    case 15:
      placeRing(
        poles,
        cx,
        cy,
        width * 0.27,
        height * 0.3,
        5,
        true,
        1,
        STRENGTH.STAR_5,
        1.5,
        1.5,
      );
      break;

    case 16:
      placeRing(
        poles,
        cx,
        cy,
        width * 0.28,
        height * 0.32,
        8,
        true,
        1,
        STRENGTH.OCTUPOLE,
        1.5,
        1.5,
      );
      break;

    case 17: {
      const dy = height * 0.32;
      addPole(poles, makePole(cx, cy - dy, 1, 2, 0, STRENGTH.MIRROR, 1));
      addPole(poles, makePole(cx, cy + dy, 1, 2, Math.PI, STRENGTH.MIRROR, 1));
      break;
    }

    case 18: {
      const innerX = width * 0.1;
      const innerY = height * 0.12;
      const outerX = width * 0.25;
      const outerY = height * 0.3;
      const layout = [
        [-1, -1, 1, -1],
        [1, -1, -1, 1],
        [-1, 1, -1, 1],
        [1, 1, 1, -1],
      ];
      layout.forEach(([sx, sy, innerSign, outerSign], index) => {
        addPole(
          poles,
          makePole(
            cx + sx * innerX,
            cy + sy * innerY,
            1,
            1,
            index * 0.4,
            STRENGTH.NESTED,
            innerSign,
          ),
        );
        addPole(
          poles,
          makePole(
            cx + sx * outerX,
            cy + sy * outerY,
            1,
            1,
            index * 0.4 + 0.3,
            STRENGTH.NESTED,
            outerSign,
          ),
        );
      });
      break;
    }

    case 19: {
      const clusterDistance = width * 0.22;
      const spacing = 2.5;
      const centers = [cx - clusterDistance, cx + clusterDistance];
      centers.forEach((centerX, cluster) => {
        const leftSign = cluster === 0 ? 1 : -1;
        for (let index = 0; index < 3; index += 1) {
          const dy = (index - 1) * spacing;
          const phase = (cluster * 3 + index) * 0.4;
          addPole(
            poles,
            makePole(
              centerX - spacing,
              cy + dy,
              1,
              1,
              phase,
              STRENGTH.SUNSPOT,
              leftSign,
            ),
          );
          addPole(
            poles,
            makePole(
              centerX + spacing,
              cy + dy,
              1,
              1,
              phase + 1,
              STRENGTH.SUNSPOT,
              -leftSign,
            ),
          );
        }
      });
      break;
    }

    case 20:
      placeGrid(
        poles,
        cx,
        cy,
        width * 0.22,
        height * 0.24,
        3,
        3,
        STRENGTH.GRID3,
      );
      break;

    case 21:
      placeRing(
        poles,
        cx,
        cy,
        width * 0.28,
        height * 0.32,
        8,
        false,
        1,
        STRENGTH.RING_8,
        1.5,
        1.5,
      );
      break;

    case 22:
      placeRing(
        poles,
        cx,
        cy,
        width * 0.15,
        height * 0.18,
        6,
        false,
        1,
        STRENGTH.DBL_RING,
        1,
        1,
      );
      placeRing(
        poles,
        cx,
        cy,
        width * 0.32,
        height * 0.36,
        8,
        false,
        -1,
        STRENGTH.DBL_RING,
        1,
        1,
      );
      break;

    case 23:
      placeRing(
        poles,
        cx,
        cy,
        width * 0.3,
        height * 0.36,
        12,
        false,
        1,
        STRENGTH.COIL,
        1,
        1,
      );
      break;

    case 24: {
      const ringX = width * 0.18;
      const ringY = height * 0.1;
      const separation = height * 0.22;
      placeRing(
        poles,
        cx,
        cy - separation,
        ringX,
        ringY,
        6,
        false,
        1,
        STRENGTH.HELMHLTZ,
        0.5,
        0.5,
      );
      placeRing(
        poles,
        cx,
        cy + separation,
        ringX,
        ringY,
        6,
        false,
        1,
        STRENGTH.HELMHLTZ,
        0.5,
        0.5,
      );
      break;
    }

    case 25:
      placeChainAlong(
        poles,
        cx - width * 0.3,
        cy - height * 0.3,
        cx + width * 0.3,
        cy - height * 0.3,
        8,
        1,
        STRENGTH.SOLENOID,
        1,
        0.5,
      );
      placeChainAlong(
        poles,
        cx - width * 0.3,
        cy + height * 0.3,
        cx + width * 0.3,
        cy + height * 0.3,
        8,
        -1,
        STRENGTH.SOLENOID,
        1,
        0.5,
      );
      break;

    case 26:
      placeRandom(poles, width, height, 14, STRENGTH.PLASMA, 0);
      break;

    case 27:
      for (let index = 0; index < 16; index += 1) {
        const t = index / 15;
        addPole(
          poles,
          makePole(
            width * 0.1 + t * width * 0.8,
            cy + Math.sin(t * Math.PI * 4) * height * 0.2,
            1,
            1,
            index * 0.3,
            STRENGTH.MAZE,
            index % 2 === 0 ? 1 : -1,
          ),
        );
      }
      break;

    case 28:
      for (let index = 0; index < 18; index += 1) {
        const t = index / 17;
        const angle = -Math.PI * 0.55 + t * Math.PI * 1.1;
        const radius = height * 0.55;
        addPole(
          poles,
          makePole(
            cx + radius * Math.sin(angle) * 1.4,
            cy - radius * Math.cos(angle) + height * 0.3,
            0.5,
            0.5,
            index * 0.25,
            STRENGTH.AURORA,
            index % 2 === 0 ? 1 : -1,
          ),
        );
      }
      break;

    case 29:
      placeRandom(poles, width, height, 24, STRENGTH.CHAOS, 0.3);
      break;

    default:
      return createPatternPoles(1, width, height);
  }

  return poles;
}

export { createPatternPoles };

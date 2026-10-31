import { FIELD, MAP, SIM, THEMES } from "./config.js";

const TWO_PI = Math.PI * 2;

function randomBetween(minimum, maximum) {
  return minimum + Math.random() * (maximum - minimum);
}

function reflectOffWall(charge, positionKey, velocityKey, maximum) {
  if (charge[positionKey] < 0) {
    charge[positionKey] = 0;
    charge[velocityKey] = Math.abs(charge[velocityKey]);
  } else if (charge[positionKey] > maximum) {
    charge[positionKey] = maximum;
    charge[velocityKey] = -Math.abs(charge[velocityKey]);
  }
}

class ChargeField {
  constructor() {
    this.chargeCount = SIM.defaultCharges;
    this.theme = 0;
    this.paused = false;
    this.driftScale = 1;
    this.showGlyphs = true;
    this.showContours = true;
    this.time = 0;
    this.charges = Array.from({ length: SIM.maxCharges }, () => ({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      q: 0,
    }));

    this.reset();
  }

  placeCharge(charge, index) {
    const angle = Math.random() * TWO_PI;
    const speed = randomBetween(SIM.driftMin, SIM.driftMax);
    const magnitude = randomBetween(
      SIM.chargeMagnitudeMin,
      SIM.chargeMagnitudeMax,
    );

    charge.x = Math.random() * (MAP.width - 1);
    charge.y = Math.random() * (MAP.height - 1);
    charge.vx = Math.cos(angle) * speed;
    charge.vy = Math.sin(angle) * speed;
    charge.q = index % 2 === 0 ? magnitude : -magnitude;
  }

  reset() {
    this.time = 0;
    this.charges.forEach((charge, index) => this.placeCharge(charge, index));
  }

  step(delta) {
    if (this.paused) return;

    const frameDelta = Math.min(
      Math.max(Number(delta) || 0, 0),
      SIM.maxFrameDelta,
    );
    const movementDelta = frameDelta * this.driftScale;
    this.time += frameDelta;

    for (let index = 0; index < this.chargeCount; index += 1) {
      const charge = this.charges[index];
      charge.x += charge.vx * movementDelta;
      charge.y += charge.vy * movementDelta;
      reflectOffWall(charge, "x", "vx", MAP.width - 1);
      reflectOffWall(charge, "y", "vy", MAP.height - 1);
    }
  }

  samplePotential(x, y) {
    let potential = 0;

    for (let index = 0; index < this.chargeCount; index += 1) {
      const charge = this.charges[index];
      const dx = x - charge.x;
      const dy = (y - charge.y) * FIELD.cellAspect;
      const distance = Math.max(Math.hypot(dx, dy), FIELD.soften);
      potential += charge.q / distance;
    }

    return potential;
  }

  normalizedPotential(x, y) {
    const potential = this.samplePotential(x, y);
    return potential / (Math.abs(potential) + FIELD.halfVoltage);
  }

  setChargeCount(count) {
    this.chargeCount = Math.min(
      Math.max(Math.round(Number(count)), SIM.minCharges),
      SIM.maxCharges,
    );
  }

  adjustChargeCount(delta) {
    this.setChargeCount(this.chargeCount + delta);
  }

  setTheme(theme) {
    this.theme = Math.min(
      Math.max(Math.round(Number(theme)), 0),
      THEMES.length - 1,
    );
  }

  cycleTheme(direction = 1) {
    this.theme =
      (this.theme + direction + THEMES.length) % THEMES.length;
  }

  togglePaused() {
    this.paused = !this.paused;
  }
}

export { ChargeField };

import { THEMES } from "./config.js";

class ElectricPotentialControls {
  constructor(simulation) {
    this.simulation = simulation;
    this.smoothedFps = 60;
    this.handleKeyDown = this.handleKeyDown.bind(this);

    this.hud = document.createElement("div");
    Object.assign(this.hud.style, {
      position: "fixed",
      top: "52px",
      left: "12px",
      zIndex: "2",
      padding: "9px 11px",
      color: "#e8faff",
      background: "rgba(1, 5, 14, 0.72)",
      border: "1px solid rgba(91, 207, 255, 0.28)",
      borderRadius: "4px",
      boxShadow: "0 0 24px rgba(0, 145, 255, 0.1)",
      font: "12px/1.55 monospace",
      textAlign: "left",
      whiteSpace: "pre",
      pointerEvents: "none",
      backdropFilter: "blur(4px)",
    });

    document.body.append(this.hud);
    window.addEventListener("keydown", this.handleKeyDown);
    this.update(1 / 60);
  }

  handleKeyDown(event) {
    const target = event.target;
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLSelectElement ||
      target instanceof HTMLTextAreaElement
    ) {
      return;
    }

    let handled = true;

    switch (event.key) {
      case " ":
      case "p":
      case "P":
        this.simulation.togglePaused();
        break;
      case "r":
      case "R":
        this.simulation.reset();
        break;
      case "t":
        this.simulation.cycleTheme(1);
        break;
      case "T":
        this.simulation.cycleTheme(-1);
        break;
      case "+":
      case "=":
        this.simulation.adjustChargeCount(1);
        break;
      case "-":
      case "_":
        this.simulation.adjustChargeCount(-1);
        break;
      default:
        handled = false;
    }

    if (handled) event.preventDefault();
  }

  update(delta) {
    if (delta > 0) {
      const instantaneousFps = 1 / delta;
      this.smoothedFps += (instantaneousFps - this.smoothedFps) * 0.08;
    }

    const state = this.simulation.paused ? "PAUSED" : "RUNNING";
    this.hud.textContent =
      `${state.padEnd(8)}  ${this.smoothedFps.toFixed(1).padStart(5)} fps\n` +
      `charges   ${this.simulation.chargeCount}\n` +
      `theme     ${THEMES[this.simulation.theme].name}\n` +
      `drift     ${this.simulation.driftScale.toFixed(1)}x`;
  }

  dispose() {
    window.removeEventListener("keydown", this.handleKeyDown);
    this.hud.remove();
  }
}

export { ElectricPotentialControls };

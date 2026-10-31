import { THEMES } from "./config.js";

class BarkleyControls {
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
      color: "#fff5df",
      background: "rgba(12, 3, 1, 0.76)",
      border: "1px solid rgba(255, 143, 51, 0.3)",
      borderRadius: "4px",
      boxShadow: "0 0 24px rgba(255, 70, 0, 0.12)",
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
        this.simulation.adjustSpeed(1);
        break;
      case "-":
      case "_":
        this.simulation.adjustSpeed(-1);
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
      `speed     ${String(this.simulation.substeps).padStart(2)} substeps/frame\n` +
      `theme     ${THEMES[this.simulation.theme].name}\n` +
      `model     a:${this.simulation.a.toFixed(2)}  ` +
      `b:${this.simulation.b.toFixed(3)}  ` +
      `eps:${this.simulation.epsilon.toFixed(3)}`;
  }

  dispose() {
    window.removeEventListener("keydown", this.handleKeyDown);
    this.hud.remove();
  }
}

export { BarkleyControls };

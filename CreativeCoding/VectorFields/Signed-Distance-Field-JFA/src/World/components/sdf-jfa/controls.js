import {
  MAP,
  PATTERN_NAMES,
  PATTERN_TIERS,
  SIM,
  THEMES,
} from "./config.js";

class SDFControls {
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
        this.simulation.togglePaused();
        break;
      case "r":
      case "R":
        this.simulation.reset();
        break;
      case "n":
      case "N":
        this.simulation.cyclePattern(1);
        break;
      case "p":
      case "P":
        this.simulation.cyclePattern(-1);
        break;
      case "t":
        this.simulation.cycleTheme(1);
        break;
      case "T":
        this.simulation.cycleTheme(-1);
        break;
      case "+":
      case "=":
        this.simulation.adjustDrift(1);
        break;
      case "-":
      case "_":
        this.simulation.adjustDrift(-1);
        break;
      case "]":
        this.simulation.adjustTickRate(1);
        break;
      case "[":
        this.simulation.adjustTickRate(-1);
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
    const pattern = PATTERN_NAMES[this.simulation.pattern];
    const tier = PATTERN_TIERS[this.simulation.pattern];
    const theme = THEMES[this.simulation.theme].name;
    this.hud.textContent =
      `${state.padEnd(8)} ${this.smoothedFps.toFixed(1).padStart(5)} fps  ` +
      `${String(this.simulation.tickRate).padStart(3)} Hz\n` +
      `pattern   ${pattern} ` +
      `[${this.simulation.pattern + 1}/${PATTERN_NAMES.length}]\n` +
      `tier      ${tier}\n` +
      `theme     ${theme}\n` +
      `drift     ${this.simulation.drift}x\n` +
      `seeds     ${SIM.seedCount}\n` +
      `JFA       100>50>25>12>6>3>1\n` +
      `map       ${MAP.width} x ${MAP.height}`;
  }

  dispose() {
    window.removeEventListener("keydown", this.handleKeyDown);
    this.hud.remove();
  }
}

export { SDFControls };

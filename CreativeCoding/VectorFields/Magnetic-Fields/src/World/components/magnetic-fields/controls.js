import {
  GLYPH_SETS,
  MAP,
  PATTERN_NAMES,
  THEMES,
} from "./config.js";

class MagneticFieldControls {
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
      case "g":
        this.simulation.cycleGlyphSet(1);
        break;
      case "G":
        this.simulation.cycleGlyphSet(-1);
        break;
      case "+":
      case "=":
        this.simulation.adjustSpeed(1);
        break;
      case "-":
      case "_":
        this.simulation.adjustSpeed(-1);
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
    const northCount = this.simulation.activePoles.filter(
      (pole) => pole.polarity > 0,
    ).length;
    const southCount = this.simulation.activePoles.length - northCount;

    this.hud.textContent =
      `${state.padEnd(8)}  ${this.smoothedFps.toFixed(1).padStart(5)} fps\n` +
      `pattern   ${PATTERN_NAMES[this.simulation.pattern]}  ` +
      `${String(this.simulation.pattern + 1).padStart(2)}/${PATTERN_NAMES.length}\n` +
      `theme     ${THEMES[this.simulation.theme].name}\n` +
      `glyph     ${GLYPH_SETS[this.simulation.glyphSet].name}\n` +
      `speed     ${String(this.simulation.speed).padStart(2)} cells/s  ` +
      `${this.simulation.tickRate} Hz\n` +
      `poles     N:${northCount} S:${southCount}  ` +
      `particles:${this.simulation.particleCount}\n` +
      `grid      ${MAP.width} x ${MAP.height}`;
  }

  dispose() {
    window.removeEventListener("keydown", this.handleKeyDown);
    this.hud.remove();
  }
}

export { MagneticFieldControls };

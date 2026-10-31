import {
  GLYPH_STYLES,
  PATTERN_NAMES,
  THEMES,
} from "./config.js";

class FlowFieldControls {
  constructor(simulation) {
    this.simulation = simulation;
    this.smoothedFps = 60;
    this.previousDocumentTitle = document.title;
    this.pageTitle = document.querySelector("#page-title");
    this.previousPageTitle = this.pageTitle?.textContent ?? "";
    this.handleKeyDown = this.handleKeyDown.bind(this);

    document.title = "Three.js Flow Field Particles";
    if (this.pageTitle) {
      this.pageTitle.textContent = "FLOW FIELD PARTICLES";
      this.pageTitle.style.color = "#f5f7ff";
      this.pageTitle.style.fontFamily = "monospace";
      this.pageTitle.style.fontSize = "16px";
      this.pageTitle.style.letterSpacing = "0.18em";
      this.pageTitle.style.textShadow = "0 0 14px rgba(120, 220, 255, 0.75)";
    }

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
        this.simulation.cycleGlyphStyle(1);
        break;
      case "G":
        this.simulation.cycleGlyphStyle(-1);
        break;
      case "r":
      case "R":
        this.simulation.reset();
        break;
      case " ":
        this.simulation.togglePaused();
        break;
      case "+":
      case "=":
        this.simulation.changeSpeed(1);
        break;
      case "-":
      case "_":
        this.simulation.changeSpeed(-1);
        break;
      case "]":
        this.simulation.changeSimulationRate(1);
        break;
      case "[":
        this.simulation.changeSimulationRate(-1);
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

    const simulation = this.simulation;
    const state = simulation.paused ? "PAUSED" : "RUNNING";
    this.hud.textContent =
      `${state.padEnd(8)}  ${this.smoothedFps.toFixed(1).padStart(5)} fps\n` +
      `pattern   ${PATTERN_NAMES[simulation.pattern]} ` +
      `[${simulation.pattern + 1}/${PATTERN_NAMES.length}]\n` +
      `theme     ${THEMES[simulation.theme].name}\n` +
      `style     ${GLYPH_STYLES[simulation.glyphStyle]}\n` +
      `particles ${String(simulation.particleCount).padStart(4)}    ` +
      `attractors ${String(simulation.activeAttractors.length).padStart(2)}\n` +
      `speed     ${String(simulation.speed).padStart(3)} cells/s    ` +
      `simulation ${String(simulation.simFps).padStart(3)} Hz`;
  }

  dispose() {
    window.removeEventListener("keydown", this.handleKeyDown);
    this.hud.remove();
    document.title = this.previousDocumentTitle;

    if (this.pageTitle) {
      this.pageTitle.textContent = this.previousPageTitle;
      this.pageTitle.removeAttribute("style");
    }
  }
}

export { FlowFieldControls };

import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { NOISE, PATTERN_NAMES, SIM, THEMES } from "../components/domain-warp/config.js";

function indexedOptions(names) {
  return Object.fromEntries(names.map((name, index) => [name, index]));
}

class IMGui {
  constructor(camera, controls, object) {
    this.camera = camera;
    this.controls = controls;
    this.domainWarp = object.userData.domainWarp;
    if (!this.domainWarp) throw new Error("IMGui requires a domain-warp mesh group.");
    this.simulation = this.domainWarp.simulation;
    this.gui = new GUI({ title: "Domain Warp Controls" });
    this.actions = {
      reset: () => this.simulation.reset(),
      restoreNoise: () => {
        this.simulation.noiseScale = NOISE.scale;
        this.simulation.warpAmount = NOISE.warpAmount;
        this.simulation.intensityGamma = NOISE.gamma;
        this.simulation.reset();
      },
    };

    const simulationFolder = this.gui.addFolder("Simulation");
    simulationFolder.add(this.simulation, "pattern", indexedOptions(PATTERN_NAMES)).name("Pattern").onChange((value) => this.simulation.setPattern(value)).listen();
    simulationFolder.add(this.simulation, "theme", indexedOptions(THEMES.map((theme) => theme.name))).name("Theme").onChange((value) => this.simulation.setTheme(value)).listen();
    simulationFolder.add(this.simulation, "driftMultiplier", { "1x": 1, "2x": 2, "4x": 4, "8x": 8, "16x": 16, "32x": 32 }).name("Drift").listen();
    simulationFolder.add(this.simulation, "simFps", SIM.fpsMin, SIM.fpsMax, SIM.fpsStep).name("Simulation Hz").listen();
    simulationFolder.add(this.simulation, "paused").name("Paused").listen();
    simulationFolder.add(this.simulation, "showGlyphs").name("ASCII glyphs");
    simulationFolder.add(this.actions, "reset").name("Reset noise");

    const noiseFolder = this.gui.addFolder("Noise model");
    noiseFolder.add(this.simulation, "noiseScale", 0.01, 0.12, 0.005).name("Scale");
    noiseFolder.add(this.simulation, "warpAmount", 0, 8, 0.1).name("Warp amount");
    noiseFolder.add(this.simulation, "intensityGamma", 0.2, 1.2, 0.01).name("Brightness gamma");
    noiseFolder.add(this.actions, "restoreNoise").name("Restore defaults");

    const viewFolder = this.gui.addFolder("View");
    viewFolder.add(this.camera.position, "z", 8, 30, 0.2).name("Camera distance").onChange(() => this.controls.update());
    simulationFolder.open();
    noiseFolder.close();
    viewFolder.close();
  }

  dispose() { this.gui.destroy(); }
}

export { IMGui };

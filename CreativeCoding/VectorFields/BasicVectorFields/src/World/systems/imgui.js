import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import {
  FIELD_NAMES,
  THEMES,
} from "../components/basic-vector-fields/config.js";

function indexedOptions(names) {
  return Object.fromEntries(names.map((name, index) => [name, index]));
}

class IMGui {
  constructor(camera, controls, object) {
    this.camera = camera;
    this.controls = controls;
    this.object = object;
    this.vectorField = object.userData.vectorField;

    if (!this.vectorField) {
      throw new Error("IMGui requires a vector-field enabled mesh group.");
    }

    this.gui = new GUI({ title: "Basic Vector Fields" });
    this.actions = {
      reset: () => this.vectorField.reset(),
    };

    const fieldFolder = this.gui.addFolder("Vector field");
    fieldFolder
      .add(this.vectorField, "field", indexedOptions(FIELD_NAMES))
      .name("Field")
      .onChange((value) => this.vectorField.setField(value))
      .listen();
    fieldFolder
      .add(
        this.vectorField,
        "theme",
        indexedOptions(THEMES.map((theme) => theme.name)),
      )
      .name("Theme")
      .onChange((value) => this.vectorField.setTheme(value))
      .listen();
    fieldFolder
      .add(this.vectorField, "animated")
      .name("Animate dynamic field");
    fieldFolder
      .add(this.vectorField, "timeScale", 0.1, 3, 0.1)
      .name("Animation speed");
    fieldFolder
      .add(this.vectorField, "arrowLength", 0.2, 1, 0.02)
      .name("Arrow length")
      .onChange((value) => this.vectorField.setArrowLength(value));
    fieldFolder
      .add(this.vectorField, "directionColors")
      .name("Direction gradient")
      .onChange((value) => this.vectorField.setDirectionColors(value));
    fieldFolder.add(this.actions, "reset").name("Reset animation");

    const viewFolder = this.gui.addFolder("View");
    viewFolder
      .add(this.camera.position, "z", 8, 30, 0.2)
      .name("Camera distance")
      .onChange(() => this.controls.update());

    fieldFolder.open();
    viewFolder.close();
  }

  dispose() {
    this.gui.destroy();
  }
}

export { IMGui };

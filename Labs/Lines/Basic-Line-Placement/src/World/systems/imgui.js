import { GUI } from "three/addons/libs/lil-gui.module.min.js";

class IMGui {
  constructor(camera, controls, object) {
    this.camera = camera;
    this.controls = controls;
    this.object = object;
    this.gui = new GUI();

    this.gui.add(this, "testFunction");
    this.gui
      .add(this.camera.position, "z", 1, 30, 0.2)
      .name("Camera distance")
      .onChange((value) => {
        this.camera.position.z = value;
        this.controls.update();
      });
  }

  testFunction() {
    alert("TESTING FUNCTION");
  }

  dispose() {
    this.gui.destroy();
  }
}

export { IMGui };

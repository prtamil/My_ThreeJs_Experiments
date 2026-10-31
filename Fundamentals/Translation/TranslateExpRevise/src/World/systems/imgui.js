import { GUI } from "three/examples/jsm/libs/lil-gui.module.min";

class IMGui {
  constructor(camera, controls, object) {
    this.camera = camera;
    this.controls = controls;
    this.object = object;
    this.gui = new GUI();

    this.gui.add(this, "testFunction");
    this.gui
      .add(this.camera.position, "z", 1.0, 10.0, 0.2)
      .onChange((value) => {
        this.camera.position.z = value;
        this.camera.updateProjectionMatrix();
        this.controls.update();
      });
  }
  testFunction() {
    alert("TESTING FUNCTION");
  }
}

export { IMGui };

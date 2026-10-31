import { GUI } from "three/examples/jsm/libs/lil-gui.module.min";

class UI {
  constructor(camera, controls, birds) {
    this.camera = camera;
    this.controls = controls;
    this.birds = birds;
    this.nextIdx = 0;
    this.gui = new GUI();
    this.gui.add(this, "nextFocus");
    this.gui.add(this.camera.position, "z", 3.5, 9.5, 0.2).onChange((value) => {
      this.camera.position.z = value;
      this.camera.updateProjectionMatrix();
      this.controls.update();
    });
  }
  nextFocus() {
    let idx = this.nextIdx;
    let bird = this.birds[idx];
    this.nextIdx = (idx + 1) % this.birds.length;
    let newPos = bird.position.clone();
    //camera.position.copy(newPos);
    this.controls.target.copy(newPos);
    this.camera.updateProjectionMatrix();
    this.controls.update();
  }
}

export { UI };

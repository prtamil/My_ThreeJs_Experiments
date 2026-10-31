import { Clock } from "three";

class Loop {
  constructor(camera, scene, renderer) {
    this.camera = camera;
    this.scene = scene;
    this.renderer = renderer;
    this.clock = new Clock();
    this.updatables = [];
  }
  start() {
    this.clock.start();
    this.renderer.setAnimationLoop(() => {
      //Tell every animated object to tick with it
      this.tick();
      this.renderer.render(this.scene, this.camera);
    });
  }

  stop() {
    this.renderer.setAnimationLoop(null);
    this.clock.stop();
  }
  tick() {
    //With Delta now framerate is delta based
    //Not on dynamic time based
    //Without delta its system refresh rate based
    //refresh rate vary on system refresh rate power
    //With delta every animation is considered based on
    //delta
    const delta = this.clock.getDelta();
    for (const obj of this.updatables) {
      obj.tick(delta);
    }
  }
}

export { Loop };

import { Clock } from "three";

const clock = new Clock();

class Loop {
  constructor(camera, scene, renderer, effect) {
    this.camera = camera;
    this.scene = scene;
    this.renderer = renderer;
    this.effect = effect;
    this.updatables = [];
  }
  start() {
    this.renderer.setAnimationLoop(() => {
      //Tell every animated object to tick with it
      this.tick();
      //this.renderer.render(this.scene, this.camera);
      this.effect.render(this.scene, this.camera);
    });
  }

  stop() {
    this.renderer.setAnimationLoop(null);
  }
  tick() {
    //With Delta now framerate is delta based
    //Not on dynamic time based
    //Without delta its system refresh rate based
    //refresh rate vary on system refresh rate power
    //With delta every animation is considered based on
    //delta
    const delta = clock.getDelta();
    for (const obj of this.updatables) {
      obj.tick(delta);
    }
  }
}

export { Loop };

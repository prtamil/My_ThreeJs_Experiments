//Control aspect Ratio of Camera
//Control Renderer Size and Pixel Ratio
const setSize = (container, camera, renderer, effect) => {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
  effect.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
};
class Resizer {
  constructor(container, camera, renderer, effect) {
    setSize(container, camera, renderer, effect);
    window.addEventListener("resize", () => {
      //resize the size on resize required
      setSize(container, camera, renderer, effect);
      //resize hander not required it will
      //handled by game loop
      this.onResize();
    });
  }
  onResize() {
    //Emppty event handler.
    //Will assign it from world;
    //just place holder
    //Often no need will work on game loop as well
  }
}

export { Resizer };

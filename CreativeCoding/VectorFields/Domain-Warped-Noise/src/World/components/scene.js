import { Color, Scene } from "three";

function createScene() {
  const scene = new Scene();
  scene.background = new Color("#01040c");
  return scene;
}

export { createScene };

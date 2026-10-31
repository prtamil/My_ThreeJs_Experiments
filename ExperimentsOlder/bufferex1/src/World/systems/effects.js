import { AsciiEffect } from "three/examples/jsm/effects/AsciiEffect";

function createEffect(renderer, container) {
  const effect = new AsciiEffect(renderer, ". -+=%@#", { invert: false });
  effect.setSize(container.clientWidth, container.clientHeight);
  effect.domElement.style.color = "black";
  effect.domElement.style.backgroundColor = "white";
  return effect;
}

export { createEffect };

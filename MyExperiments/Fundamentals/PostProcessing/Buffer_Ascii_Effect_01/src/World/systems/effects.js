import { AsciiEffect } from "three/examples/jsm/effects/AsciiEffect";

function createEffect(renderer, container) {
  const effect = new AsciiEffect(renderer, ". -+=%@#", { invert: false });
  effect.setSize(container.clientWidth, container.clientHeight);
  effect.domElement.style.color = "green";
  effect.domElement.style.backgroundColor = "black";
  return effect;
}

export { createEffect };

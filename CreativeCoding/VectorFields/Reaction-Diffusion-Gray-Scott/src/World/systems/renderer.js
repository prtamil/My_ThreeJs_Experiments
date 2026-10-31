import { SRGBColorSpace, WebGLRenderer } from "three";
function createRenderer() {
  const renderer = new WebGLRenderer({ antialias: true });
  renderer.outputColorSpace = SRGBColorSpace;
  return renderer;
}
export { createRenderer };

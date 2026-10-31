import { WebGLRenderer } from "../../vendor/three/build/three.module.js";

function createRenderer() {
    const renderer = new WebGLRenderer();

    //turn on physicall correct lighting model
    renderer.physicallyCorrectLights = true;

    return renderer;
}

export {createRenderer};
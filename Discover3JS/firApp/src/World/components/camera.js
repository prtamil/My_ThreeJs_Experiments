import { PerspectiveCamera } from '../../vendor/three/build/three.module.js';

function createCamera() {
    const camera = new PerspectiveCamera(
        35, //fov
        1, // aspect ratio (dummy value) Resizer will update actual value
        0.1, //near
        100, //far
    );

    camera.position.set(0,0,10);

    return camera;

}

export {createCamera};
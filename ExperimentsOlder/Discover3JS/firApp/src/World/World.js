import { createCamera } from "./components/camera.js";
import { createCube } from "./components/cube.js";
import { createScene } from "./components/scene.js";

import { createRenderer } from "./systems/renderer.js";
import { Resizer } from "./systems/Resizer.js";

//Module scoped Variables
let camera;
let renderer;
let scene;

class World {
    constructor(container){
        camera = createCamera();
        scene = createScene();
        renderer = createRenderer();

        container.append(renderer.domElement);

        const cube = createCube();
        scene.add(cube);

        //Resizer updated camera/renderer
        const resizer = new Resizer(container, camera, renderer);
    }
    render(){
        renderer.render(scene, camera);
    }
}

export {World};
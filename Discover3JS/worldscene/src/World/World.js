import { createCamera } from "./components/camera.js";
import { createCube, createCube1 } from "./components/cube.js";
import { createScene } from "./components/scene.js";
import { createLights } from "./components/lights.js";

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
        const cube1 = createCube1();

        const c1 = createCube();
        const cc1 = createCube();
        const cc2 = createCube();
        const cc3 = createCube();
        const cc4 = createCube();
        const light = createLights();
       
        cube1.position.set(5,5,0);

        c1.position.set(10,5,0);
        cc1.position.set(0,3,0);
        cc2.position.set(3,0,0);
        cc3.position.set(-3,0,0);
        cc4.position.set(0,-3,0);

        cc1.scale.set(0.5,0.5,0.5);
        cc2.scale.set(0.5,0.5,0.5);
        cc3.scale.set(0.5,0.5,0.5);
        cc4.scale.set(0.5,0.5,0.5);

        c1.add(cc1);
        c1.add(cc2);
        c1.add(cc3);
        c1.add(cc4);
        scene.add(cube, light);
        scene.add(cube1);
        scene.add(c1);
        //Resizer updated camera/renderer
        const resizer = new Resizer(container, camera, renderer);
        scene.updateMatrix();
        console.log(scene.toJSON());
    }
    render(){
        renderer.render(scene, camera);
    }
}

export {World};
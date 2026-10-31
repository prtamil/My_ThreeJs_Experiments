import { createCamera } from "./components/camera.js";
import { createCube } from "./components/cube.js";
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

        const light = createLights();
       
     
        scene.add(cube, light);
      
        //Resizer updated camera/renderer
        const resizer = new Resizer(container, camera, renderer);
        resizer.onResize = () =>{
            //Assign render after Resize
            //Send callback from World to Resizer
            this.render();
        }
        scene.updateMatrix();
        console.log(scene.toJSON());
    }
    render(){
        renderer.render(scene, camera);
    }
}

export {World};
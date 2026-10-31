import { Clock } from "../../vendor/three/build/three.module.js";


class Loop {
    constructor(camera, scene, renderer) {
        this.camera = camera;
        this.scene = scene;
        this.renderer = renderer;
        this.updatables = [];
    }
    start(){
        this.renderer.setAnimationLoop(()=>{
            //Tell every animated object to tick with it
            this.tick();
            this.renderer.render(this.scene, this.camera);
        });
    }

    stop(){
        this.renderer.setAnimationLoop(null);
    }
    tick() {
        for(const obj of this.updatables){
            obj.tick();
        }
    }
}

export { Loop};
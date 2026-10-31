import {
    SphereGeometry,
    BoxGeometry,
    TorusKnotGeometry,
    Group,
    MathUtils,
    Mesh,
    MeshStandardMaterial,
    MaxEquation,
    Color,
} from "three";

function createMeshGroup() {
    const mainGroup = new Group();

    const centergeo = new SphereGeometry(0.25,12,24);
    const centermat = new MeshStandardMaterial({color: "violet", flatShading:true});
    const center = new Mesh(centergeo, centermat);

    const ccol = new Color("hsl(6,100%,50%)");
    const cubgeo = new BoxGeometry(1,1,1);
    const cubmat = new MeshStandardMaterial({color: ccol, flatShading:true})
    const cube = new Mesh(cubgeo, cubmat);

    const scol = new Color("hsl(206,100%,50%)");
    const scubgeo = new BoxGeometry(1,1,1);
    const scubmat = new MeshStandardMaterial({color: scol , flatShading:true});
    const scube = new Mesh(scubgeo, scubmat);

    mainGroup.add(center);
    mainGroup.add(cube);
    mainGroup.add(scube);

    cube.position.y = 1.5;
    scube.position.y = -1.5;

    const cubeObject = {
        mesh: cube,
        direction: 1,
        speed: 4,
    };

    const scubeObject = {
        mesh: scube,
        direction: 1,
        speed: 3,
    };
    
    const range = 4;

    const obj_movement = (obj,delta) => {
        obj.mesh.position.x += obj.direction * obj.speed * delta;
        if(obj.mesh.position.x >= range || obj.mesh.position.x <= -range){
            obj.direction *= -1;
        }
    }
    
    mainGroup.tick = (delta) => {

        obj_movement(cubeObject,delta);
        obj_movement(scubeObject,delta);
    
    };
    mainGroup.scale.multiplyScalar(2);
    return mainGroup;
}

export { createMeshGroup };

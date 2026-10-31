import { BoxBufferGeometry, Mesh, MeshStandardMaterial } from "../../vendor/three/build/three.module.js";

function createCube() {
    const geometry = new BoxBufferGeometry(2,2,2);

    const materialSpec = {
        color: 'orchid',
    }
    const material = new MeshStandardMaterial(materialSpec);
    const cube = new Mesh(geometry, material);

    cube.rotation.set(-0.5, -0.1, 0.8);
    cube.tick = ()=>{
        cube.rotation.z += 0.01;
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
    }

    return cube;

}

export { createCube};
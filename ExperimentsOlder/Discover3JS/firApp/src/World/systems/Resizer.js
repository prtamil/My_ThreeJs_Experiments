//Control aspect Ratio of Camera
//Control Renderer Size and Pixel Ratio
class Resizer {
    constructor(container, camera, renderer){
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
    }
}

export {Resizer};
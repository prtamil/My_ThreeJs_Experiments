import { Group, MathUtils } from "three";

import { createGeometries } from "./geometries";
import { createMaterials } from "./materials";
import { createMeshes } from "./meshes";

const wheelSpeed = MathUtils.degToRad(24); //24 deg giveus complete rotation every 15 seconds
class Train extends Group {
  constructor() {
    super();
    this.meshes = createMeshes();
    //Group.add We inherited from Group remember
    this.add(
      this.meshes.nose,
      this.meshes.cabin,
      this.meshes.chimney,
      this.meshes.smallWheelRear,
      this.meshes.smallWheelCenter,
      this.meshes.smallWheelFront,
      this.meshes.bigWheel
    );
  }
  tick(delta) {
    //Need to figure out what axis to spin the wheels on.
    //Based on initial cylinder orientation (y) we want to spin
    //around axis on center which is Y Axis
    //The fact we have rotated wheels lie on Z axis doesn't change this
    this.meshes.bigWheel.rotation.y += wheelSpeed * delta;
    this.meshes.smallWheelRear.rotation.y += wheelSpeed * delta;
    this.meshes.smallWheelCenter.rotation.y += wheelSpeed * delta;
    this.meshes.smallWheelFront.rotation.y += wheelSpeed * delta;
  }
}

export { Train };

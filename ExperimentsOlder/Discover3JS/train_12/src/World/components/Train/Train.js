import { Group, MathUtils } from "three";

import { createGeometries } from "./geometries";
import { createMaterials } from "./materials";
import { createMeshes } from "./meshes";

const wheelSpeed = MathUtils.degToRad(60); //24 deg giveus complete rotation every 15 seconds
class Train extends Group {
  constructor() {
    super();
    this.meshes = createMeshes();
    //Group.add We inherited remember
    this.add(
      this.meshes.nose,
      this.meshes.cabin,
      this.meshes.chimney,
      this.meshes.smallWheelRear,
      this.meshes.smallWheelCenter,
      this.meshes.smallWheelFront,
      this.meshes.bigWheel
    );
    this.state = {
      direction: "FRONT",
      displaceMent: 1.7,
      wheelSpinDirection: wheelSpeed,
      baseMovement: "X", //X or Z;
    };
  }
  tick(delta) {
    //Need to figure out what axis to spin the wheels on.
    //Based on initial cylinder orientation (y) we want to spin
    //around axis on center which is Y Axis
    //The fact we have rotated wheels lie on Z axis doesn't change this
    this.meshes.bigWheel.rotation.y += this.state.wheelSpinDirection * delta;
    this.meshes.smallWheelRear.rotation.y +=
      this.state.wheelSpinDirection * delta;
    this.meshes.smallWheelCenter.rotation.y +=
      this.state.wheelSpinDirection * delta;
    this.meshes.smallWheelFront.rotation.y +=
      this.state.wheelSpinDirection * delta;
    //Extended Group.

    if (this.state.baseMovement === "X") {
      if (this.state.direction === "FRONT") {
        this.position.x -= this.state.displaceMent * delta;
      }
      if (this.state.direction === "BACK") {
        this.position.x += this.state.displaceMent * delta;
      }
      if (this.position.x < -7 && this.state.direction === "FRONT") {
        this.state.direction = "BACK";
        this.state.wheelSpinDirection = -this.state.wheelSpinDirection;
      }
      if (this.position.x > 7 && this.state.direction === "BACK") {
        this.state.direction = "FRONT";
        this.state.wheelSpinDirection = -this.state.wheelSpinDirection;
      }
    }
    if (this.state.baseMovement === "Z") {
      if (this.state.direction === "FRONT") {
        this.position.z -= this.state.displaceMent * delta;
      }
      if (this.state.direction === "BACK") {
        this.position.z += this.state.displaceMent * delta;
      }
      if (this.position.z < -7 && this.state.direction === "FRONT") {
        this.state.direction = "BACK";
        this.state.wheelSpinDirection = -this.state.wheelSpinDirection;
      }
      if (this.position.z > 7 && this.state.direction === "BACK") {
        this.state.direction = "FRONT";
        this.state.wheelSpinDirection = -this.state.wheelSpinDirection;
      }
    }
  }
}

export { Train };

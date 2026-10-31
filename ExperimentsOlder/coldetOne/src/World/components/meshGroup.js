import {
  SphereBufferGeometry,
  BoxBufferGeometry,
  TorusKnotBufferGeometry,
  Group,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  MaxEquation,
  Box3,
  BoxHelper,
  Vector3,
} from "three";

function createMeshGroup() {
  const mainGroup = new Group();

  const geometry = new SphereBufferGeometry(0.5, 16, 16);
  const material1 = new MeshStandardMaterial({
    color: "indigo",
    flatShading: true,
  });
  const material2 = new MeshStandardMaterial({
    color: "greenyellow",
    flatShading: true,
  });
  const one = new Mesh(geometry, material1);
  one.geometry.computeBoundingBox();

  const two = new Mesh(geometry, material2);
  two.geometry.computeBoundingBox();

  two.position.x = 1.5;
  mainGroup.add(one);
  mainGroup.add(two);

  let boundary = {
    right: 8,
    left: -8,
  };
  let oneState = {
    direction: 1, //Direction change -(direction) will reflect
    speed: 0.08,
  };
  let twoState = {
    direction: 1,
    speed: 0.01,
  };

  let box1 = new Box3();
  let box2 = new Box3();

  mainGroup.tick = (delta) => {
    if (one.position.x > boundary.right) {
      oneState.direction = -oneState.direction;
    }
    if (one.position.x < boundary.left) {
      oneState.direction = -oneState.direction;
    }

    if (two.position.x > boundary.right) {
      twoState.direction = -twoState.direction;
    }
    if (two.position.x < boundary.left) {
      twoState.direction = -twoState.direction;
    }
    //This is key to get current Bounding Box on Animation Loop
    box1.setFromObject(one);
    box2.setFromObject(two);
    if (box1.intersectsBox(box2)) {
      //change Direction and speed aswell.
      twoState.direction = -twoState.direction;
      twoState.speed = -oneState.speed;
      oneState.direction = -oneState.direction;
      oneState.speed = -twoState.speed;
    }

    one.position.x += oneState.direction * oneState.speed;
    two.position.x += twoState.direction * twoState.speed;
  };
  return mainGroup;
}

export { createMeshGroup };

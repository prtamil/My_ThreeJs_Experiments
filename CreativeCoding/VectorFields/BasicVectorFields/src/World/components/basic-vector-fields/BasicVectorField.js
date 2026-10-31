import {
  Color,
  ConeGeometry,
  CylinderGeometry,
  DynamicDrawUsage,
  Group,
  InstancedMesh,
  Matrix4,
  MeshBasicMaterial,
  Quaternion,
  SRGBColorSpace,
  Vector3,
} from "three";
import { FIELD_SETTINGS, THEMES } from "./config.js";

const UP = new Vector3(0, 1, 0);
const MIN_VECTOR_LENGTH_SQ = 1e-10;

class BasicVectorField {
  constructor() {
    this.field = 3;
    this.animated = true;
    this.timeScale = 1;
    this.arrowLength = FIELD_SETTINGS.arrowLength;
    this.theme = 0;
    this.directionColors = true;
    this.time = 0;
    this.group = new Group();
    this.group.name = "VectorFieldInstances";
    this.themeColors = THEMES.map((theme) => ({
      trail: theme.trail.map((rgb) =>
        new Color().setRGB(...rgb, SRGBColorSpace),
      ),
      flash: new Color().setRGB(...theme.flash, SRGBColorSpace),
    }));

    this.positions = this.createGridPositions();
    this.createArrowMeshes();

    this.group.add(this.shafts, this.heads);
    this.updateInstances();
  }

  createGridPositions() {
    const positions = [];
    const offset = (FIELD_SETTINGS.gridSize - 1) * 0.5;

    for (let x = 0; x < FIELD_SETTINGS.gridSize; x += 1) {
      for (let y = 0; y < FIELD_SETTINGS.gridSize; y += 1) {
        for (let z = 0; z < FIELD_SETTINGS.gridSize; z += 1) {
          positions.push(
            new Vector3(
              (x - offset) * FIELD_SETTINGS.spacing,
              (y - offset) * FIELD_SETTINGS.spacing,
              (z - offset) * FIELD_SETTINGS.spacing,
            ),
          );
        }
      }
    }

    return positions;
  }

  createArrowMeshes() {
    this.shaftGeometry = new CylinderGeometry(
      FIELD_SETTINGS.shaftRadius,
      FIELD_SETTINGS.shaftRadius,
      1,
      6,
    );
    this.headGeometry = new ConeGeometry(FIELD_SETTINGS.headRadius, 1, 7);
    this.material = new MeshBasicMaterial({
      color: 0xffffff,
      toneMapped: false,
    });

    this.shafts = new InstancedMesh(
      this.shaftGeometry,
      this.material,
      this.positions.length,
    );
    this.heads = new InstancedMesh(
      this.headGeometry,
      this.material,
      this.positions.length,
    );

    this.shafts.name = "VectorFieldShafts";
    this.heads.name = "VectorFieldHeads";
    this.shafts.instanceMatrix.setUsage(DynamicDrawUsage);
    this.heads.instanceMatrix.setUsage(DynamicDrawUsage);
    this.shafts.frustumCulled = false;
    this.heads.frustumCulled = false;
  }

  sample(position, target) {
    const { x, y, z } = position;

    switch (this.field) {
      case 0:
        return target.copy(position);
      case 1:
        return target.set(-y, x, 0);
      case 2:
        return target.copy(position).multiplyScalar(-1);
      case 3:
        return target.set(
          Math.sin(y * 0.5 + this.time),
          Math.cos(x * 0.5 + this.time),
          Math.sin(z * 0.5 + this.time),
        );
      default:
        return target.set(0, 1, 0);
    }
  }

  updateInstances() {
    const direction = new Vector3();
    const center = new Vector3();
    const scale = new Vector3();
    const rotation = new Quaternion();
    const matrix = new Matrix4();
    const shaftColor = new Color();
    const headColor = new Color();
    const theme = this.themeColors[this.theme];
    const headLength = Math.min(
      FIELD_SETTINGS.headLength,
      this.arrowLength * 0.45,
    );
    const shaftLength = Math.max(this.arrowLength - headLength, 0.01);

    this.positions.forEach((position, index) => {
      this.sample(position, direction);

      if (direction.lengthSq() < MIN_VECTOR_LENGTH_SQ) {
        direction.copy(UP);
      } else {
        direction.normalize();
      }

      rotation.setFromUnitVectors(UP, direction);

      center.copy(position).addScaledVector(direction, shaftLength * 0.5);
      scale.set(1, shaftLength, 1);
      matrix.compose(center, rotation, scale);
      this.shafts.setMatrixAt(index, matrix);

      center
        .copy(position)
        .addScaledVector(direction, shaftLength + headLength * 0.5);
      scale.set(1, headLength, 1);
      matrix.compose(center, rotation, scale);
      this.heads.setMatrixAt(index, matrix);

      if (this.directionColors) {
        const directionPhase =
          (Math.atan2(direction.y, direction.x) / (Math.PI * 2) +
            1 +
            (direction.z + 1) * 0.125) %
          1;
        const palettePosition = directionPhase * theme.trail.length;
        const colorIndex = Math.floor(palettePosition) % theme.trail.length;
        const nextColorIndex = (colorIndex + 1) % theme.trail.length;

        shaftColor
          .copy(theme.trail[colorIndex])
          .lerp(theme.trail[nextColorIndex], palettePosition - colorIndex);
      } else {
        shaftColor.copy(theme.trail[2]);
      }

      headColor.copy(shaftColor).lerp(theme.flash, 0.58);
      this.shafts.setColorAt(index, shaftColor);
      this.heads.setColorAt(index, headColor);
    });

    this.shafts.instanceMatrix.needsUpdate = true;
    this.heads.instanceMatrix.needsUpdate = true;
    this.shafts.instanceColor.needsUpdate = true;
    this.heads.instanceColor.needsUpdate = true;
  }

  setField(field) {
    this.field = Math.min(Math.max(Number(field), 0), 3);
    this.updateInstances();
  }

  setArrowLength(length) {
    this.arrowLength = Number(length);
    this.updateInstances();
  }

  setTheme(theme) {
    this.theme = Math.min(
      Math.max(Number(theme), 0),
      THEMES.length - 1,
    );
    this.updateInstances();
  }

  setDirectionColors(enabled) {
    this.directionColors = enabled;
    this.updateInstances();
  }

  reset() {
    this.time = 0;
    this.updateInstances();
  }

  tick(delta) {
    if (this.field !== 3 || !this.animated) return;

    this.time += delta * this.timeScale;
    this.updateInstances();
  }

  dispose() {
    this.shaftGeometry.dispose();
    this.headGeometry.dispose();
    this.material.dispose();
    this.group.clear();
  }
}

export { BasicVectorField };

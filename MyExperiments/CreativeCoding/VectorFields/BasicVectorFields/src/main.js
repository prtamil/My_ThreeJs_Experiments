import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(5, 5, 10);
controls.update();

// Grid and vector field settings
const gridSize = 10; // Number of grid points per axis
const spacing = 1.0; // Distance between grid points
const arrowLength = 0.5;
const arrowHeadSize = 0.2;

let currentField = 3; // 0 = Radial, 1 = Circular, 2 = Attractive, 3 = Dynamic
let time = 0; // Time for dynamic field
const arrows = []; // Store arrows for easy updates

// Generate the 3D vector field
function createVectorField() {
  // Clear previous arrows
  arrows.forEach((arrow) => scene.remove(arrow));
  arrows.length = 0;

  for (let x = -gridSize / 2; x < gridSize / 2; x++) {
    for (let y = -gridSize / 2; y < gridSize / 2; y++) {
      for (let z = -gridSize / 2; z < gridSize / 2; z++) {
        const position = new THREE.Vector3(
          x * spacing,
          y * spacing,
          z * spacing
        );
        const direction = getFieldVector(
          position,
          currentField,
          time
        ).normalize();
        const arrowHelper = new THREE.ArrowHelper(
          direction,
          position,
          arrowLength,
          0xffffff,
          arrowHeadSize,
          arrowHeadSize * 0.5
        );
        scene.add(arrowHelper);
        arrows.push(arrowHelper);
      }
    }
  }
}

// Vector field functions
function getFieldVector(position, fieldType, time) {
  const x = position.x,
    y = position.y,
    z = position.z;

  if (fieldType === 0) return position.clone(); // Radial: Points outward
  if (fieldType === 1) return new THREE.Vector3(-y, x, 0); // Circular: Rotate around Z-axis
  if (fieldType === 2) return position.clone().multiplyScalar(-1); // Attractive: Points inward
  if (fieldType === 3)
    return new THREE.Vector3(
      Math.sin(y * 0.5 + time),
      Math.cos(x * 0.5 + time),
      Math.sin(z * 0.5 + time)
    ); // Dynamic: Changes over time

  return new THREE.Vector3(0, 0, 0); // Default
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  // Update dynamic field
  if (currentField === 3) {
    time += 0.01;
    arrows.forEach((arrow) => {
      const direction = getFieldVector(
        arrow.position,
        currentField,
        time
      ).normalize();
      arrow.setDirection(direction);
    });
  }

  controls.update();
  renderer.render(scene, camera);
}

// Event listener for switching fields
window.addEventListener("keydown", (event) => {
  if (event.key === "1") currentField = 0; // Radial
  if (event.key === "2") currentField = 1; // Circular
  if (event.key === "3") currentField = 2; // Attractive
  if (event.key === "4") currentField = 3; // Dynamic
  createVectorField();
});

// Resize event
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Initialize and animate
createVectorField();
animate();

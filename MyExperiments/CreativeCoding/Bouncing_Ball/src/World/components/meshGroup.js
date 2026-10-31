import {
  Group,
  Mesh,
  SphereGeometry,
  BoxGeometry,
  MeshStandardMaterial,
  Line,
  BufferGeometry,
  LineBasicMaterial,
  Vector3,
  Color,
} from "three";

/**
 * Chaos playground
 * - Billiards-style balls
 * - Random colors, velocities
 * - Walls
 * - Velocity debug vectors
 * - Single file, structured: state / mesh / update
 */

//////////////////////////
// BALL FACTORY
//////////////////////////
function createBall({ radius, pos, vel, color }) {
  const state = { pos: pos.clone(), vel: vel.clone(), radius };

  const mesh = new Mesh(
    new SphereGeometry(radius, 16, 16),
    new MeshStandardMaterial({ color: new Color(color), flatShading: true })
  );
  mesh.position.copy(state.pos);

  // velocity debug line
  const lineMat = new LineBasicMaterial({ color: 0xffffff });
  const lineGeom = new BufferGeometry().setFromPoints([
    state.pos,
    state.pos.clone().add(state.vel),
  ]);
  const line = new Line(lineGeom, lineMat);

  function update(dt, bounds) {
    // integrate
    state.pos.addScaledVector(state.vel, dt);

    // wall collision
    if (state.pos.x > bounds - radius) {
      state.pos.x = bounds - radius;
      state.vel.x *= -1;
    }
    if (state.pos.x < -bounds + radius) {
      state.pos.x = -bounds + radius;
      state.vel.x *= -1;
    }
    if (state.pos.y > bounds - radius) {
      state.pos.y = bounds - radius;
      state.vel.y *= -1;
    }
    if (state.pos.y < -bounds + radius) {
      state.pos.y = -bounds + radius;
      state.vel.y *= -1;
    }

    // sync mesh
    mesh.position.copy(state.pos);

    // update debug line
    line.geometry.setFromPoints([
      state.pos.clone(),
      state.pos.clone().add(state.vel),
    ]);
  }

  return { state, mesh, update, debug: line };
}

//////////////////////////
// WALL FACTORY
//////////////////////////
function createWall({ width, height, x, y }) {
  const state = { pos: new Vector3(x, y, 0), size: { width, height } };

  const mesh = new Mesh(
    new BoxGeometry(width, height, 0.2),
    new MeshStandardMaterial({ color: new Color("gray") })
  );
  mesh.position.copy(state.pos);

  function update() {} // static

  return { state, mesh, update };
}

//////////////////////////
// MAIN MESH GROUP
//////////////////////////
function createMeshGroup({
  ballCount = 10,
  bounds = 4,
  ballRadius = 0.2,
  maxVel = 3,
  showVelocity = true,
} = {}) {
  const group = new Group();

  // ---- walls ----
  const walls = [
    createWall({ width: 0.2, height: bounds * 2, x: -bounds, y: 0 }),
    createWall({ width: 0.2, height: bounds * 2, x: bounds, y: 0 }),
    createWall({ width: bounds * 2, height: 0.2, x: 0, y: bounds }),
    createWall({ width: bounds * 2, height: 0.2, x: 0, y: -bounds }),
  ];
  walls.forEach((w) => group.add(w.mesh));

  // ---- balls ----
  const balls = [];
  for (let i = 0; i < ballCount; i++) {
    const pos = new Vector3(
      (Math.random() - 0.5) * bounds * 1.5,
      (Math.random() - 0.5) * bounds * 1.5,
      0
    );
    const vel = new Vector3(
      (Math.random() * 2 - 1) * maxVel,
      (Math.random() * 2 - 1) * maxVel,
      0
    );
    const color = new Color(Math.random(), Math.random(), Math.random());
    const ball = createBall({ radius: ballRadius, pos, vel, color });
    balls.push(ball);
    group.add(ball.mesh);
    if (showVelocity) group.add(ball.debug);
  }

  // ---- tick loop ----
  group.tick = (dt) => {
    // 1. Update balls (position + walls)
    balls.forEach((b) => b.update(dt, bounds));

    // 2. Ball–ball billiards collisions
    for (let i = 0; i < balls.length; i++) {
      for (let j = i + 1; j < balls.length; j++) {
        const b1 = balls[i];
        const b2 = balls[j];

        const delta = new Vector3().subVectors(b2.state.pos, b1.state.pos);
        const dist = delta.length();
        const minDist = b1.state.radius + b2.state.radius;

        if (dist < minDist) {
          const normal = delta.clone().divideScalar(dist);

          // relative velocity along normal
          const relVel = b1.state.vel.clone().sub(b2.state.vel);
          const velAlongNormal = relVel.dot(normal);

          if (velAlongNormal < 0) {
            // Elastic collision (equal mass)
            const impulse = normal.clone().multiplyScalar(velAlongNormal);
            b1.state.vel.sub(impulse);
            b2.state.vel.add(impulse);
          }

          // separate overlapping balls
          const overlap = minDist - dist;
          b1.state.pos.addScaledVector(normal, -overlap / 2);
          b2.state.pos.addScaledVector(normal, overlap / 2);
        }
      }
    }

    // 3. Update debug lines
    if (showVelocity) {
      balls.forEach((b) => {
        b.debug.geometry.setFromPoints([
          b.state.pos.clone(),
          b.state.pos.clone().add(b.state.vel),
        ]);
      });
    }
  };

  return group;
}

export { createMeshGroup };

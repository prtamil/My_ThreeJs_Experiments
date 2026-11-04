import Stats from "three/addons/libs/stats.module.js";

function createStats() {
  const stats = new Stats();
  stats.tick = () => {
    stats.update();
  };
  return stats;
}
export { createStats };

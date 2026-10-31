import Stats from "three/examples/jsm/libs/stats.module";

function createStats() {
  const stats = new Stats();
  stats.tick = () => {
    stats.update();
  };
  return stats;
}
export { createStats };

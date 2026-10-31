import { World } from "./World/World.js";

const PAGE_TITLE = "Perlin Noise Flow";

function main() {
  document.title = PAGE_TITLE;
  document.querySelector("#page-title").textContent = PAGE_TITLE;
  const world = new World(document.querySelector("#scene-container"));
  world.start();
  if (import.meta.hot) import.meta.hot.dispose(() => world.dispose());
}

main();

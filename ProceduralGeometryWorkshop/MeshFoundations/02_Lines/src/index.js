import { World } from "./World/World.js";

const PAGE_TITLE = "Lines";

function main() {
  document.title = PAGE_TITLE;
  document.querySelector("#page-title").textContent = PAGE_TITLE;

  const container = document.querySelector("#scene-container");
  const world = new World(container);
  world.start();

  if (import.meta.hot) {
    import.meta.hot.dispose(() => world.dispose());
  }
}

main();

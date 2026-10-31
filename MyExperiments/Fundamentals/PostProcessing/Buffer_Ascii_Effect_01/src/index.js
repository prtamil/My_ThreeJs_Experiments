import { World } from "./World/World";

function main() {
  const container = document.querySelector("#canvas");
  const world = new World(container);
  world.start();
}

main();

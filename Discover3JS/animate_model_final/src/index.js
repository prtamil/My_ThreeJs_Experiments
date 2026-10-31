import { World } from "./World/World";

async function main() {
  const container = document.querySelector("#scene-container");
  const world = new World(container);
  //Wait and load all assets
  await world.init();
  world.start();
}

main().catch((err) => {
  console.error("Main Error");
  console.error(err);
});

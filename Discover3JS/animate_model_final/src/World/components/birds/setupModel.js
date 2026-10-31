import { AnimationMixer } from "three";

//Extract geometry/Animation from model
function setupModel(data) {
  //  const model = data.scene.children[0].clone();
  //without clones it moves from children[0] to model,
  //ie., it removes from parrotData loader structure and moves
  //Use clone to preserve data in loader
  //else use without clone

  const model = data.scene.children[0];
  const clip = data.animations[0];
  const mixer = new AnimationMixer(model);
  const action = mixer.clipAction(clip);
  action.play();
  model.tick = (delta) => mixer.update(delta);
  return model;
}
export { setupModel };

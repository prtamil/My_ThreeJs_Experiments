function createKeyboardControls(vectorField) {
  function onKeyDown(event) {
    if (event.target.matches("input, select, textarea")) return;

    const field = Number.parseInt(event.key, 10) - 1;

    if (field >= 0 && field <= 3) {
      vectorField.setField(field);
    }
  }

  window.addEventListener("keydown", onKeyDown);

  return {
    dispose() {
      window.removeEventListener("keydown", onKeyDown);
    },
  };
}

export { createKeyboardControls };

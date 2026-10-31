class Resizer {
  constructor(container, camera, renderer) {
    this.container = container;
    this.camera = camera;
    this.renderer = renderer;
    this.width = 0;
    this.height = 0;
    this.pixelRatio = 0;
    this.resize = this.resize.bind(this);

    window.addEventListener("resize", this.resize);

    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(this.resize);
      this.resizeObserver.observe(container);
    }

    this.resize();
  }

  resize() {
    const width = Math.max(this.container.clientWidth, 1);
    const height = Math.max(this.container.clientHeight, 1);
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

    if (
      width === this.width &&
      height === this.height &&
      pixelRatio === this.pixelRatio
    ) {
      return;
    }

    this.width = width;
    this.height = height;
    this.pixelRatio = pixelRatio;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(width, height);
    this.onResize();
  }

  onResize() {}

  dispose() {
    window.removeEventListener("resize", this.resize);
    this.resizeObserver?.disconnect();
  }
}

export { Resizer };

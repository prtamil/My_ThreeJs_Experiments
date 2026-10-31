import {
  BufferAttribute,
  BufferGeometry,
  ClampToEdgeWrapping,
  DataTexture,
  DoubleSide,
  DynamicDrawUsage,
  Group,
  Mesh,
  NearestFilter,
  PlaneGeometry,
  Points,
  RGBAFormat,
  ShaderMaterial,
  UnsignedByteType,
  Vector2,
  Vector3,
} from "three";
import { MAP, THEMES } from "./config.js";

const MAX_ATTRACTORS = 32;
const VIEW_HEIGHT = 9.8;

const surfaceVertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const surfaceFragmentShader = `
  uniform sampler2D uTrailMap;
  uniform vec2 uGridSize;
  uniform float uGlyphStyle;
  uniform vec3 uPalette0;
  uniform vec3 uPalette1;
  uniform vec3 uPalette2;
  uniform vec3 uPalette3;

  varying vec2 vUv;

  vec3 paletteColor(float band) {
    if (band < 0.5) return uPalette0;
    if (band < 1.5) return uPalette1;
    if (band < 2.5) return uPalette2;
    return uPalette3;
  }

  float glyphMask(vec2 point, float glow) {
    vec2 physicalPoint = vec2(point.x, point.y * 1.9);
    float radius = mix(0.09, 0.46, glow);
    float dotMask = 1.0 - smoothstep(
      radius,
      radius + 0.07,
      length(physicalPoint)
    );

    float thickness = mix(0.025, 0.12, glow);
    float vertical = 1.0 - smoothstep(
      thickness,
      thickness + 0.025,
      abs(physicalPoint.x)
    );
    float horizontal = 1.0 - smoothstep(
      thickness,
      thickness + 0.025,
      abs(physicalPoint.y)
    );
    float crossMask = max(vertical, horizontal);

    float diamondDistance =
      abs(physicalPoint.x) + abs(physicalPoint.y);
    float diamondMask = 1.0 - smoothstep(
      radius,
      radius + 0.07,
      diamondDistance
    );

    float squareExtent = mix(0.08, 0.45, glow);
    float squareDistance = max(
      abs(physicalPoint.x),
      abs(physicalPoint.y)
    );
    float squareMask = 1.0 - smoothstep(
      squareExtent,
      squareExtent + 0.04,
      squareDistance
    );

    if (uGlyphStyle < 0.5) return dotMask * 0.78;
    if (uGlyphStyle < 1.5) return max(dotMask, crossMask * 0.55);
    if (uGlyphStyle < 2.5) return max(dotMask, crossMask);
    if (uGlyphStyle < 3.5) return max(diamondMask, crossMask);
    return max(squareMask, crossMask);
  }

  void main() {
    vec2 sampleUv = vec2(vUv.x, 1.0 - vUv.y);
    vec4 trail = texture2D(uTrailMap, sampleUv);
    float glow = trail.g;
    float band = floor(trail.r * 3.0 + 0.5);
    vec2 localCell = fract(vUv * uGridSize) - 0.5;
    float mask = glyphMask(localCell, glow);
    vec3 background = vec3(0.0025, 0.0045, 0.012);

    float vignette = smoothstep(
      0.95,
      0.28,
      distance(vUv, vec2(0.5))
    );
    float scanline = 0.965 + 0.035 * sin(vUv.y * uGridSize.y * 3.14159265);
    vec3 trailColor = paletteColor(band) * glow * mask * 1.7;
    vec3 color = background * (0.68 + 0.32 * vignette) + trailColor;
    color *= scanline;

    gl_FragColor = vec4(color, 1.0);
  }
`;

const markerVertexShader = `
  uniform float uTime;

  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    float pulse = 1.0 + 0.1 * sin(uTime * 3.0);
    gl_PointSize = pulse * 180.0 / max(-viewPosition.z, 1.0);
    gl_Position = projectionMatrix * viewPosition;
  }
`;

const markerFragmentShader = `
  uniform vec3 uColor;

  void main() {
    float radius = length(gl_PointCoord - vec2(0.5)) * 2.0;
    float outer = 1.0 - smoothstep(0.78, 1.0, radius);
    float inner = 1.0 - smoothstep(0.24, 0.42, radius);
    float ring = max(outer - inner, inner * 0.7);

    if (ring <= 0.001) discard;
    gl_FragColor = vec4(uColor * (1.25 + ring), ring);
  }
`;

class FlowFieldSurface {
  constructor(simulation) {
    this.group = new Group();
    this.textureData = new Uint8Array(MAP.width * MAP.height * 4);
    this.trailTexture = new DataTexture(
      this.textureData,
      MAP.width,
      MAP.height,
      RGBAFormat,
      UnsignedByteType,
    );
    this.trailTexture.minFilter = NearestFilter;
    this.trailTexture.magFilter = NearestFilter;
    this.trailTexture.wrapS = ClampToEdgeWrapping;
    this.trailTexture.wrapT = ClampToEdgeWrapping;
    this.trailTexture.generateMipmaps = false;

    this.surfaceGeometry = new PlaneGeometry(1, 1, 1, 1);
    this.surfaceMaterial = new ShaderMaterial({
      uniforms: {
        uTrailMap: { value: this.trailTexture },
        uGridSize: { value: new Vector2(MAP.width, MAP.height) },
        uGlyphStyle: { value: simulation.glyphStyle },
        uPalette0: { value: new Vector3() },
        uPalette1: { value: new Vector3() },
        uPalette2: { value: new Vector3() },
        uPalette3: { value: new Vector3() },
      },
      vertexShader: surfaceVertexShader,
      fragmentShader: surfaceFragmentShader,
      depthTest: false,
      depthWrite: false,
      side: DoubleSide,
    });
    this.surfaceMesh = new Mesh(this.surfaceGeometry, this.surfaceMaterial);
    this.surfaceMesh.position.z = -0.02;
    this.surfaceMesh.frustumCulled = false;
    this.surfaceMesh.renderOrder = 0;

    this.markerPositions = new Float32Array(MAX_ATTRACTORS * 3);
    this.markerGeometry = new BufferGeometry();
    this.markerPositionAttribute = new BufferAttribute(
      this.markerPositions,
      3,
    );
    this.markerPositionAttribute.setUsage(DynamicDrawUsage);
    this.markerGeometry.setAttribute("position", this.markerPositionAttribute);
    this.markerGeometry.setDrawRange(0, 0);
    this.markerMaterial = new ShaderMaterial({
      uniforms: {
        uColor: { value: new Vector3(1, 1, 0.2) },
        uTime: { value: 0 },
      },
      vertexShader: markerVertexShader,
      fragmentShader: markerFragmentShader,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    this.markerPoints = new Points(this.markerGeometry, this.markerMaterial);
    this.markerPoints.frustumCulled = false;
    this.markerPoints.renderOrder = 1;

    this.group.add(this.surfaceMesh, this.markerPoints);
    this.planeWidth = VIEW_HEIGHT * (window.innerWidth / window.innerHeight);
    this.planeHeight = VIEW_HEIGHT;
    this.lastTheme = -1;
    this.lastGlyphStyle = -1;
    this.resize(window.innerWidth, window.innerHeight);
    this.update(simulation);
  }

  resize(width, height) {
    const safeWidth = Math.max(width, 1);
    const safeHeight = Math.max(height, 1);
    this.planeHeight = VIEW_HEIGHT;
    this.planeWidth = VIEW_HEIGHT * (safeWidth / safeHeight);
    this.surfaceMesh.scale.set(this.planeWidth, this.planeHeight, 1);
  }

  update(simulation) {
    this.updateTrailTexture(simulation);
    this.updateAppearance(simulation);
    this.updateMarkers(simulation);
    this.markerMaterial.uniforms.uTime.value = simulation.time;
  }

  updateTrailTexture(simulation) {
    for (let index = 0; index < simulation.totalCells; index += 1) {
      const pixel = index * 4;
      const glow = Math.max(0, Math.min(1, simulation.glow[index]));
      this.textureData[pixel] = simulation.colorBand[index] * 85;
      this.textureData[pixel + 1] = Math.round(glow * 255);
      this.textureData[pixel + 2] = 0;
      this.textureData[pixel + 3] = 255;
    }

    this.trailTexture.needsUpdate = true;
  }

  updateAppearance(simulation) {
    if (simulation.theme !== this.lastTheme) {
      const theme = THEMES[simulation.theme];
      const uniforms = this.surfaceMaterial.uniforms;

      uniforms.uPalette0.value.set(...theme.trail[0]);
      uniforms.uPalette1.value.set(...theme.trail[1]);
      uniforms.uPalette2.value.set(...theme.trail[2]);
      uniforms.uPalette3.value.set(...theme.trail[3]);
      this.markerMaterial.uniforms.uColor.value.set(...theme.flash);
      this.lastTheme = simulation.theme;
    }

    if (simulation.glyphStyle !== this.lastGlyphStyle) {
      this.surfaceMaterial.uniforms.uGlyphStyle.value =
        simulation.glyphStyle;
      this.lastGlyphStyle = simulation.glyphStyle;
    }
  }

  updateMarkers(simulation) {
    const count = Math.min(simulation.activeAttractors.length, MAX_ATTRACTORS);

    for (let index = 0; index < count; index += 1) {
      const attractor = simulation.activeAttractors[index];
      const offset = index * 3;
      this.markerPositions[offset] =
        (attractor.x / simulation.width - 0.5) * this.planeWidth;
      this.markerPositions[offset + 1] =
        (0.5 - attractor.y / simulation.height) * this.planeHeight;
      this.markerPositions[offset + 2] = 0.03;
    }

    this.markerGeometry.setDrawRange(0, count);
    this.markerPositionAttribute.needsUpdate = true;
  }

  dispose() {
    this.surfaceGeometry.dispose();
    this.surfaceMaterial.dispose();
    this.trailTexture.dispose();
    this.markerGeometry.dispose();
    this.markerMaterial.dispose();
    this.group.clear();
  }
}

export { FlowFieldSurface };

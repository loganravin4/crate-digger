import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { TIER_IDS, type TierId } from "@/lib/tiers";
import { drawResultCover, rng, type Fonts } from "./covers";

/**
 * Results: the records you pulled today, standing face-out on a lit shelf in the order
 * you played them. Deeper finds stand a little prouder; a holy grail glows gold.
 */

export type ShelfRecord = { tier: TierId | null; answer: string };

const SLEEVE = 1;

export class ShelfEngine {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(30, 1, 0.1, 40);
  private composer: EffectComposer | null = null;
  private groups: THREE.Group[] = [];
  private raf = 0;
  private running = false;
  private born = performance.now();
  private pointer = new THREE.Vector2();
  private reduced: boolean;
  private n: number;

  constructor(canvas: HTMLCanvasElement, records: ShelfRecord[], palette: { field: string; on: string }, reduced: boolean) {
    this.reduced = reduced;
    this.n = records.length;
    const css = getComputedStyle(document.documentElement);
    const fonts: Fonts = {
      display: css.getPropertyValue("--font-archivo").trim() || "sans-serif",
      text: css.getPropertyValue("--font-franklin").trim() || "sans-serif",
    };
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // Post-processing drops canvas transparency, so paint the page's own ink behind the shelf.
    // Tone mapping darkens it, so this lands on the page ink (#16130f) once rendered.
    this.scene.background = new THREE.Color("#2b241b");

    this.scene.add(new THREE.HemisphereLight("#ffe2b8", "#1a140e", 1.0));
    const key = new THREE.SpotLight("#ffd9a3", 34, 16, Math.PI / 3.6, 0.7, 1.4);
    key.position.set(0, 4.5, 4);
    key.target.position.set(0, 0.5, 0);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    this.scene.add(key, key.target);

    const width = records.length * 1.12;
    const plank = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.8, 0.08, 0.7),
      new THREE.MeshStandardMaterial({ color: "#5a3d24", roughness: 0.85 }),
    );
    plank.position.set(0, -0.04, 0);
    plank.receiveShadow = true;
    this.scene.add(plank);

    const geo = new THREE.BoxGeometry(SLEEVE, SLEEVE, 0.016);
    geo.translate(0, SLEEVE / 2, 0);
    const edge = new THREE.MeshStandardMaterial({ color: "#d8cfbd", roughness: 0.9 });
    const r = rng(records.length * 13 + 5);
    records.forEach((rec, i) => {
      const tex = new THREE.CanvasTexture(drawResultCover({ tier: rec.tier, answer: rec.answer, ...palette, fonts, size: 384 }));
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      const front = new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 0.55,
        emissive: rec.tier === "holy-grail" ? new THREE.Color("#f2c14e") : new THREE.Color("#000000"),
        emissiveIntensity: rec.tier === "holy-grail" ? 0.06 : 0,
      });
      const mesh = new THREE.Mesh(geo, [edge, edge, edge, edge, front, edge]);
      mesh.castShadow = true;
      const g = new THREE.Group();
      g.add(mesh);
      const x = (i - (records.length - 1) / 2) * 1.12;
      g.position.set(x, 0, 0.05);
      g.rotation.set(-0.08 + (r() - 0.5) * 0.04, (r() - 0.5) * 0.12, (r() - 0.5) * 0.03);
      g.userData = { depth: rec.tier ? TIER_IDS.indexOf(rec.tier) : -1, x };
      this.scene.add(g);
      this.groups.push(g);
      if (rec.tier === "holy-grail") {
        const glow = new THREE.PointLight("#f2c14e", 0.9, 1.6, 1.8);
        glow.position.set(x, 0.6, 0.7);
        this.scene.add(glow);
      }
    });

    try {
      const composer = new EffectComposer(this.renderer);
      composer.addPass(new RenderPass(this.scene, this.camera));
      composer.addPass(new UnrealBloomPass(new THREE.Vector2(256, 256), 0.22, 0.5, 0.92));
      composer.addPass(new OutputPass());
      this.composer = composer;
    } catch {
      this.composer = null;
    }

    canvas.addEventListener("pointermove", (e) => {
      const rect = canvas.getBoundingClientRect();
      this.pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, ((e.clientY - rect.top) / rect.height) * 2 - 1);
    });
    this.resize();
  }

  resize() {
    const c = this.renderer.domElement;
    const w = Math.max(1, c.clientWidth);
    const h = Math.max(1, c.clientHeight);
    this.renderer.setSize(w, h, false);
    this.composer?.setSize(w, h);
    this.camera.aspect = w / h;
    // Fit the whole shelf in width, whatever the aspect.
    const span = this.n * 1.12 + 0.6;
    const dist = Math.max(3.2, span / 2 / Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) / this.camera.aspect);
    this.camera.position.set(0, 1.25, dist);
    this.camera.lookAt(0, 0.55, 0);
    this.camera.updateProjectionMatrix();
  }

  start() {
    if (this.running) return;
    this.running = true;
    const loop = (now: number) => {
      if (!this.running) return;
      this.tick(now);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  dispose() {
    this.stop();
    this.renderer.dispose();
  }

  private tick(now: number) {
    const t = (now - this.born) / 1000;
    this.groups.forEach((g, i) => {
      // Records slide onto the shelf one after another, deeper finds standing a touch taller.
      const appear = this.reduced ? 1 : Math.min(1, Math.max(0, (t - 0.15 - i * 0.12) / 0.6));
      const e = 1 - Math.pow(1 - appear, 3);
      const depth = g.userData.depth as number;
      g.position.y = (1 - e) * 1.2 + (depth >= 0 ? depth * 0.025 : -0.05);
      g.scale.setScalar(0.001 + e * (0.999 - (depth < 0 ? 0.06 : 0)));
    });
    if (!this.reduced) {
      const target = new THREE.Vector3(this.pointer.x * 0.35, 1.25 - this.pointer.y * 0.15, this.camera.position.z);
      this.camera.position.lerp(target, 0.05);
      this.camera.lookAt(0, 0.55, 0);
    }
    if (this.composer) this.composer.render();
    else this.renderer.render(this.scene, this.camera);
  }
}

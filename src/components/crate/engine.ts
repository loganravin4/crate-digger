import * as THREE from "three";
import { BokehPass } from "three/examples/jsm/postprocessing/BokehPass.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { TIER_IDS, type TierId } from "@/lib/tiers";
import { drawCover, drawDivider, drawGlow, drawPackCover, drawResultCover, FIELDS, rng, type Fonts } from "./covers";

/**
 * The crate: a lit wooden crate of record sleeves seen from where a digger stands.
 * An answer is found by flipping sleeves forward, fingers-first, past a divider card
 * for each tier. The rarer the answer, the further back it sits. The found sleeve is
 * pulled up and turned to face you with your answer printed as its cover.
 */

export type CrateOptions = {
  seed: number;
  field: string;
  on: string;
  reducedMotion: boolean;
  /** Where the crate sits in the frame, 0 = centered, positive pushes it lower. */
  frameShift?: number;
  /** Idle mode: no input, slow self-browsing. */
  demo?: boolean;
  /** Home page: featured pack sleeves propped in front of the crate. */
  packs?: FeaturedPack[];
};

export type FeaturedPack = { id: string; name: string; series: string; field: string; on: string; voice?: "condensed" | "wide" | "italic" };

type Featured = { pack: FeaturedPack; group: THREE.Group; mesh: THREE.Mesh; home: THREE.Vector3; homeRot: THREE.Euler; lift: number };

type Slot = {
  group: THREE.Group;
  mesh: THREE.Mesh;
  z: number;
  divider: TierId | null;
  angle: number;
  target: number;
  vel: number;
  passed: boolean;
};

const PER_SECTION = 12;
const DZ = 0.07;
const REST = -0.2; // leaning back on the sleeves behind
const FLIPPED = 0.62; // pushed forward toward the digger
const SLEEVE = 1;
const THICK = 0.014;

const ease = {
  inOut: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outBack: (t: number) => 1 + 2.4 * Math.pow(t - 1, 3) + 1.4 * Math.pow(t - 1, 2),
  out: (t: number) => 1 - Math.pow(1 - t, 3),
};

export class CrateEngine {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(38, 1, 0.1, 60);
  private opts: Required<Omit<CrateOptions, "packs">> & { packs: FeaturedPack[] };
  private composer: EffectComposer | null = null;
  private bokeh: BokehPass | null = null;
  private bloom: UnrealBloomPass | null = null;
  private ambient!: THREE.Points;
  private featured: Featured[] = [];
  private hovered = -1;
  private picking: { index: number; start: number; done: () => void } | null = null;
  /** Home: -1 shows the featured packs; 0..5 dives the camera to that tier's divider. */
  private dive = -1;
  private raycaster = new THREE.Raycaster();
  private lite = false;
  private ready = false;
  private fonts: Fonts;
  private slots: Slot[] = [];
  private sectionStart: number[] = [];
  private cursor = 0;
  private cursorFrom = 0;
  private cursorTo = 0;
  private cursorStart = 0;
  private cursorDur = 0;
  private camZ = 0;
  /** Camera height, distance, look-at height, look-ahead: eased between idle, digging, and pulled. */
  private camPose = [3.6, 4.6, 0.25, 1.0];
  private shift = 0;
  private shiftTo = 0;
  private shiftX = 0;
  private shiftXTo = 0;
  private raf = 0;
  private running = false;
  private last = performance.now();
  private key: THREE.SpotLight;
  private gold: THREE.PointLight;
  private dust: THREE.Points;
  private pull: { slot: Slot; start: number; done: boolean; tier: TierId | null; onLand?: () => void } | null = null;
  private resultTexture: THREE.CanvasTexture | null = null;
  private onFlip?: (divider: boolean) => void;
  private demoTimer = 0;

  constructor(canvas: HTMLCanvasElement, opts: CrateOptions) {
    this.opts = { ...opts, frameShift: opts.frameShift ?? 0.18, demo: opts.demo ?? false, packs: opts.packs ?? [] };
    const css = getComputedStyle(document.documentElement);
    this.fonts = {
      display: css.getPropertyValue("--font-archivo").trim() || "sans-serif",
      text: css.getPropertyValue("--font-franklin").trim() || "sans-serif",
    };
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
    this.lite = window.innerWidth < 768 || (navigator.hardwareConcurrency ?? 8) <= 4;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.lite ? 1.5 : 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    // Shadows are the costliest pass; phones go without.
    this.renderer.shadowMap.enabled = !this.lite;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene.background = new THREE.Color("#16130f");
    this.scene.fog = new THREE.Fog("#16130f", 4.5, 11);

    // Light: a warm lamp over the crate, a cool fill, and a gold light kept for the vault.
    this.scene.add(new THREE.HemisphereLight("#ffe2b8", "#1a140e", 0.55));
    this.key = new THREE.SpotLight("#ffd9a3", 42, 14, Math.PI / 5.5, 0.55, 1.6);
    this.key.position.set(0.6, 4.2, 2.2);
    this.key.castShadow = true;
    this.key.shadow.mapSize.set(1024, 1024);
    this.key.shadow.bias = -0.0004;
    this.scene.add(this.key, this.key.target);
    const fill = new THREE.DirectionalLight("#9fb4d8", 0.35);
    fill.position.set(-3, 2, 4);
    this.scene.add(fill);
    this.gold = new THREE.PointLight("#f2c14e", 0, 4, 1.6);
    this.scene.add(this.gold);

    this.build();
    this.dust = this.makeDust();
    this.scene.add(this.dust);
    this.ambient = this.makeAmbientDust();
    this.scene.add(this.ambient);
    if (this.opts.packs.length) this.buildFeatured();
    this.buildComposer();
    void document.fonts?.ready.then(() => this.refreshTextures());
    this.resize();
  }

  // ————— Build —————

  private build() {
    const r = rng(this.opts.seed);
    const covers = Array.from({ length: 18 }, (_, i) => {
      const t = new THREE.CanvasTexture(drawCover(this.opts.seed * 31 + i, this.fonts));
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      return t;
    });
    const sleeveGeo = new THREE.BoxGeometry(SLEEVE, SLEEVE, THICK);
    sleeveGeo.translate(0, SLEEVE / 2, 0);
    // Dividers are record height, so a section's label only shows once the sleeves in front of it are flipped.
    const dividerGeo = new THREE.BoxGeometry(SLEEVE * 1.01, SLEEVE * 0.99, 0.006);
    dividerGeo.translate(0, (SLEEVE * 0.99) / 2, 0);
    const edge = new THREE.MeshStandardMaterial({ color: "#d8cfbd", roughness: 0.9 });
    const back = new THREE.MeshStandardMaterial({ color: "#cbbf9f", roughness: 0.95 });

    let z = 0;
    let i = 0;
    for (const tier of TIER_IDS) {
      this.sectionStart.push(i);
      // Divider card in front of each section.
      const dtex = new THREE.CanvasTexture(drawDivider(tier, this.fonts));
      dtex.colorSpace = THREE.SRGBColorSpace;
      const dmat = new THREE.MeshStandardMaterial({ map: dtex, roughness: 0.85 });
      this.addSlot(new THREE.Mesh(dividerGeo, [edge, edge, edge, edge, dmat, dmat]), z, tier);
      z -= DZ;
      i++;
      for (let k = 0; k < PER_SECTION; k++) {
        const front = new THREE.MeshStandardMaterial({
          map: covers[Math.floor(r() * covers.length)],
          roughness: 0.62,
          metalness: 0.02,
        });
        const mesh = new THREE.Mesh(sleeveGeo, [edge, edge, edge, edge, front, back]);
        this.addSlot(mesh, z, null);
        z -= DZ * (0.92 + r() * 0.16);
        i++;
      }
    }
    this.buildCrate(-z);
    this.buildRoom(r);
  }

  private addSlot(mesh: THREE.Mesh, z: number, divider: TierId | null) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    const group = new THREE.Group();
    group.position.set((Math.random() - 0.5) * 0.02, 0.04, z);
    group.add(mesh);
    group.rotation.x = REST;
    this.scene.add(group);
    this.slots.push({ group, mesh, z, divider, angle: REST, target: REST, vel: 0, passed: false });
  }

  private buildCrate(length: number) {
    const wood = this.woodTexture();
    const mat = new THREE.MeshStandardMaterial({ map: wood, roughness: 0.8, color: "#9a6a3e" });
    const L = length + 0.5;
    const cz = -length / 2 + 0.05;
    const H = 0.5;
    const W = SLEEVE + 0.14;
    const parts: [number, number, number, number, number, number][] = [
      [W, 0.04, L, 0, 0.02, cz], // floor
      [0.05, H, L, -W / 2, H / 2, cz], // left
      [0.05, H, L, W / 2, H / 2, cz], // right
      [W, H * 0.7, 0.05, 0, (H * 0.7) / 2, cz + L / 2], // front (lower, so the face of the front record shows)
      [W, H, 0.05, 0, H / 2, cz - L / 2], // back
    ];
    for (const [w, h, d, x, y, zz] of parts) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, zz);
      m.castShadow = m.receiveShadow = true;
      this.scene.add(m);
    }
    // The table the crate sits on.
    const table = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 22),
      new THREE.MeshStandardMaterial({ color: "#2a2118", roughness: 0.95 }),
    );
    table.rotation.x = -Math.PI / 2;
    table.position.set(0, 0, cz);
    table.receiveShadow = true;
    this.scene.add(table);
  }

  private buildRoom(r: () => number) {
    // Back wall: shelves of record spines, out of focus behind the crate.
    const spines = this.lite ? 220 : 520;
    const geo = new THREE.BoxGeometry(0.05, 1, 0.9);
    const mat = new THREE.MeshStandardMaterial({ roughness: 0.8 });
    const shelfMesh = new THREE.InstancedMesh(geo, mat, spines);
    const m = new THREE.Matrix4();
    const color = new THREE.Color();
    let n = 0;
    for (let row = 0; row < 4 && n < spines; row++) {
      let x = -7;
      while (x < 7 && n < spines) {
        const w = 0.035 + r() * 0.03;
        const h = 0.7 + r() * 0.12;
        m.makeScale(w / 0.05, h, 1);
        m.setPosition(x, 0.45 + row * 1.05 + h / 2, -7.5);
        shelfMesh.setMatrixAt(n, m);
        color.set(FIELDS[Math.floor(r() * FIELDS.length)]).multiplyScalar(0.45 + r() * 0.3);
        shelfMesh.setColorAt(n, color);
        x += w + 0.004;
        n++;
      }
    }
    shelfMesh.count = n;
    this.scene.add(shelfMesh);
    const plank = new THREE.MeshStandardMaterial({ color: "#3a2716", roughness: 0.9 });
    for (let row = 0; row < 5; row++) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(14, 0.06, 1.1), plank);
      b.position.set(0, 0.42 + row * 1.05, -7.4);
      this.scene.add(b);
    }
    // Out-of-focus shop lamps.
    const colors = ["rgba(255,205,140,0.9)", "rgba(242,193,78,0.8)", "rgba(191,58,34,0.6)", "rgba(126,166,222,0.5)"];
    for (let i = 0; i < 16; i++) {
      const tex = new THREE.CanvasTexture(drawGlow(colors[Math.floor(r() * colors.length)]));
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.35 + r() * 0.35 }));
      const size = 0.4 + r() * 1.1;
      s.scale.set(size, size, 1);
      s.position.set((r() - 0.5) * 9, 1.4 + r() * 2.6, -6 - r() * 6);
      this.scene.add(s);
    }
  }

  private woodTexture(): THREE.CanvasTexture {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 256;
    const g = c.getContext("2d")!;
    g.fillStyle = "#7a5230";
    g.fillRect(0, 0, 256, 256);
    const r = rng(9);
    for (let y = 0; y < 256; y += 2) {
      g.fillStyle = `rgba(${40 + r() * 30},${25 + r() * 20},${10 + r() * 10},${0.15 + r() * 0.2})`;
      g.fillRect(0, y, 256, 1 + r() * 2);
    }
    for (let k = 0; k < 4; k++) {
      g.fillStyle = "rgba(30,18,8,0.5)";
      g.fillRect(0, k * 64, 256, 2);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1, 3);
    return t;
  }

  private makeDust(): THREE.Points {
    const n = 160;
    const pos = new Float32Array(n * 3);
    const r = rng(3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (r() - 0.5) * 2.4;
      pos[i * 3 + 1] = r() * 2.2;
      pos[i * 3 + 2] = (r() - 0.5) * 3;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color: "#f2c14e", size: 0.018, transparent: true, opacity: 0, depthWrite: false });
    return new THREE.Points(geo, mat);
  }

  private buildComposer() {
    // Desktop gets depth of field; every screen gets a gentle bloom on the lamp-lit highlights.
    try {
      const composer = new EffectComposer(this.renderer);
      composer.addPass(new RenderPass(this.scene, this.camera));
      const wide = window.innerWidth >= 900 && !this.opts.reducedMotion;
      if (wide) {
        this.bokeh = new BokehPass(this.scene, this.camera, { focus: 4.5, aperture: 0.0016, maxblur: 0.008 });
        composer.addPass(this.bokeh);
      }
      if (!this.lite) {
        this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.32, 0.6, 0.86);
        composer.addPass(this.bloom);
      }
      composer.addPass(new OutputPass());
      this.composer = composer;
    } catch {
      this.composer = null;
    }
  }

  private makeAmbientDust(): THREE.Points {
    // Dust always hangs in the lamp light; it drifts slowly upward and wraps around.
    const n = 260;
    const pos = new Float32Array(n * 3);
    const r = rng(17);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (r() - 0.5) * 5;
      pos[i * 3 + 1] = r() * 3.2;
      pos[i * 3 + 2] = (r() - 0.5) * 5;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color: "#ffe2b8", size: 0.012, transparent: true, opacity: 0.45, depthWrite: false });
    return new THREE.Points(geo, mat);
  }

  private buildFeatured() {
    // Featured packs stand on the table, propped against the crate's front, like a shop's new-arrivals display.
    const geo = new THREE.BoxGeometry(SLEEVE, SLEEVE, THICK);
    geo.translate(0, SLEEVE / 2, 0);
    const edge = new THREE.MeshStandardMaterial({ color: "#d8cfbd", roughness: 0.9 });
    const back = new THREE.MeshStandardMaterial({ color: "#cbbf9f", roughness: 0.95 });
    this.opts.packs.forEach((pack, i) => {
      const tex = new THREE.CanvasTexture(drawPackCover(pack, this.fonts));
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      const front = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55 });
      const mesh = new THREE.Mesh(geo, [edge, edge, edge, edge, front, back]);
      mesh.castShadow = mesh.receiveShadow = true;
      mesh.userData.featured = i;
      const group = new THREE.Group();
      group.add(mesh);
      this.scene.add(group);
      this.featured.push({ pack, group, mesh, home: new THREE.Vector3(), homeRot: new THREE.Euler(), lift: 0 });
    });
    this.layoutFeatured();
  }

  private layoutFeatured() {
    const narrow = this.camera.aspect < 0.8;
    const n = this.featured.length;
    this.featured.forEach((f, i) => {
      const k = i - (n - 1) / 2;
      if (narrow) {
        // Phones: fanned like a hand of records.
        f.home.set(k * 0.5, 0.02 + Math.abs(k) * 0.03, 0.75 - Math.abs(k) * 0.12 + (k === 0 ? 0.1 : 0));
        f.homeRot.set(-0.1, -k * 0.22, -k * 0.09);
      } else {
        f.home.set(k * 1.02, 0.02, 0.72 - Math.abs(k) * 0.12);
        f.homeRot.set(-0.14, -k * 0.2, 0);
      }
    });
  }

  /** Screen-space hit test for the home page's featured sleeves. Returns the pack index or -1. */
  hitTest(clientX: number, clientY: number): number {
    if (!this.featured.length || this.dive >= 0) return -1;
    const rect = this.renderer.domElement.getBoundingClientRect();
    const v = new THREE.Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(v, this.camera);
    const hit = this.raycaster.intersectObjects(this.featured.map((f) => f.mesh))[0];
    return hit ? (hit.object.userData.featured as number) : -1;
  }

  setHover(index: number) {
    this.hovered = index;
  }

  /** Pull a featured pack up toward the camera, then hand off (navigate). */
  pickPack(index: number, done: () => void) {
    if (this.picking) return;
    if (this.opts.reducedMotion) return done();
    this.picking = { index, start: performance.now(), done };
  }

  /** Home scroll: -1 for the shop view, 0..5 to dive to that tier's divider. */
  diveTo(depth: number) {
    if (depth === this.dive) return;
    this.dive = depth;
    this.resetPulled();
    this.cursorFrom = this.cursor;
    // Stop on the divider itself, standing, so its tier card faces the camera.
    this.cursorTo = depth < 0 ? 0 : this.sectionStart[depth];
    this.cursorStart = performance.now();
    this.cursorDur = this.opts.reducedMotion ? 0 : 900 + Math.abs(this.cursorTo - this.cursor) * 12;
  }

  private refreshTextures() {
    // Covers and dividers were drawn before web fonts loaded; redraw dividers with the real face.
    for (const s of this.slots) {
      if (!s.divider) continue;
      const mats = s.mesh.material as THREE.MeshStandardMaterial[];
      const tex = mats[4].map as THREE.CanvasTexture;
      tex.image = drawDivider(s.divider, this.fonts);
      tex.needsUpdate = true;
    }
    for (const f of this.featured) {
      const mats = f.mesh.material as THREE.MeshStandardMaterial[];
      const tex = mats[4].map as THREE.CanvasTexture;
      tex.image = drawPackCover(f.pack, this.fonts);
      tex.needsUpdate = true;
    }
  }

  // ————— Control —————

  setFlipSound(fn: (divider: boolean) => void) {
    this.onFlip = fn;
  }

  resize() {
    const canvas = this.renderer.domElement;
    const w = Math.max(1, canvas.clientWidth);
    const h = Math.max(1, canvas.clientHeight);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // Narrow screens pull the camera back so the crate's width fits.
    this.camera.fov = w / h < 0.8 ? 46 : 32;
    this.camera.updateProjectionMatrix();
    this.applyShift();
    this.composer?.setSize(w, h);
    this.composer?.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    if (this.featured.length) this.layoutFeatured();
  }

  /** Slide the crate within the frame: positive puts it lower, leaving room for UI above. */
  setFrame(shift: number, instant = false, shiftX = 0) {
    this.shiftTo = shift;
    this.shiftXTo = shiftX;
    if (instant || this.opts.reducedMotion) {
      this.shift = shift;
      this.shiftX = shiftX;
      this.applyShift();
    }
  }

  private applyShift() {
    const canvas = this.renderer.domElement;
    const w = Math.max(1, canvas.clientWidth);
    const h = Math.max(1, canvas.clientHeight);
    this.camera.setViewOffset(w, h, -w * this.shiftX, -h * this.shift, w, h);
  }

  /** Compile every shader up front, in parallel where the GPU driver allows, so the first frames don't stall. */
  async warmUp() {
    try {
      await this.renderer.compileAsync(this.scene, this.camera);
    } catch {
      // Older browsers: shaders compile on first render instead.
    }
    this.ready = true;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const loop = () => {
      if (!this.running) return;
      this.tick(performance.now());
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
    if (this.opts.demo) this.scheduleDemo();
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    window.clearTimeout(this.demoTimer);
  }

  dispose() {
    this.stop();
    this.renderer.dispose();
  }

  /** Flip to the answer's depth and pull it. A null tier flips the front rack and comes up empty. */
  dig(tier: TierId | null, answer: string, cb: { onLand?: () => void } = {}) {
    this.resetPulled();
    const r = Math.random;
    let target: number;
    if (tier) {
      const d = TIER_IDS.indexOf(tier);
      // Same spot in every section, so a rarer tier always means a longer dig.
      target = this.sectionStart[d] + 5 + Math.floor(r() * 2);
    } else {
      target = 3 + Math.floor(r() * 4);
    }
    const depth = tier ? TIER_IDS.indexOf(tier) : 0;
    this.cursorFrom = this.cursor;
    this.cursorTo = target;
    this.cursorStart = performance.now();
    // Total time stays close across tiers: a common find is a few slow, deliberate flips; a deep one blurs past.
    this.cursorDur = this.opts.reducedMotion ? 0 : 2000 + depth * 220;

    // Print the answer on the sleeve we'll pull.
    const slot = this.slots[target];
    const tex = new THREE.CanvasTexture(
      drawResultCover({ tier, answer, field: this.opts.field, on: this.opts.on, fonts: this.fonts }),
    );
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    this.resultTexture?.dispose();
    this.resultTexture = tex;
    const mats = slot.mesh.material as THREE.MeshStandardMaterial[];
    slot.mesh.userData.originalMap = mats[4].map;
    mats[4] = mats[4].clone();
    mats[4].map = tex;
    mats[4].needsUpdate = true;
    slot.mesh.material = mats;
    this.pull = { slot, start: 0, done: false, tier, onLand: cb.onLand };
  }

  /** Put the pulled record back and let the stack fall back to the front. */
  reset() {
    this.resetPulled();
    this.cursorFrom = this.cursor;
    this.cursorTo = 0;
    this.cursorStart = performance.now();
    this.cursorDur = this.opts.reducedMotion ? 0 : 650;
  }

  private resetPulled() {
    if (!this.pull) return;
    const { slot } = this.pull;
    const mats = slot.mesh.material as THREE.MeshStandardMaterial[];
    if (slot.mesh.userData.originalMap) mats[4].map = slot.mesh.userData.originalMap;
    slot.group.position.set(slot.group.position.x, 0.04, slot.z);
    slot.group.scale.setScalar(1);
    slot.group.rotation.set(slot.angle, 0, 0);
    this.pull = null;
    this.gold.intensity = 0;
    (this.dust.material as THREE.PointsMaterial).opacity = 0;
  }

  private scheduleDemo() {
    // Home page: keep browsing on its own, now and then pulling something from deep.
    const tiers: (TierId | null)[] = ["radio-edit", "album-track", "b-side", "staff-pick", "white-label", "holy-grail"];
    let k = 0;
    const next = () => {
      if (!this.running) return;
      const tier = tiers[k++ % tiers.length];
      this.dig(tier, "", {
        onLand: () => {
          this.demoTimer = window.setTimeout(() => {
            this.reset();
            this.demoTimer = window.setTimeout(next, 1600);
          }, 2400);
        },
      });
    };
    this.demoTimer = window.setTimeout(next, 900);
  }

  // ————— Frame —————

  private tick(now: number) {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;

    if (this.cursorDur > 0 || this.cursor !== this.cursorTo) {
      const t = this.cursorDur === 0 ? 1 : Math.min(1, (now - this.cursorStart) / this.cursorDur);
      this.cursor = this.cursorFrom + (this.cursorTo - this.cursorFrom) * ease.inOut(t);
      if (t >= 1) {
        this.cursor = this.cursorTo;
        this.cursorDur = 0;
        if (this.pull && !this.pull.start) this.pull.start = now + (this.opts.reducedMotion ? 0 : 220);
      }
    } else if (this.pull && !this.pull.start) {
      this.pull.start = now;
    }

    // Sleeves in front of the cursor are pushed forward; the rest lean back. Springs keep it physical.
    const c = this.cursor;
    for (let i = 0; i < this.slots.length; i++) {
      const s = this.slots[i];
      if (this.pull?.slot === s && this.pull.start && now >= this.pull.start) continue;
      const flipped = i < c - 0.001;
      const wave = this.opts.demo ? 0 : Math.sin(now / 900 + i * 0.4) * 0.006;
      s.target = (flipped ? FLIPPED - Math.min(0.25, (c - i) * 0.012) : REST - Math.min(0.06, (i - c) * 0.004)) + wave;
      if (flipped !== s.passed) {
        s.passed = flipped;
        if (flipped && !this.opts.reducedMotion) this.onFlip?.(!!s.divider);
      }
      const k = this.opts.reducedMotion ? 1 : 1;
      if (this.opts.reducedMotion) {
        s.angle = s.target;
        s.vel = 0;
      } else {
        // Critically damped-ish spring.
        const stiffness = 220 * k;
        const damping = 24;
        s.vel += (s.target - s.angle) * stiffness * dt - s.vel * damping * dt;
        s.angle += s.vel * dt;
      }
      s.group.rotation.x = s.angle;
    }

    // Pull the found sleeve up and turn it toward the digger.
    if (this.pull && this.pull.start && now >= this.pull.start) {
      const p = this.pull;
      const dur = this.opts.reducedMotion ? 1 : 900;
      const t = Math.min(1, (now - p.start) / dur);
      const e = ease.outBack(t);
      const s = p.slot;
      s.group.position.y = 0.04 + e * 0.95;
      s.group.position.z = s.z + e * 0.6;
      // Turn the sleeve square to the camera so it reads flat, not keystoned.
      const centerY = s.group.position.y + SLEEVE / 2;
      const face = -Math.atan2(this.camera.position.y - centerY, this.camera.position.z - s.group.position.z);
      s.group.rotation.x = s.angle + (face - s.angle) * ease.out(t);
      s.group.rotation.y = p.tier === "b-side" ? Math.PI * 2 * ease.inOut(Math.min(1, t * 1.15)) : (1 - ease.out(t)) * 0.4;
      s.group.scale.setScalar(1);
      if (p.tier === "holy-grail") {
        this.gold.position.set(0, s.group.position.y + 0.6, s.group.position.z + 0.7);
        this.gold.intensity = 6 * ease.out(t) + Math.sin(now / 300) * 0.6;
        const dm = this.dust.material as THREE.PointsMaterial;
        dm.opacity = 0.9 * ease.out(t);
        this.dust.position.set(0, 0.2, s.group.position.z);
        this.dust.rotation.y += dt * 0.2;
      }
      if (t >= 1 && !p.done) {
        p.done = true;
        p.onLand?.();
      }
    }

    // Camera stands over the cursor, leaning in as you dig deeper.
    const focusZ = this.pull?.start && now >= this.pull.start ? this.pull.slot.z + 0.3 : this.slotZ(this.cursor);
    const want = focusZ + 0.2;
    this.camZ += (want - this.camZ) * (this.opts.reducedMotion ? 1 : Math.min(1, dt * 4));
    // Standing over the crate: high enough to see into it, back far enough to see its walls.
    const pulled = !!(this.pull?.start && now >= this.pull.start);
    const idle = !pulled && this.cursorDur === 0 && this.cursor < 0.5;
    const k = this.opts.reducedMotion ? 1 : Math.min(1, dt * 3);
    const home = this.featured.length > 0 && this.dive < 0;
    const narrow = this.camera.aspect < 0.8;
    const want3 = home
      ? narrow
        ? [1.6, 5.9, 0.6, 0.0]
        : [1.5, 6.0, 0.62, 0.0]
      : pulled
        ? [2.75, 3.5, 1.0, 0.1]
        : idle
          ? [3.6, 4.6, 0.25, 1.0]
          : [3.1, 3.25, 0.35, 0.7];
    this.camPose = this.camPose.map((v, i) => v + (want3[i] - v) * k);
    const [cy, cz, ly, lz] = this.camPose;
    this.camera.position.set(0, cy, this.camZ + cz);
    this.camera.lookAt(0, ly, this.camZ - lz);
    this.key.position.set(0.5, 4.2, this.camZ + 2);
    this.key.target.position.set(0, 0.4, this.camZ - 0.4);

    if (Math.abs(this.shift - this.shiftTo) > 0.0005 || Math.abs(this.shiftX - this.shiftXTo) > 0.0005) {
      this.shift += (this.shiftTo - this.shift) * Math.min(1, dt * 5);
      this.shiftX += (this.shiftXTo - this.shiftX) * Math.min(1, dt * 5);
      this.applyShift();
    }

    this.animateFeatured(now, dt);

    // Ambient dust drifts up through the light and wraps.
    const ap = this.ambient.geometry.getAttribute("position") as THREE.BufferAttribute;
    if (!this.opts.reducedMotion) {
      for (let i = 0; i < ap.count; i++) {
        let y = ap.getY(i) + dt * 0.04;
        if (y > 3.2) y = 0;
        ap.setY(i, y);
        ap.setX(i, ap.getX(i) + Math.sin(now / 2400 + i) * dt * 0.01);
      }
      ap.needsUpdate = true;
    }
    this.ambient.position.z = this.camZ - 0.5;

    if (this.bokeh) {
      // Focus on whatever the digger is looking at.
      const home = this.featured.length > 0 && this.dive < 0;
      const picked = this.picking ? this.featured[this.picking.index].group.position.clone().add(new THREE.Vector3(0, SLEEVE / 2, 0)) : null;
      const target = picked
        ? picked
        : home
          ? new THREE.Vector3(0, 0.55, 0.7)
        : this.pull?.start && now >= this.pull.start
          ? this.pull.slot.group.position.clone().add(new THREE.Vector3(0, SLEEVE / 2, 0))
          : new THREE.Vector3(0, 0.6, this.camZ - 0.2);
      (this.bokeh.uniforms as unknown as { focus: { value: number } }).focus.value = this.camera.position.distanceTo(target);
    }
    if (this.composer) this.composer.render(dt);
    else this.renderer.render(this.scene, this.camera);
  }

  private animateFeatured(now: number, dt: number) {
    if (!this.featured.length) return;
    const showing = this.dive < 0;
    this.featured.forEach((f, i) => {
      const hover = showing && this.hovered === i ? 1 : 0;
      f.lift += (hover - f.lift) * Math.min(1, dt * 10);
      let pos = f.home.clone();
      let rx = f.homeRot.x;
      let ry = f.homeRot.y;
      const rz = f.homeRot.z;
      // Hover lifts the sleeve a hand's width and turns it to you.
      pos.y += f.lift * 0.16;
      pos.z += f.lift * 0.12;
      ry *= 1 - f.lift * 0.6;
      // Out of the way when the camera dives into the crate.
      if (!showing) pos = pos.add(new THREE.Vector3(0, -1.6, 1.2));
      const picked = this.picking?.index === i;
      if (picked && this.picking) {
        const t = Math.min(1, (now - this.picking.start) / 900);
        const e = ease.inOut(t);
        const cam = this.camera.position;
        pos.lerp(new THREE.Vector3(cam.x, cam.y - 0.55, cam.z - 1.15), e);
        rx += (-0.32 - rx) * e;
        ry *= 1 - e;
        if (t >= 1) {
          const done = this.picking.done;
          this.picking = null;
          done();
        }
      }
      const sway = this.opts.reducedMotion ? 0 : Math.sin(now / 1400 + i * 1.7) * 0.012;
      f.group.position.lerp(pos, this.opts.reducedMotion ? 1 : Math.min(1, dt * (picked ? 30 : 6)));
      f.group.rotation.set(rx + sway, ry, rz);
    });
  }

  private slotZ(cursor: number) {
    const i = Math.max(0, Math.min(this.slots.length - 1, Math.round(cursor)));
    return this.slots[i].z;
  }
}

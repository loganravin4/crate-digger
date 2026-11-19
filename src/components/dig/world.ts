import { TIER_IDS, TIERS, type TierId } from "@/lib/tiers";

/**
 * The dig: a cross-section of a record shop, six layers deep. The player's answer is
 * a record that drops through the layers and lands at its tier's depth. Everything is
 * crisp vector geometry drawn from a seed, so each pack's shop is stable day to day.
 */

type Palette = { field: string; on: string };

const INK = "#16130f";
const PAPER = "#f3ecdd";
const SPINES = ["#e4ae1f", "#bf3a22", "#2b57a6", "#1f7a72", "#d9772b", "#f3ecdd", "#7a3f6b", "#6b6a2a", "#d77a8a", "#0d0b08", "#4f8fbf"];
const WOOD = "#5a3d24";
const WOOD_DARK = "#3a2716";
const GOLD = "#f2c14e";

const LAYER_TONE: Record<TierId, { wall: string; light: number }> = {
  "radio-edit": { wall: "#2a231b", light: 1 },
  "staff-pick": { wall: "#262019", light: 0.92 },
  "album-track": { wall: "#211c16", light: 0.8 },
  "b-side": { wall: "#1b1713", light: 0.66 },
  "white-label": { wall: "#141210", light: 0.5 },
  "holy-grail": { wall: "#0b0a08", light: 0.3 },
};

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shade(hex: string, k: number): string {
  // Multiply a color toward the ink by (1 - k); k = 1 keeps it.
  const n = parseInt(hex.slice(1), 16);
  const ir = 0x16, ig = 0x13, ib = 0x0f;
  const r = Math.round(ir + (((n >> 16) & 255) - ir) * k);
  const g = Math.round(ig + (((n >> 8) & 255) - ig) * k);
  const b = Math.round(ib + ((n & 255) - ib) * k);
  return `rgb(${r},${g},${b})`;
}

const ease = {
  outExpo: (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inOutCubic: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outBack: (t: number) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2),
};

type Particle = { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; color: string };

type Drop = {
  tier: TierId | null;
  start: number;
  duration: number;
  fromY: number;
  toY: number;
  x: number;
  landedAt: number | null;
  passed: number;
  onLayer?: (depth: number) => void;
  onLand?: () => void;
};

export type WorldOptions = {
  seed: number;
  palette: Palette;
  reducedMotion: boolean;
  /** Height of the shop floor above the first layer, as a share of the viewport. */
  floor?: number;
  /** Draw the tier name and points on each layer. */
  labels?: boolean;
};

export class DigWorld {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private opts: Required<WorldOptions>;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private layerH = 300;
  private floorH = 400;
  private layers: HTMLCanvasElement[] = [];
  private cam = 0;
  private camFrom = 0;
  private camTo = 0;
  private camStart = 0;
  private camDur = 0;
  private drop: Drop | null = null;
  private particles: Particle[] = [];
  private raf = 0;
  private running = false;
  private shake = 0;
  private t0 = performance.now();
  private display = "sans-serif";
  private text = "system-ui, sans-serif";

  constructor(canvas: HTMLCanvasElement, opts: WorldOptions) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.opts = { ...opts, floor: opts.floor ?? 0.62, labels: opts.labels ?? true };
    const css = getComputedStyle(document.documentElement);
    this.display = css.getPropertyValue("--font-archivo").trim() || this.display;
    this.text = css.getPropertyValue("--font-franklin").trim() || this.text;
    // Layers are drawn once; redraw when the web fonts arrive.
    void document.fonts?.ready.then(() => {
      if (this.w > 1) {
        this.buildLayers();
        this.render();
      }
    });
  }

  /** World y of the top of a layer. */
  layerTop(depth: number) {
    return this.floorH + depth * this.layerH;
  }

  private restY(depth: number) {
    // The holy grail comes to rest standing on the vault's plinth.
    if (depth === TIER_IDS.length - 1) return this.layerTop(depth) + this.layerH - 70 - this.recordRadius() * 0.72;
    return this.layerTop(depth) + this.layerH * 0.5;
  }

  /** Shop depth plus room below the vault, so the camera can frame the deepest landing above the result card. */
  get worldHeight() {
    return this.floorH + TIER_IDS.length * this.layerH + Math.round(this.h * 0.45);
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = Math.max(1, rect.width);
    this.h = Math.max(1, rect.height);
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    this.floorH = this.floorPx ?? Math.round(this.h * this.opts.floor);
    this.layerH = Math.round(Math.min(420, Math.max(240, this.h * 0.46)));
    this.buildLayers();
    this.render();
  }

  setPalette(p: Palette) {
    this.opts.palette = p;
    this.buildLayers();
  }

  start() {
    if (this.running) return;
    this.running = true;
    const loop = () => {
      if (!this.running) return;
      this.step(performance.now());
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  /** Move the camera so world y sits at the top of the viewport. */
  panTo(y: number, ms = 900) {
    const max = Math.max(0, this.worldHeight - this.h);
    const target = Math.max(0, Math.min(max, y));
    if (this.opts.reducedMotion || ms <= 0) {
      this.cam = this.camTo = target;
      this.camDur = 0;
      return;
    }
    this.camFrom = this.cam;
    this.camTo = target;
    this.camStart = performance.now();
    this.camDur = ms;
  }

  /** Back to the shop floor for the next prompt. */
  rise() {
    this.drop = null;
    this.panTo(0, 1100);
  }

  /** Drop a record to a tier's depth. A null tier (miss or pass) lands on the shop floor. */
  dropRecord(tier: TierId | null, cb: { onLayer?: (d: number) => void; onLand?: () => void } = {}) {
    const depth = tier ? TIER_IDS.indexOf(tier) : -1;
    const fromY = this.floorH * 0.55;
    const toY = depth >= 0 ? this.restY(depth) : this.floorH - 40;
    const duration = this.opts.reducedMotion ? 0 : depth < 0 ? 700 : 1300 + depth * 520;
    this.drop = {
      tier,
      start: performance.now(),
      duration,
      fromY,
      toY,
      x: this.w / 2,
      landedAt: null,
      passed: -1,
      onLayer: cb.onLayer,
      onLand: cb.onLand,
    };
    if (this.opts.reducedMotion) {
      this.panTo(toY - this.h * 0.3, 0);
    }
  }

  private recordRadius() {
    return Math.round(Math.min(78, Math.max(46, this.w * 0.12)));
  }

  private step(now: number) {
    if (this.camDur > 0) {
      const t = Math.min(1, (now - this.camStart) / this.camDur);
      this.cam = this.camFrom + (this.camTo - this.camFrom) * ease.inOutCubic(t);
      if (t >= 1) this.camDur = 0;
    }
    const d = this.drop;
    if (d && d.landedAt === null) {
      const t = d.duration === 0 ? 1 : Math.min(1, (now - d.start) / d.duration);
      const y = d.fromY + (d.toY - d.fromY) * (d.tier ? ease.inOutCubic(t) : ease.outExpo(t));
      // Camera rides with the record.
      if (!this.opts.reducedMotion) {
        const max = Math.max(0, this.worldHeight - this.h);
        this.cam = Math.max(0, Math.min(max, y - this.h * 0.3));
      }
      for (let k = d.passed + 1; k < TIER_IDS.length; k++) {
        if (y >= this.layerTop(k) && d.tier && k <= TIER_IDS.indexOf(d.tier)) {
          d.passed = k;
          if (k > 0) d.onLayer?.(k);
          this.dust(d.x, this.layerTop(k), 8, shade(PAPER, 0.4));
        }
      }
      if (t >= 1) {
        d.landedAt = now;
        this.landEffect(d);
        d.onLand?.();
      }
    }
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.02;
      p.vx *= 0.99;
      p.life++;
    }
    this.particles = this.particles.filter((p) => p.life < p.max);
    this.shake *= 0.88;
    this.render(now);
  }

  private dust(x: number, y: number, n: number, color: string) {
    if (this.opts.reducedMotion) return;
    const r = rng(Math.floor(x * 31 + y));
    for (let i = 0; i < n; i++) {
      this.particles.push({
        x: x + (r() - 0.5) * 80,
        y: y + (r() - 0.5) * 10,
        vx: (r() - 0.5) * 1.6,
        vy: -r() * 1.4,
        life: 0,
        max: 40 + r() * 40,
        size: 1 + r() * 2.2,
        color,
      });
    }
  }

  private landEffect(d: Drop) {
    if (this.opts.reducedMotion) return;
    const tier = d.tier;
    if (!tier) return;
    const depth = TIER_IDS.indexOf(tier);
    this.dust(d.x, d.toY + this.recordRadius(), 14 + depth * 4, shade(PAPER, 0.5));
    if (depth >= 3) this.shake = 4 + depth;
    if (tier === "holy-grail") {
      const r = rng(7);
      for (let i = 0; i < 70; i++) {
        this.particles.push({
          x: d.x + (r() - 0.5) * 220,
          y: d.toY + this.recordRadius() * 0.6 + r() * 40,
          vx: (r() - 0.5) * 0.6,
          vy: -0.4 - r() * 1.6,
          life: 0,
          max: 90 + r() * 90,
          size: 1 + r() * 2.6,
          color: GOLD,
        });
      }
    }
  }

  // ————— Static layers (drawn once per size and palette) —————

  private posters: HTMLCanvasElement | null = null;
  floorPx: number | null = null;

  private buildLayers() {
    this.layers = TIER_IDS.map((tier, depth) => this.drawLayer(tier, depth));
    this.posters = this.drawPosters();
  }

  /** Wide screens: framed sleeves pinned to the shop wall either side of the counter. */
  private drawPosters(): HTMLCanvasElement | null {
    const W = this.w;
    const H = this.floorH;
    if (W < 900 || H < 200) return null;
    const c = document.createElement("canvas");
    c.width = Math.round(W * this.dpr);
    c.height = Math.round(H * this.dpr);
    const g = c.getContext("2d")!;
    g.scale(this.dpr, this.dpr);
    const r = rng(this.opts.seed * 7 + 3);
    const side = (W - 640) / 2;
    const size = Math.min(150, side * 0.42);
    const spots = [
      [side * 0.22, H * 0.16],
      [side * 0.56, H * 0.36],
      [side * 0.18, H * 0.56],
      [W - side * 0.22 - size, H * 0.2],
      [W - side * 0.58 - size, H * 0.48],
    ];
    for (const [px, py] of spots) {
      const col = SPINES[Math.floor(r() * 9)];
      g.globalAlpha = 0.5;
      g.fillStyle = shade(col, 0.55);
      g.fillRect(px, py, size, size);
      g.fillStyle = shade(r() < 0.5 ? INK : PAPER, 0.5);
      const kind = r();
      if (kind < 0.4) {
        g.beginPath();
        g.arc(px + size * (0.3 + r() * 0.4), py + size * (0.3 + r() * 0.4), size * (0.16 + r() * 0.14), 0, Math.PI * 2);
        g.fill();
      } else if (kind < 0.7) {
        for (let k = 0; k < 3; k++) g.fillRect(px + size * 0.12, py + size * (0.2 + k * 0.22), size * (0.4 + r() * 0.4), size * 0.1);
      } else {
        g.fillRect(px + size * 0.5, py, size * 0.5, size);
      }
      // Pin.
      g.globalAlpha = 0.7;
      g.fillStyle = shade(PAPER, 0.6);
      g.fillRect(px + size / 2 - 2, py + 4, 4, 4);
    }
    g.globalAlpha = 1;
    return c;
  }

  /** Set the shop floor height in CSS pixels so the first layer starts below the counter UI. */
  setFloor(px: number) {
    const next = Math.round(Math.max(this.h * 0.5, Math.min(this.h * 0.8, px)));
    if (Math.abs(next - this.floorH) < 2) return;
    this.floorH = next;
    this.floorPx = next;
    this.posters = this.drawPosters();
    this.render();
  }

  private drawLayer(tier: TierId, depth: number): HTMLCanvasElement {
    const c = document.createElement("canvas");
    c.width = Math.round(this.w * this.dpr);
    c.height = Math.round(this.layerH * this.dpr);
    const g = c.getContext("2d")!;
    g.scale(this.dpr, this.dpr);
    const W = this.w;
    const H = this.layerH;
    const tone = LAYER_TONE[tier];
    const r = rng(this.opts.seed * 97 + depth * 1013);

    g.fillStyle = tone.wall;
    g.fillRect(0, 0, W, H);
    // A ceiling lamp's warm pool. This is light falloff, not decoration.
    const lamp = g.createRadialGradient(W / 2, 0, 10, W / 2, H * 0.2, Math.max(W, H) * 0.7);
    lamp.addColorStop(0, `rgba(255,214,150,${0.16 * tone.light})`);
    lamp.addColorStop(1, "rgba(255,214,150,0)");
    g.fillStyle = lamp;
    g.fillRect(0, 0, W, H);
    // Before layout the canvas can be a pixel wide; draw only the wall.
    if (W < 120) return c;

    // Floor slab between layers.
    g.fillStyle = shade(WOOD_DARK, tone.light);
    g.fillRect(0, H - 14, W, 14);
    g.fillStyle = shade(WOOD, tone.light);
    g.fillRect(0, H - 14, W, 3);

    if (tier === "holy-grail") {
      this.drawVault(g, W, H);
    } else if (tier === "staff-pick") {
      this.drawShelf(g, W, H, r, tone.light);
    } else {
      const crates = W < 520 ? 2 : W < 1000 ? 3 : 4;
      const gap = 18;
      const cw = Math.min(260, (W - gap * (crates + 1)) / crates);
      const total = crates * cw + (crates - 1) * gap;
      let x = (W - total) / 2;
      for (let i = 0; i < crates; i++) {
        // Leave a gap in the middle crate row so the falling record has somewhere to land.
        const ch = H * (tier === "radio-edit" ? 0.5 : 0.44);
        this.drawCrate(g, x, H - 14 - ch, cw, ch, r, tone.light, tier);
        x += cw + gap;
      }
      if (tier === "white-label") this.drawPipes(g, W, r);
      if (tier === "radio-edit") this.drawRackSign(g, W);
    }

    if (this.opts.labels) {
      const info = TIERS[tier];
      g.font = `600 11px ${this.text}`;
      g.fillStyle = shade(PAPER, 0.55 + tone.light * 0.3);
      g.textBaseline = "top";
      g.fillText(`${info.stratum.toUpperCase()}`, 16, 18);
      g.font = `800 ${Math.round(Math.min(28, W * 0.06))}px ${this.display}`;
      g.fillStyle = tier === "holy-grail" ? GOLD : shade(PAPER, 0.6 + tone.light * 0.35);
      g.fillText(`${info.label.toUpperCase()}`, 16, 34);
      g.font = `900 ${Math.round(Math.min(40, W * 0.09))}px ${this.display}`;
      g.textAlign = "right";
      g.fillText(`${info.points}`, W - 16, 22);
      g.textAlign = "left";
    }
    return c;
  }

  private drawCrate(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: () => number, light: number, tier: TierId) {
    // Records standing in the crate, seen from the front: sleeve tops of varied height and lean.
    // Sleeves stand at nearly even height, a few pulled up by a browsing hand. Each has a
    // lit top edge so the row reads as card stock, not bars.
    const sleeves = Math.floor(w / 8);
    const sw = (w - 12) / sleeves;
    for (let i = 0; i < sleeves; i++) {
      const sx = x + 6 + i * sw;
      const pulled = r() < 0.07;
      const sh = h * (pulled ? 1.22 + r() * 0.12 : 0.98 + r() * 0.06);
      const lean = (r() - 0.5) * 3;
      let col = SPINES[Math.floor(r() * SPINES.length)];
      if (tier === "white-label" && r() < 0.6) col = "#e9e4d8";
      g.fillStyle = shade(col, light * (0.72 + r() * 0.28));
      g.beginPath();
      g.moveTo(sx, y + h);
      g.lineTo(sx + lean, y + h - sh);
      g.lineTo(sx + lean + sw - 1.2, y + h - sh);
      g.lineTo(sx + sw - 1.2, y + h);
      g.closePath();
      g.fill();
      g.fillStyle = `rgba(243,236,221,${0.16 * light})`;
      g.fillRect(sx + lean, y + h - sh, sw - 1.2, 1.5);
    }
    // One sleeve pulled forward, cover out: the hard-bop circle-on-field motif.
    if (r() < 0.75) {
      const s = Math.min(h * 0.9, w * 0.42);
      const px = x + w * (0.15 + r() * 0.45);
      const py = y + h - s * 0.55;
      const col = SPINES[Math.floor(r() * 5)];
      g.fillStyle = shade(col, light);
      g.fillRect(px, py - s * 0.45, s, s);
      g.fillStyle = shade(r() < 0.5 ? INK : PAPER, light);
      g.beginPath();
      g.arc(px + s * (0.3 + r() * 0.4), py - s * 0.45 + s * (0.3 + r() * 0.4), Math.max(1, s * (0.18 + r() * 0.16)), 0, Math.PI * 2);
      g.fill();
    }
    // Crate front.
    const front = h * 0.52;
    g.fillStyle = shade(WOOD, light);
    g.fillRect(x, y + h - front, w, front);
    g.fillStyle = shade(WOOD_DARK, light);
    g.fillRect(x, y + h - front, w, 4);
    g.fillRect(x, y + h - front * 0.5, w, 2);
    // Hand hole.
    g.fillStyle = shade(INK, 1);
    const hw = Math.min(56, w * 0.28);
    g.beginPath();
    g.roundRect(x + (w - hw) / 2, y + h - front + 12, hw, 12, 6);
    g.fill();
  }

  private drawShelf(g: CanvasRenderingContext2D, W: number, H: number, r: () => number, light: number) {
    const shelfY = H * 0.62;
    g.fillStyle = shade(WOOD, light);
    g.fillRect(0, shelfY, W, 10);
    g.fillStyle = shade(WOOD_DARK, light);
    g.fillRect(0, shelfY + 10, W, 4);
    // Faced-out sleeves on the shelf, each with a staff card clipped to it.
    const n = W < 520 ? 4 : W < 1000 ? 6 : 8;
    const s = Math.min(110, (W - 40) / n - 16);
    for (let i = 0; i < n; i++) {
      const x = 20 + i * ((W - 40) / n) + 8;
      const col = SPINES[Math.floor(r() * SPINES.length)];
      g.save();
      g.translate(x + s / 2, shelfY);
      g.rotate((r() - 0.5) * 0.06);
      g.fillStyle = shade(col, light);
      g.fillRect(-s / 2, -s, s, s);
      g.fillStyle = shade(r() < 0.5 ? INK : PAPER, light);
      g.fillRect(-s / 2 + s * 0.12, -s + s * (0.15 + r() * 0.4), s * 0.76, s * 0.12);
      // Card.
      g.rotate((r() - 0.5) * 0.25);
      g.fillStyle = shade(PAPER, light);
      g.fillRect(-s * 0.3, -s * 0.38, s * 0.6, s * 0.42);
      g.fillStyle = shade("#7a6f5e", light);
      for (let l = 0; l < 3; l++) g.fillRect(-s * 0.24, -s * 0.3 + l * s * 0.1, s * (0.3 + r() * 0.18), 2);
      g.restore();
    }
  }

  private drawPipes(g: CanvasRenderingContext2D, W: number, r: () => number) {
    g.fillStyle = "#2c2721";
    g.fillRect(0, 54, W, 10);
    g.fillRect(0, 74, W * 0.7, 6);
    g.fillStyle = "#3a332b";
    for (let x = 30; x < W; x += 120 + r() * 80) g.fillRect(x, 50, 10, 18);
  }

  private drawRackSign(g: CanvasRenderingContext2D, W: number) {
    // The pack's field color as the shop's front-rack header board.
    const bw = Math.min(260, W * 0.5);
    g.fillStyle = this.opts.palette.field;
    g.fillRect(W - bw - 16, 70, bw, 34);
    g.fillStyle = this.opts.palette.on;
    g.font = `800 13px ${this.display}`;
    g.textBaseline = "middle";
    g.fillText("NEW & NOTABLE", W - bw - 4, 88);
  }

  private drawVault(g: CanvasRenderingContext2D, W: number, H: number) {
    // A single spotlight from above onto a plinth. The cone is the light's own falloff.
    const cx = W / 2;
    const cone = g.createLinearGradient(0, 0, 0, H);
    cone.addColorStop(0, "rgba(242,193,78,0.22)");
    cone.addColorStop(1, "rgba(242,193,78,0.02)");
    g.fillStyle = cone;
    g.beginPath();
    g.moveTo(cx - 24, 0);
    g.lineTo(cx + 24, 0);
    g.lineTo(cx + Math.min(220, W * 0.32), H - 14);
    g.lineTo(cx - Math.min(220, W * 0.32), H - 14);
    g.closePath();
    g.fill();
    g.fillStyle = "#221d16";
    g.fillRect(cx - 70, H - 64, 140, 50);
    g.fillStyle = "#2f281f";
    g.fillRect(cx - 78, H - 70, 156, 8);
    // Vault door bolts at the edges.
    g.strokeStyle = "#2a251e";
    g.lineWidth = 6;
    g.beginPath();
    g.arc(-40, H / 2, H * 0.42, -0.6, 0.6);
    g.stroke();
    g.beginPath();
    g.arc(W + 40, H / 2, H * 0.42, Math.PI - 0.6, Math.PI + 0.6);
    g.stroke();
  }

  // ————— Frame —————

  render(now = performance.now()) {
    const g = this.ctx;
    const { w, h, dpr } = this;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const sx = this.shake > 0.3 ? (Math.random() - 0.5) * this.shake : 0;
    const sy = this.shake > 0.3 ? (Math.random() - 0.5) * this.shake : 0;
    g.fillStyle = INK;
    g.fillRect(0, 0, w, h);
    g.save();
    g.translate(sx, -this.cam + sy);

    // Shop floor: wall, and a counter line where the sleeve sits.
    if (this.cam < this.floorH) {
      g.fillStyle = INK;
      g.fillRect(0, 0, w, this.floorH);
      if (this.posters) g.drawImage(this.posters, 0, 0, w, this.floorH);
      g.fillStyle = "#1e1a15";
      g.fillRect(0, this.floorH - 30, w, 16);
      g.fillStyle = shade(WOOD, 0.9);
      g.fillRect(0, this.floorH - 14, w, 14);
    }

    for (let i = 0; i < this.layers.length; i++) {
      const top = this.layerTop(i);
      if (top > this.cam + h || top + this.layerH < this.cam) continue;
      g.drawImage(this.layers[i], 0, top, w, this.layerH);
    }

    // Vault light breathes.
    const vaultTop = this.layerTop(TIER_IDS.length - 1);
    if (vaultTop < this.cam + h) {
      const k = 0.5 + 0.5 * Math.sin((now - this.t0) / 900);
      g.fillStyle = `rgba(242,193,78,${0.03 + k * 0.03})`;
      g.fillRect(0, vaultTop, w, this.layerH - 14);
    }

    for (const p of this.particles) {
      g.globalAlpha = Math.max(0, 1 - p.life / p.max);
      g.fillStyle = p.color;
      g.fillRect(p.x, p.y, p.size, p.size);
    }
    g.globalAlpha = 1;

    if (this.drop) this.drawRecord(now);
    g.restore();
  }

  private drawRecord(now: number) {
    const d = this.drop!;
    const g = this.ctx;
    const R = this.recordRadius();
    let y = d.toY;
    let spin = 0;
    let flip = 1;
    if (d.landedAt === null) {
      const t = d.duration === 0 ? 1 : Math.min(1, (now - d.start) / d.duration);
      y = d.fromY + (d.toY - d.fromY) * (d.tier ? ease.inOutCubic(t) : ease.outExpo(t));
      spin = t * Math.PI * 6;
    } else {
      const since = now - d.landedAt;
      if (d.tier === "radio-edit") y = d.toY - Math.max(0, Math.sin(Math.min(1, since / 320) * Math.PI) * 18);
      if (d.tier === "b-side") flip = Math.cos(Math.min(1, since / 700) * Math.PI * 2);
      spin = d.tier === "holy-grail" ? since / 600 : 0;
    }
    const x = d.x;
    const landed = d.landedAt !== null;
    const tier = d.tier;
    const labelColor = !landed || !tier ? this.opts.palette.field : tier === "holy-grail" ? GOLD : tier === "white-label" ? "#fbf8f1" : this.opts.palette.field;

    // Landing ring for the deep tiers.
    if (landed && tier && TIER_IDS.indexOf(tier) >= 2 && !this.opts.reducedMotion) {
      const since = now - d.landedAt!;
      const k = Math.min(1, since / 900);
      g.strokeStyle = tier === "holy-grail" ? `rgba(242,193,78,${1 - k})` : `rgba(243,236,221,${0.6 * (1 - k)})`;
      g.lineWidth = 2;
      g.beginPath();
      g.arc(x, y, R + 10 + k * R * 1.4, 0, Math.PI * 2);
      g.stroke();
    }

    // Staff pick: a clerk's card pops up beside the record.
    if (landed && tier === "staff-pick") {
      const k = this.opts.reducedMotion ? 1 : ease.outBack(Math.min(1, (now - d.landedAt!) / 420));
      const cw = R * 1.5;
      const ch = R * 0.95;
      g.save();
      g.translate(x + R + 14 + cw / 2, y - R * 0.2);
      g.rotate(-0.08);
      g.scale(k, k);
      g.fillStyle = PAPER;
      g.fillRect(-cw / 2, -ch / 2, cw, ch);
      g.fillStyle = "#e08fa0";
      g.fillRect(-cw / 2, -ch / 2, cw, 6);
      g.fillStyle = INK;
      g.font = `800 ${Math.round(R * 0.2)}px ${this.display}`;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText("STAFF PICK", 0, -ch * 0.12);
      g.font = `600 ${Math.round(R * 0.13)}px ${this.text}`;
      g.fillStyle = "#5b5245";
      g.fillText("everyone's secret fave", 0, ch * 0.2);
      g.restore();
    }

    g.save();
    g.translate(x, y);
    g.scale(flip === 1 ? 1 : Math.max(0.04, Math.abs(flip)), 1);
    g.rotate(spin);
    // Vinyl with grooves.
    g.fillStyle = "#0c0a07";
    g.beginPath();
    g.arc(0, 0, R, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = "rgba(243,236,221,0.07)";
    g.lineWidth = 1;
    for (let rr = R - 4; rr > R * 0.4; rr -= 3) {
      g.beginPath();
      g.arc(0, 0, rr, 0, Math.PI * 2);
      g.stroke();
    }
    // Sheen: a pale wedge that reads as light on the grooves as it spins.
    g.fillStyle = "rgba(243,236,221,0.06)";
    g.beginPath();
    g.moveTo(0, 0);
    g.arc(0, 0, R, -0.35, 0.35);
    g.closePath();
    g.fill();
    g.fillStyle = labelColor;
    g.beginPath();
    g.arc(0, 0, R * 0.36, 0, Math.PI * 2);
    g.fill();
    if (landed && tier) {
      g.fillStyle = tier === "holy-grail" || tier === "white-label" ? INK : this.opts.palette.on;
      g.font = `900 ${Math.round(R * 0.26)}px ${this.display}`;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(tier === "b-side" && flip < 0 ? "B" : `${TIERS[tier].points}`, 0, 1);
    }
    g.fillStyle = INK;
    g.beginPath();
    g.arc(0, 0, 2.5, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }
}

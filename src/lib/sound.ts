import type { TierId } from "./tiers";

/**
 * Synthesized shop sounds, Web Audio only, no files: needle drop, record scratch,
 * a click per layer passed, and a landing sting per tier. Silent until the first
 * user gesture unlocks the context.
 */
class Sound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private crackle: AudioBufferSourceNode | null = null;
  enabled = true;

  private ensure(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    if (!on) this.stopCrackle();
  }

  private noise(ctx: AudioContext, seconds: number): AudioBuffer {
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  private tone(freq: number, at: number, dur: number, type: OscillatorType, gain: number, endFreq?: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, at);
    if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, at + dur);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(gain, at + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g).connect(this.master!);
    o.start(at);
    o.stop(at + dur + 0.05);
  }

  private burst(at: number, dur: number, filter: BiquadFilterType, from: number, to: number, gain: number) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise(ctx, dur + 0.05);
    const f = ctx.createBiquadFilter();
    f.type = filter;
    f.Q.value = filter === "bandpass" ? 6 : 0.7;
    f.frequency.setValueAtTime(from, at);
    f.frequency.exponentialRampToValueAtTime(to, at + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    src.connect(f).connect(g).connect(this.master!);
    src.start(at);
  }

  private go(fn: (t: number) => void) {
    if (!this.enabled) return;
    const ctx = this.ensure();
    if (!ctx) return;
    fn(ctx.currentTime + 0.01);
  }

  /** Quiet surface noise with sparse pops, while a round is live. */
  startCrackle() {
    if (!this.enabled || this.crackle) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const seconds = 4;
    const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      const hiss = (Math.random() * 2 - 1) * 0.012;
      const pop = Math.random() < 0.0004 ? (Math.random() * 2 - 1) * 0.5 : 0;
      d[i] = hiss + pop;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = 1200;
    const g = ctx.createGain();
    g.gain.value = 0.35;
    src.connect(f).connect(g).connect(this.master!);
    src.start();
    this.crackle = src;
  }

  stopCrackle() {
    try {
      this.crackle?.stop();
    } catch {
      // already stopped
    }
    this.crackle = null;
  }

  needleDrop() {
    this.go((t) => {
      this.tone(95, t, 0.32, "sine", 0.5, 48);
      this.burst(t, 0.12, "lowpass", 2400, 300, 0.35);
    });
  }

  /** Wrong answer: a quick back-and-forth scratch. */
  scratch() {
    this.go((t) => {
      this.burst(t, 0.11, "bandpass", 700, 2600, 0.5);
      this.burst(t + 0.11, 0.14, "bandpass", 2400, 500, 0.45);
    });
  }

  confirm() {
    this.go((t) => this.tone(880, t, 0.12, "triangle", 0.18));
  }

  tick(urgent = false) {
    this.go((t) => this.tone(urgent ? 1400 : 1000, t, 0.05, "square", urgent ? 0.07 : 0.04));
  }

  private lastFlip = 0;

  /** A sleeve flipped forward under the digger's fingers. Dividers knock a little heavier. */
  flip(divider = false) {
    const t0 = performance.now();
    // At full speed sleeves pass faster than the ear wants; thin the stream.
    if (!divider && t0 - this.lastFlip < 38) return;
    this.lastFlip = t0;
    this.go((t) => {
      this.burst(t, divider ? 0.07 : 0.04, "bandpass", divider ? 900 : 2200 + Math.random() * 900, divider ? 500 : 1400, divider ? 0.32 : 0.16);
      if (divider) this.tone(240, t, 0.08, "triangle", 0.1, 180);
    });
  }

  /** The record passes a layer of the shop. */
  layer(depth: number) {
    this.go((t) => this.tone(620 - depth * 70, t, 0.06, "triangle", 0.12));
  }

  land(tier: TierId | null) {
    this.go((t) => {
      if (!tier) {
        this.tone(160, t, 0.4, "sine", 0.35, 70);
        return;
      }
      this.tone(80, t, 0.5, "sine", 0.55, 44);
      this.burst(t, 0.35, "lowpass", 900, 120, 0.25);
      const chords: Record<TierId, number[]> = {
        "radio-edit": [392],
        "staff-pick": [523, 415],
        "album-track": [392, 494, 587],
        "b-side": [330, 415, 494, 659],
        "white-label": [440, 554, 659, 880],
        "holy-grail": [523, 659, 784, 988, 1175, 1568],
      };
      chords[tier].forEach((f, i) => this.tone(f, t + 0.14 + i * 0.11, tier === "holy-grail" ? 1.4 : 0.7, "triangle", 0.13));
      if (tier === "holy-grail") this.tone(55, t + 0.1, 1.6, "sine", 0.4, 40);
    });
  }
}

export const sound = new Sound();

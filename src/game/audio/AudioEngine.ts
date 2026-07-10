/**
 * Original procedural chiptune-style audio for MOTH//LAMP.
 * Uses Web Audio API only — no external samples required.
 * Audio starts only after user gesture (resume()).
 */

export type MusicTrack = 'title' | 'level' | 'boss' | 'victory' | 'gameover' | 'none';

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicTimer: number | null = null;
  private musicStep = 0;
  private track: MusicTrack = 'none';
  private unlocked = false;
  private musicVolume = 0.55;
  private sfxVolume = 0.7;
  private muted = false;

  private ensure(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain.connect(this.master);
      this.sfxGain.connect(this.master);
      this.master.connect(this.ctx.destination);
      this.applyVolumes();
    }
    return this.ctx;
  }

  async unlock(): Promise<void> {
    const ctx = this.ensure();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {
        // user gesture required later
      }
    }
    this.unlocked = ctx.state === 'running';
  }

  setMusicVolume(v: number): void {
    this.musicVolume = Math.max(0, Math.min(1, v));
    this.applyVolumes();
  }

  setSfxVolume(v: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, v));
    this.applyVolumes();
  }

  private applyVolumes(): void {
    if (!this.musicGain || !this.sfxGain || !this.master) return;
    const m = this.muted ? 0 : 1;
    this.musicGain.gain.value = this.musicVolume * 0.35 * m;
    this.sfxGain.gain.value = this.sfxVolume * m;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.applyVolumes();
  }

  playMusic(track: MusicTrack): void {
    if (this.track === track) return;
    this.stopMusic();
    this.track = track;
    if (track === 'none') return;
    void this.unlock().then(() => this.startMusicLoop());
  }

  stopMusic(): void {
    if (this.musicTimer != null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    this.track = 'none';
    this.musicStep = 0;
  }

  private startMusicLoop(): void {
    const ctx = this.ensure();
    if (!ctx || !this.unlocked) return;

    const bpm =
      this.track === 'boss' ? 148 : this.track === 'title' ? 100 : this.track === 'level' ? 128 : 90;
    const stepMs = (60_000 / bpm) / 2;

    this.musicTimer = window.setInterval(() => {
      if (!this.unlocked || this.muted || this.musicVolume <= 0.01) {
        this.musicStep++;
        return;
      }
      this.tickMusic();
      this.musicStep++;
    }, stepMs);
  }

  private tickMusic(): void {
    const ctx = this.ensure();
    if (!ctx || !this.musicGain) return;
    const t = ctx.currentTime;
    const step = this.musicStep;

    // Original arpeggios — not based on any commercial game theme
    const titleNotes = [196, 247, 294, 392, 294, 247, 220, 196];
    const levelNotes = [262, 330, 392, 523, 392, 330, 294, 349, 392, 494, 392, 330];
    const bossNotes = [155, 185, 208, 247, 208, 185, 175, 208, 247, 311, 247, 208];
    const victoryNotes = [392, 494, 587, 784, 659, 784];
    const gameoverNotes = [196, 185, 175, 165, 147, 131];

    let seq = levelNotes;
    let wave: OscillatorType = 'square';
    let dur = 0.12;
    if (this.track === 'title') {
      seq = titleNotes;
      wave = 'triangle';
      dur = 0.18;
    } else if (this.track === 'boss') {
      seq = bossNotes;
      wave = 'sawtooth';
      dur = 0.1;
    } else if (this.track === 'victory') {
      seq = victoryNotes;
      wave = 'triangle';
      dur = 0.2;
    } else if (this.track === 'gameover') {
      seq = gameoverNotes;
      wave = 'triangle';
      dur = 0.25;
    }

    const freq = seq[step % seq.length];
    this.tone(freq, t, dur, wave, 0.08, this.musicGain);

    // Bass every 4 steps
    if (step % 4 === 0) {
      this.tone(freq / 2, t, 0.15, 'triangle', 0.06, this.musicGain);
    }
    // Percussive click
    if (step % 2 === 0) {
      this.noise(t, 0.03, 0.03, this.musicGain);
    }
  }

  private tone(
    freq: number,
    when: number,
    dur: number,
    type: OscillatorType,
    gain: number,
    dest: GainNode,
  ): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(gain, when + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    osc.connect(g);
    g.connect(dest);
    osc.start(when);
    osc.stop(when + dur + 0.02);
  }

  private noise(when: number, dur: number, gain: number, dest: GainNode): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const bufferSize = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const g = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1200;
    g.gain.setValueAtTime(gain, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(dest);
    src.start(when);
    src.stop(when + dur);
  }

  private sfxTone(freq: number, dur: number, type: OscillatorType, gain = 0.12): void {
    const ctx = this.ensure();
    if (!ctx || !this.sfxGain || !this.unlocked || this.muted) return;
    this.tone(freq, ctx.currentTime, dur, type, gain, this.sfxGain);
  }

  sfxShoot(): void {
    this.sfxTone(880, 0.05, 'square', 0.06);
    this.sfxTone(1320, 0.04, 'square', 0.04);
  }

  sfxHit(): void {
    this.sfxTone(220, 0.06, 'sawtooth', 0.08);
  }

  sfxDamage(): void {
    this.sfxTone(120, 0.15, 'sawtooth', 0.12);
    this.sfxTone(90, 0.2, 'triangle', 0.08);
  }

  sfxPickup(): void {
    this.sfxTone(523, 0.06, 'triangle', 0.1);
    this.sfxTone(784, 0.08, 'triangle', 0.08);
  }

  sfxDash(): void {
    const ctx = this.ensure();
    if (!ctx || !this.sfxGain || !this.unlocked) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.12);
    g.gain.setValueAtTime(0.1, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.14);
  }

  sfxLampWarn(): void {
    this.sfxTone(440, 0.08, 'square', 0.07);
    this.sfxTone(330, 0.1, 'square', 0.05);
  }

  sfxExplosion(): void {
    const ctx = this.ensure();
    if (!ctx || !this.sfxGain || !this.unlocked) return;
    this.noise(ctx.currentTime, 0.2, 0.15, this.sfxGain);
    this.sfxTone(80, 0.2, 'sawtooth', 0.1);
  }

  sfxVictory(): void {
    const ctx = this.ensure();
    if (!ctx || !this.sfxGain || !this.unlocked) return;
    const notes = [523, 659, 784, 1046];
    notes.forEach((f, i) => {
      this.tone(f, ctx.currentTime + i * 0.12, 0.2, 'triangle', 0.12, this.sfxGain!);
    });
  }

  sfxGameOver(): void {
    this.sfxTone(196, 0.3, 'triangle', 0.1);
    this.sfxTone(147, 0.4, 'triangle', 0.08);
  }

  sfxUi(): void {
    this.sfxTone(660, 0.04, 'square', 0.05);
  }

  destroy(): void {
    this.stopMusic();
    void this.ctx?.close();
    this.ctx = null;
  }
}

export const audioEngine = new AudioEngine();

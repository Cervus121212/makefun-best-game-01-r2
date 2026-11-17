// STORMKEEPER — procedural sound, no audio files.
// Rain is filtered noise whose loudness follows the raining clouds; thunder
// is a low noise burst; harvest and clicks are short synth notes. Everything
// starts on the first user gesture, as browsers require, and M mutes it all.

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.rainGain = null;
    this.padGain = null;
  }

  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    // Rain: a looped noise buffer through a low-pass filter.
    const len = this.ctx.sampleRate * 2;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    const filt = this.ctx.createBiquadFilter();
    filt.type = 'lowpass'; filt.frequency.value = 900;
    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.value = 0;
    src.connect(filt).connect(this.rainGain).connect(this.ctx.destination);
    src.start();
    // Wind pad: two detuned sines, very quiet, for the valley's mood.
    const pad = this.ctx.createOscillator();
    pad.type = 'sine'; pad.frequency.value = 110;
    const pad2 = this.ctx.createOscillator();
    pad2.type = 'sine'; pad2.frequency.value = 165.3;
    this.padGain = this.ctx.createGain();
    this.padGain.gain.value = 0.015;
    pad.connect(this.padGain); pad2.connect(this.padGain);
    this.padGain.connect(this.ctx.destination);
    pad.start(); pad2.start();
  }

  setRain(level) {
    if (!this.ctx || !this.rainGain) return;
    const target = this.muted ? 0 : Math.min(0.16, level * 0.05);
    this.rainGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.2);
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.ctx && this.rainGain) {
      this.rainGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
    }
    if (this.ctx && this.padGain) {
      this.padGain.gain.setTargetAtTime(muted ? 0 : 0.015, this.ctx.currentTime, 0.1);
    }
  }

  blip(freq, dur, type, vol) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type || 'sine'; o.frequency.value = freq || 440;
    g.gain.setValueAtTime(vol || 0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + (dur || 0.12));
    o.connect(g).connect(this.ctx.destination);
    o.start(t); o.stop(t + (dur || 0.12) + 0.02);
  }

  chime() { this.blip(660, 0.14, 'sine', 0.14); setTimeout(() => this.blip(880, 0.2, 'sine', 0.12), 90); }
  click() { this.blip(520, 0.06, 'square', 0.05); }
  thunder() {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const len = this.ctx.sampleRate * 0.7;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filt = this.ctx.createBiquadFilter();
    filt.type = 'lowpass'; filt.frequency.value = 220;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    src.connect(filt).connect(g).connect(this.ctx.destination);
    src.start(t);
  }
}

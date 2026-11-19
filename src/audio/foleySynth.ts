// Web Audio API Foley Synthesizer & Custom Audio Buffer Engine
// Zero external audio dependencies — works reliably offline and in restricted school networks.

export type BuiltinSoundId =
  | 'footsteps'
  | 'gravelSteps'
  | 'waterSplash'
  | 'clothRustle'
  | 'whoosh'
  | 'doorCreak'
  | 'explosion'
  | 'punchImpact'
  | 'glassBreak'
  | 'paperCrinkle'
  | 'thunder'
  | 'rain';

class FoleyAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private customBuffers = new Map<string, AudioBuffer>();
  private activeNodes: AudioNode[] = [];

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.85;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    if (!this.ctx || !this.masterGain) return;
    this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.85, this.ctx.currentTime, 0.02);
  }

  public stopAll() {
    this.activeNodes.forEach((node) => {
      try {
        if ('stop' in node && typeof (node as AudioScheduledSourceNode).stop === 'function') {
          (node as AudioScheduledSourceNode).stop();
        }
        node.disconnect();
      } catch {
        // Node already stopped
      }
    });
    this.activeNodes = [];
  }

  public async registerCustomAudio(id: string, file: File): Promise<number> {
    const ctx = this.ensureContext();
    const arrayBuffer = await file.arrayBuffer();
    const decoded = await ctx.decodeAudioData(arrayBuffer);
    this.customBuffers.set(id, decoded);
    return decoded.duration;
  }

  public playSound(id: string, isMuted = false): boolean {
    if (isMuted) return false;
    const ctx = this.ensureContext();
    const dest = this.masterGain!;

    const custom = this.customBuffers.get(id);
    if (custom) {
      const src = ctx.createBufferSource();
      src.buffer = custom;
      const gain = ctx.createGain();
      gain.gain.value = 0.9;
      src.connect(gain);
      gain.connect(dest);
      src.start();
      this.trackNode(src);
      return true;
    }

    switch (id as BuiltinSoundId) {
      case 'footsteps':
        this.synthFootsteps(ctx, dest);
        return true;
      case 'gravelSteps':
        this.synthGravelSteps(ctx, dest);
        return true;
      case 'waterSplash':
        this.synthWaterSplash(ctx, dest);
        return true;
      case 'clothRustle':
        this.synthClothRustle(ctx, dest);
        return true;
      case 'whoosh':
        this.synthWhoosh(ctx, dest);
        return true;
      case 'doorCreak':
        this.synthDoorCreak(ctx, dest);
        return true;
      case 'explosion':
        this.synthExplosion(ctx, dest);
        return true;
      case 'punchImpact':
        this.synthPunchImpact(ctx, dest);
        return true;
      case 'glassBreak':
        this.synthGlassBreak(ctx, dest);
        return true;
      case 'paperCrinkle':
        this.synthPaperCrinkle(ctx, dest);
        return true;
      case 'thunder':
        this.synthThunder(ctx, dest);
        return true;
      case 'rain':
        this.synthRain(ctx, dest);
        return true;
      default:
        return false;
    }
  }

  private trackNode(node: AudioNode) {
    this.activeNodes.push(node);
    if (this.activeNodes.length > 96) {
      this.activeNodes.shift();
    }
  }

  private createNoiseBuffer(ctx: AudioContext, duration: number, pink = false): AudioBuffer {
    const length = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0,
      b1 = 0,
      b2 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      if (pink) {
        b0 = 0.99765 * b0 + white * 0.099046;
        b1 = 0.963 * b1 + white * 0.2965164;
        b2 = 0.57 * b2 + white * 1.0526913;
        data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.18;
      } else {
        data[i] = white;
      }
    }
    return buffer;
  }

  private synthFootsteps(ctx: AudioContext, dest: AudioNode) {
    const now = ctx.currentTime;
    const stepOffsets = [0, 0.42, 0.85];
    stepOffsets.forEach((offset, idx) => {
      [0, 0.065].forEach((subOffset, part) => {
        const t = now + offset + subOffset;
        const noise = ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer(ctx, 0.14);

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(part === 0 ? 480 + idx * 30 : 950, t);
        filter.Q.value = 1.8;

        const gain = ctx.createGain();
        const peak = part === 0 ? 0.85 : 0.45;
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.exponentialRampToValueAtTime(peak, t + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);

        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(part === 0 ? 125 : 160, t);
        osc.frequency.exponentialRampToValueAtTime(48, t + 0.08);
        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(part === 0 ? 0.42 : 0.2, t);
        oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.085);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(dest);

        osc.connect(oscGain);
        oscGain.connect(dest);

        noise.start(t);
        noise.stop(t + 0.13);
        osc.start(t);
        osc.stop(t + 0.09);
        this.trackNode(noise);
        this.trackNode(osc);
      });
    });
  }

  private synthGravelSteps(ctx: AudioContext, dest: AudioNode) {
    const now = ctx.currentTime;
    [0, 0.36, 0.72].forEach((offset) => {
      const t = now + offset;
      const noise = ctx.createBufferSource();
      noise.buffer = this.createNoiseBuffer(ctx, 0.24);

      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(2200, t);
      bp.frequency.exponentialRampToValueAtTime(1100, t + 0.18);
      bp.Q.value = 1.1;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.65, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      noise.connect(bp);
      bp.connect(gain);
      gain.connect(dest);
      noise.start(t);
      noise.stop(t + 0.23);
      this.trackNode(noise);
    });
  }

  private synthDoorCreak(ctx: AudioContext, dest: AudioNode) {
    const now = ctx.currentTime;
    const duration = 1.45;

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(145, now);
    osc.frequency.linearRampToValueAtTime(215, now + 0.35);
    osc.frequency.linearRampToValueAtTime(175, now + 0.72);
    osc.frequency.linearRampToValueAtTime(295, now + 1.18);
    osc.frequency.linearRampToValueAtTime(125, now + duration);

    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(19, now);
    lfo.frequency.linearRampToValueAtTime(8, now + duration);
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 34;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    const formant = ctx.createBiquadFilter();
    formant.type = 'bandpass';
    formant.frequency.setValueAtTime(680, now);
    formant.frequency.linearRampToValueAtTime(1120, now + 0.9);
    formant.Q.value = 6.5;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.45, now + 0.18);
    gain.gain.setValueAtTime(0.38, now + 0.9);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(formant);
    formant.connect(gain);
    gain.connect(dest);

    osc.start(now);
    lfo.start(now);
    osc.stop(now + duration);
    lfo.stop(now + duration);
    this.trackNode(osc);
    this.trackNode(lfo);
  }

  private synthWhoosh(ctx: AudioContext, dest: AudioNode) {
    const now = ctx.currentTime;
    const duration = 0.55;
    const noise = ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(ctx, duration, true);

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(280, now);
    bp.frequency.exponentialRampToValueAtTime(2100, now + 0.22);
    bp.frequency.exponentialRampToValueAtTime(340, now + duration);
    bp.Q.value = 1.8;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.75, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(bp);
    bp.connect(gain);
    gain.connect(dest);
    noise.start(now);
    noise.stop(now + duration);
    this.trackNode(noise);
  }

  private synthExplosion(ctx: AudioContext, dest: AudioNode) {
    const now = ctx.currentTime;
    const duration = 2.1;

    // Initial shockwave sub-boom
    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(115, now);
    sub.frequency.exponentialRampToValueAtTime(26, now + 0.55);

    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(1.1, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

    sub.connect(subGain);
    subGain.connect(dest);
    sub.start(now);
    sub.stop(now + 0.78);
    this.trackNode(sub);

    // Fireball low-pass roar
    const roar = ctx.createBufferSource();
    roar.buffer = this.createNoiseBuffer(ctx, duration, true);

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(2400, now);
    lp.frequency.exponentialRampToValueAtTime(140, now + duration);

    const roarGain = ctx.createGain();
    roarGain.gain.setValueAtTime(0.01, now);
    roarGain.gain.linearRampToValueAtTime(1.0, now + 0.03);
    roarGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    roar.connect(lp);
    lp.connect(roarGain);
    roarGain.connect(dest);
    roar.start(now);
    roar.stop(now + duration);
    this.trackNode(roar);

    // High debris crackle tail
    for (let i = 0; i < 6; i++) {
      const t = now + 0.08 + i * 0.11 + Math.random() * 0.06;
      const crack = ctx.createBufferSource();
      crack.buffer = this.createNoiseBuffer(ctx, 0.09);
      const hp = ctx.createBiquadFilter();
      hp.type = 'bandpass';
      hp.frequency.value = 1800 + Math.random() * 2200;
      const cg = ctx.createGain();
      cg.gain.setValueAtTime(0.28, t);
      cg.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      crack.connect(hp);
      hp.connect(cg);
      cg.connect(dest);
      crack.start(t);
      crack.stop(t + 0.085);
      this.trackNode(crack);
    }
  }

  private synthThunder(ctx: AudioContext, dest: AudioNode) {
    const now = ctx.currentTime;
    const duration = 2.6;

    const rumble = ctx.createBufferSource();
    rumble.buffer = this.createNoiseBuffer(ctx, duration, true);

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(1100, now);
    lp.frequency.exponentialRampToValueAtTime(110, now + duration);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.95, now + 0.05);
    gain.gain.linearRampToValueAtTime(0.45, now + 0.45);
    gain.gain.linearRampToValueAtTime(0.65, now + 0.72);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    rumble.connect(lp);
    lp.connect(gain);
    gain.connect(dest);
    rumble.start(now);
    rumble.stop(now + duration);
    this.trackNode(rumble);
  }

  private synthGlassBreak(ctx: AudioContext, dest: AudioNode) {
    const now = ctx.currentTime;

    const crash = ctx.createBufferSource();
    crash.buffer = this.createNoiseBuffer(ctx, 0.65);
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 2100;
    const crashGain = ctx.createGain();
    crashGain.gain.setValueAtTime(0.85, now);
    crashGain.gain.exponentialRampToValueAtTime(0.001, now + 0.52);

    crash.connect(hp);
    hp.connect(crashGain);
    crashGain.connect(dest);
    crash.start(now);
    crash.stop(now + 0.55);
    this.trackNode(crash);

    const shards = [2400, 3150, 3890, 4620, 5410, 6250, 2950, 4180, 5880, 7100];
    shards.forEach((freq, i) => {
      const t = now + i * 0.045 + Math.random() * 0.04;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq + (Math.random() * 240 - 120), t);

      const shardGain = ctx.createGain();
      shardGain.gain.setValueAtTime(0.24 / (1 + i * 0.14), t);
      shardGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc.connect(shardGain);
      shardGain.connect(dest);
      osc.start(t);
      osc.stop(t + 0.24);
      this.trackNode(osc);
    });
  }

  private synthRain(ctx: AudioContext, dest: AudioNode) {
    const now = ctx.currentTime;
    const duration = 2.6;

    const rainNoise = ctx.createBufferSource();
    rainNoise.buffer = this.createNoiseBuffer(ctx, duration, true);

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1400;
    bp.Q.value = 0.65;

    const hs = ctx.createBiquadFilter();
    hs.type = 'highshelf';
    hs.frequency.value = 3400;
    hs.gain.value = 4;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.55, now + 0.35);
    gain.gain.setValueAtTime(0.5, now + duration - 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    rainNoise.connect(bp);
    bp.connect(hs);
    hs.connect(gain);
    gain.connect(dest);

    rainNoise.start(now);
    rainNoise.stop(now + duration);
    this.trackNode(rainNoise);
  }

  private synthClothRustle(ctx: AudioContext, dest: AudioNode) {
    const now = ctx.currentTime;
    const duration = 0.68;

    const noise = ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(ctx, duration, true);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, now);
    filter.frequency.exponentialRampToValueAtTime(2200, now + 0.25);
    filter.frequency.exponentialRampToValueAtTime(1100, now + duration);
    filter.Q.value = 1.6;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.45, now + 0.14);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.36);
    gain.gain.linearRampToValueAtTime(0.4, now + 0.48);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    noise.start(now);
    noise.stop(now + duration);
    this.trackNode(noise);
  }

  private synthPunchImpact(ctx: AudioContext, dest: AudioNode) {
    const now = ctx.currentTime;

    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(140, now);
    sub.frequency.exponentialRampToValueAtTime(34, now + 0.18);

    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(1.0, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    sub.connect(subGain);
    subGain.connect(dest);
    sub.start(now);
    sub.stop(now + 0.24);
    this.trackNode(sub);

    const slap = ctx.createBufferSource();
    slap.buffer = this.createNoiseBuffer(ctx, 0.16);
    const lp = ctx.createBiquadFilter();
    lp.type = 'bandpass';
    lp.frequency.setValueAtTime(850, now);
    lp.Q.value = 1.2;

    const slapGain = ctx.createGain();
    slapGain.gain.setValueAtTime(0.95, now);
    slapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    slap.connect(lp);
    lp.connect(slapGain);
    slapGain.connect(dest);
    slap.start(now);
    slap.stop(now + 0.15);
    this.trackNode(slap);
  }

  private synthPaperCrinkle(ctx: AudioContext, dest: AudioNode) {
    const now = ctx.currentTime;
    const bursts = 9;
    for (let i = 0; i < bursts; i++) {
      const t = now + i * 0.065 + Math.random() * 0.03;
      const noise = ctx.createBufferSource();
      noise.buffer = this.createNoiseBuffer(ctx, 0.07);

      const hp = ctx.createBiquadFilter();
      hp.type = 'bandpass';
      hp.frequency.value = 2600 + Math.random() * 2400;
      hp.Q.value = 2.4;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.35 + Math.random() * 0.2, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.055);

      noise.connect(hp);
      hp.connect(gain);
      gain.connect(dest);
      noise.start(t);
      noise.stop(t + 0.06);
      this.trackNode(noise);
    }
  }

  private synthWaterSplash(ctx: AudioContext, dest: AudioNode) {
    const now = ctx.currentTime;

    const spray = ctx.createBufferSource();
    spray.buffer = this.createNoiseBuffer(ctx, 0.85, true);

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(600, now);
    bp.frequency.exponentialRampToValueAtTime(2800, now + 0.14);
    bp.frequency.exponentialRampToValueAtTime(1100, now + 0.75);
    bp.Q.value = 1.1;

    const sprayGain = ctx.createGain();
    sprayGain.gain.setValueAtTime(0.001, now);
    sprayGain.gain.linearRampToValueAtTime(0.75, now + 0.04);
    sprayGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    spray.connect(bp);
    bp.connect(sprayGain);
    sprayGain.connect(dest);
    spray.start(now);
    spray.stop(now + 0.82);
    this.trackNode(spray);

    [0.02, 0.12, 0.24].forEach((offset, idx) => {
      const t = now + offset;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(260 + idx * 140, t);
      osc.frequency.exponentialRampToValueAtTime(680 + idx * 190, t + 0.09);

      const g = ctx.createGain();
      g.gain.setValueAtTime(0.28, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

      osc.connect(g);
      g.connect(dest);
      osc.start(t);
      osc.stop(t + 0.11);
      this.trackNode(osc);
    });
  }
}

export const foleyAudio = new FoleyAudioEngine();

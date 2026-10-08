/**
 * Web Audio API Sound Synthesizer Engine for Dark Force Alive
 * Generates realistic gunshots, reloads, monsters, breathing, footsteps, and atmospheric horror audio.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private breathingNode: { gain: GainNode; interval: number | null } | null = null;
  private witchSobInterval: number | null = null;

  constructor() {
    // AudioContext initialized on first user interaction
  }

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.8, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  private createNoiseBuffer(duration: number = 1): AudioBuffer | null {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // --- WEAPON SOUNDS ---
  public playGunshot(weaponType: string) {
    this.init();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;

    if (weaponType === 'ak47') {
      // Heavier, deeper punch for AK-47 Soviet Relic shot
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(130, now);
      osc.frequency.exponentialRampToValueAtTime(25, now + 0.16);
      oscGain.gain.setValueAtTime(1.1, now);
      oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);
      osc.connect(oscGain);
      oscGain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.16);

      // Low end punch
      const lowOsc = this.ctx.createOscillator();
      const lowGain = this.ctx.createGain();
      lowOsc.type = 'triangle';
      lowOsc.frequency.setValueAtTime(70, now);
      lowOsc.frequency.exponentialRampToValueAtTime(15, now + 0.2);
      lowGain.gain.setValueAtTime(1.2, now);
      lowGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      lowOsc.connect(lowGain);
      lowGain.connect(this.masterGain);
      lowOsc.start(now);
      lowOsc.stop(now + 0.2);

      // Noise punch
      const noise = this.ctx.createBufferSource();
      const noiseBuf = this.createNoiseBuffer(0.18);
      if (noiseBuf) {
        noise.buffer = noiseBuf;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1500, now);
        filter.Q.setValueAtTime(1.0, now);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(1.1, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        noise.start(now);
      }
    } else if (weaponType === 'm4a1' || weaponType === 'minigun') {
      // Punchy assault rifle shot with metallic transient & sub bass blast
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.12);
      oscGain.gain.setValueAtTime(0.9, now);
      oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.connect(oscGain);
      oscGain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.12);

      // Noise punch
      const noise = this.ctx.createBufferSource();
      const noiseBuf = this.createNoiseBuffer(0.15);
      if (noiseBuf) {
        noise.buffer = noiseBuf;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(2200, now);
        filter.Q.setValueAtTime(1.5, now);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(1.0, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        noise.start(now);
      }
    } else if (weaponType === 'shotgun') {
      // Thunderous 12-gauge boom
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(250, now);
      osc.frequency.exponentialRampToValueAtTime(20, now + 0.35);
      oscGain.gain.setValueAtTime(1.2, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(oscGain);
      oscGain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.35);

      const noise = this.ctx.createBufferSource();
      const noiseBuf = this.createNoiseBuffer(0.35);
      if (noiseBuf) {
        noise.buffer = noiseBuf;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1800, now);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(1.2, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        noise.start(now);
      }

      // Shell pump delayed sound
      setTimeout(() => this.playMechanicalClick(0.7, 400), 280);
    } else if (weaponType === 'sniper' || weaponType === 'tank_turret') {
      // Heavy high-caliber .50 BMG shockwave
      const isTank = weaponType === 'tank_turret';
      const dur = isTank ? 0.6 : 0.45;

      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(isTank ? 120 : 180, now);
      osc.frequency.exponentialRampToValueAtTime(15, now + dur);
      oscGain.gain.setValueAtTime(isTank ? 1.5 : 1.3, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + dur);
      osc.connect(oscGain);
      oscGain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + dur);

      const noise = this.ctx.createBufferSource();
      const noiseBuf = this.createNoiseBuffer(dur);
      if (noiseBuf) {
        noise.buffer = noiseBuf;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(isTank ? 1200 : 3200, now);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(1.3, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + dur);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        noise.start(now);
      }
    }
  }

  public playMechanicalClick(volume: number = 0.5, pitch: number = 1200) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.05);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  public playMetalClank(volume: number, pitch: number, duration: number = 0.08, highpassFreq: number = 1500) {
    this.init();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    
    // Snappy metal oscillator click
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.35, now + duration);
    
    gain.gain.setValueAtTime(volume * 0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + duration);

    // Friction noise transient
    const noise = this.ctx.createBufferSource();
    const buf = this.createNoiseBuffer(duration);
    if (buf) {
      noise.buffer = buf;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(highpassFreq, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(volume * 0.7, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + duration);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.masterGain);
      noise.start(now);
    }
  }

  public playReloadSound() {
    this.init();
    if (!this.ctx) return;
    // Mag eject -> insert -> bolt release sequence
    this.playTacticalReloadSound();
  }

  public playTacticalReloadSound() {
    this.init();
    if (!this.ctx) return;
    
    // Snappy, ultra-quick John Wick style tactical mag swap:
    // 0ms: Mag eject click
    this.playMetalClank(0.65, 800, 0.06, 1800);
    // 150ms: New mag slide in
    setTimeout(() => this.playMetalClank(0.75, 1200, 0.07, 1400), 150);
    // 240ms: Snappy magazine slam insert!
    setTimeout(() => this.playMetalClank(0.95, 450, 0.12, 900), 240);
  }

  public playDryReloadSound() {
    this.init();
    if (!this.ctx) return;
    
    // Heavy, complex John Wick style empty chamber dry reload:
    // 0ms: Empty mag drop
    this.playMetalClank(0.65, 750, 0.07, 1600);
    // 250ms: New magazine guided slide-in
    setTimeout(() => this.playMetalClank(0.8, 1100, 0.08, 1300), 250);
    // 350ms: Heavy magazine locked slam!
    setTimeout(() => this.playMetalClank(0.95, 380, 0.14, 800), 350);
    // 680ms: Charging handle/bolt pull back scrape
    setTimeout(() => this.playMetalClank(0.85, 1400, 0.06, 1500), 680);
    // 780ms: Slide forward bolt chamber slap - heavy metal clack!
    setTimeout(() => this.playMetalClank(1.1, 320, 0.15, 500), 780);
  }

  public playDryFire() {
    this.playMechanicalClick(0.4, 2000);
  }

  public playHitmarkerTick() {
    this.init();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2200, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.04);
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  public playSlideSound() {
    this.init();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    const buf = this.createNoiseBuffer(0.6);
    if (!buf) return;
    noise.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.frequency.exponentialRampToValueAtTime(300, now + 0.6);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(now);
  }

  public playDiveSound() {
    this.init();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    // Whoosh
    const noise = this.ctx.createBufferSource();
    const buf = this.createNoiseBuffer(0.4);
    if (buf) {
      noise.buffer = buf;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(450, now);
      filter.frequency.exponentialRampToValueAtTime(120, now + 0.4);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      noise.start(now);
    }
    // Heavy impact click
    setTimeout(() => this.playMechanicalClick(0.6, 250), 300);
  }

  // --- FOOTSTEPS ---
  public playFootstep(
    isSprinting: boolean = false, 
    surface: 'grass' | 'dirt' | 'wood' | 'rock' | 'water' | 'metal' = 'grass'
  ) {
    this.init();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    const buf = this.createNoiseBuffer(0.09);
    if (!buf) return;
    noise.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';

    if (surface === 'grass') {
      filter.frequency.setValueAtTime(380, now);
      filter.Q.setValueAtTime(2.2, now);
    } else if (surface === 'dirt') {
      filter.frequency.setValueAtTime(220, now);
      filter.Q.setValueAtTime(1.8, now);
    } else if (surface === 'wood') {
      filter.frequency.setValueAtTime(180, now);
      filter.Q.setValueAtTime(4.5, now);
    } else if (surface === 'rock') {
      filter.frequency.setValueAtTime(1200, now);
      filter.Q.setValueAtTime(3.0, now);
    } else if (surface === 'water') {
      filter.frequency.setValueAtTime(650, now);
      filter.Q.setValueAtTime(1.2, now);
    } else if (surface === 'metal') {
      filter.frequency.setValueAtTime(1800, now);
      filter.Q.setValueAtTime(4.0, now);
    }

    const gain = this.ctx.createGain();
    const vol = isSprinting ? 0.38 : 0.22;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(now);
  }

  // --- 3D SPATIAL AUDIO & FOREST AMBIENCE ---
  public playSpatialSound(
    soundType: string, 
    sourcePos: { x: number; y: number; z: number }, 
    listenerPos: { x: number; y: number; z: number }
  ) {
    this.init();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    // Calculate 3D spatial pan and attenuation distance
    const dx = sourcePos.x - listenerPos.x;
    const dy = sourcePos.y - listenerPos.y;
    const dz = sourcePos.z - listenerPos.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (dist > 120) return; // Beyond audible radius

    const now = this.ctx.currentTime;
    const panner = this.ctx.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 5;
    panner.maxDistance = 120;
    panner.rolloffFactor = 1.2;
    panner.positionX.setValueAtTime(sourcePos.x, now);
    panner.positionY.setValueAtTime(sourcePos.y, now);
    panner.positionZ.setValueAtTime(sourcePos.z, now);

    panner.connect(this.masterGain);

    if (soundType === 'branch_snap') {
      const noise = this.ctx.createBufferSource();
      const buf = this.createNoiseBuffer(0.12);
      if (buf) {
        noise.buffer = buf;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(2400, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(panner);
        noise.start(now);
      }
    } else {
      this.playCreatureSound(soundType);
    }
  }

  // --- PLAYER HEAVY BREATHING & BLOOD COUGH ---
  public playHeavyBreathing(intensity: number) {
    this.init();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    // Modulated noise exhales and inhales
    const noise = this.ctx.createBufferSource();
    const buf = this.createNoiseBuffer(0.7);
    if (!buf) return;
    noise.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300 + intensity * 400, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.12 * intensity, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(now);
  }

  public playBloodCough() {
    this.init();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    // Low throaty gasp & wet cough sound
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.linearRampToValueAtTime(80, now + 0.3);
    oscGain.gain.setValueAtTime(0.6, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    const noise = this.ctx.createBufferSource();
    const buf = this.createNoiseBuffer(0.35);
    if (buf) {
      noise.buffer = buf;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(350, now);
      filter.Q.setValueAtTime(2, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.5, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.masterGain);
      noise.start(now);
    }

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  public playHeartbeat() {
    this.init();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    // Double thump (thump-thump)
    [0, 0.18].forEach((delay) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(65, now + delay);
      osc.frequency.exponentialRampToValueAtTime(25, now + delay + 0.12);

      gain.gain.setValueAtTime(0.8, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.12);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now + delay);
      osc.stop(now + delay + 0.12);
    });
  }

  // --- MONSTER AUDIO ---
  public playCreatureSound(type: string) {
    this.init();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;

    // Standardize types to handle aliases
    let activeType = type;
    if (type === 'jockey_9tentacles') activeType = 'jockey';
    if (type === 'crying_witch') activeType = 'witch_scream';
    if (type === 'flying_phantom') activeType = 'phantom';

    if (activeType === 'blood_spider') {
      // High chittering hiss & wet blood slurping sound
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1800, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.6);

      const lfo = this.ctx.createOscillator();
      lfo.frequency.setValueAtTime(32, now);
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(400, now);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start(now);
      lfo.stop(now + 0.6);

      gain.gain.setValueAtTime(0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.6);
    } else if (activeType === 'subterranean_snake') {
      // Subterranean earth rumble & hissed venom snap
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.9);

      gain.gain.setValueAtTime(1.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.9);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.9);
    } else if (activeType === 'winged_ice_skinwalker') {
      // Freezing wind blast & cracking ice shatter
      const noise = this.ctx.createBufferSource();
      const buf = this.createNoiseBuffer(1.2);
      if (buf) {
        noise.buffer = buf;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1200, now);
        filter.frequency.exponentialRampToValueAtTime(3200, now + 1.2);
        filter.Q.setValueAtTime(3.0, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.9, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        noise.start(now);
      }
    } else if (activeType === 'stick_skinwalker_18ft') {
      // Terrifying ear-shattering screech directly into the ear
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(2400, now);
      osc1.frequency.linearRampToValueAtTime(4200, now + 1.2);

      gain1.gain.setValueAtTime(1.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 1.2);

      osc1.connect(gain1);
      gain1.connect(this.masterGain);
      osc1.start(now);
      osc1.stop(now + 1.2);

      // High-pitch tinnitus ear ring
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(6500, now);
      gain2.gain.setValueAtTime(0.4, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

      osc2.connect(gain2);
      gain2.connect(this.masterGain);
      osc2.start(now);
      osc2.stop(now + 1.5);
    }

    if (activeType === 'zombie') {
      // 1. ZOMBIE (STANDARD) - Base deep groans, Walrus low rumbles, wet tearing mouth tissues
      
      // Layer A: Human low-frequency chest-rattling throat grunts
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(75, now);
      osc1.frequency.linearRampToValueAtTime(55, now + 1.2);
      
      // Mild LFO throat gurgle on human base
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(10, now);
      lfoGain.gain.setValueAtTime(12, now);
      lfo.connect(lfoGain);
      lfoGain.connect(osc1.frequency);
      lfo.start(now);
      lfo.stop(now + 1.2);

      gain1.gain.setValueAtTime(0.55, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
      osc1.connect(gain1);
      gain1.connect(this.masterGain);
      osc1.start(now);
      osc1.stop(now + 1.2);

      // Layer B: Animal (Walrus/Bull groaning deep rumble)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(38, now);
      osc2.frequency.exponentialRampToValueAtTime(28, now + 1.2);
      
      const filterLow = this.ctx.createBiquadFilter();
      filterLow.type = 'lowpass';
      filterLow.frequency.setValueAtTime(95, now);

      gain2.gain.setValueAtTime(0.7, now);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
      osc2.connect(filterLow);
      filterLow.connect(gain2);
      gain2.connect(this.masterGain);
      osc2.start(now);
      osc2.stop(now + 1.2);

      // Layer C: Foley (Wet, water-logged rag squeezing close to mic - wet mouth tearing tissue)
      const noise = this.ctx.createBufferSource();
      const buf = this.createNoiseBuffer(1.0);
      if (buf) {
        noise.buffer = buf;
        const filterHigh = this.ctx.createBiquadFilter();
        filterHigh.type = 'bandpass';
        filterHigh.frequency.setValueAtTime(2600, now);
        filterHigh.Q.setValueAtTime(3.5, now);

        const noiseGain = this.ctx.createGain();
        
        // Rapid gating envelope simulating wet squishing tissues
        const gateLFO = this.ctx.createOscillator();
        const gateLFOGain = this.ctx.createGain();
        gateLFO.type = 'sine';
        gateLFO.frequency.setValueAtTime(16, now);
        gateLFOGain.gain.setValueAtTime(0.18, now);
        gateLFO.connect(gateLFOGain);
        gateLFOGain.connect(noiseGain.gain);
        
        gateLFO.start(now);
        gateLFO.stop(now + 1.0);

        noiseGain.gain.setValueAtTime(0.25, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 1.0);

        noise.connect(filterHigh);
        filterHigh.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        noise.start(now);
      }

    } else if (activeType === 'striker_zombie') {
      // 2. STRIKER ZOMBIE - Frantic screaming pant, unhinged Chimpanzee/Hyena laugh, snapping bone celery
      
      // Layer A: Frantic, rapid human panting and hyperventilating
      [0, 0.25, 0.5, 0.75].forEach((delay) => {
        const pantOsc = this.ctx!.createOscillator();
        const pantGain = this.ctx!.createGain();
        pantOsc.type = 'sawtooth';
        pantOsc.frequency.setValueAtTime(190, now + delay);
        pantOsc.frequency.exponentialRampToValueAtTime(110, now + delay + 0.18);

        pantGain.gain.setValueAtTime(0.35, now + delay);
        pantGain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.18);

        pantOsc.connect(pantGain);
        pantGain.connect(this.masterGain!);
        pantOsc.start(now + delay);
        pantOsc.stop(now + delay + 0.18);
      });

      // Layer B: Animal (Chimpanzee high screech paired with Hyena unhinged laughing)
      const animalOsc = this.ctx.createOscillator();
      const animalGain = this.ctx.createGain();
      animalOsc.type = 'square';
      animalOsc.frequency.setValueAtTime(850, now);
      animalOsc.frequency.exponentialRampToValueAtTime(1450, now + 0.3);
      animalOsc.frequency.linearRampToValueAtTime(650, now + 0.9);

      // Pitch vibrato for hyena unhinged look/laugh feel
      const vibrato = this.ctx.createOscillator();
      const vibratoGain = this.ctx.createGain();
      vibrato.frequency.setValueAtTime(32, now); // high rate laugh flutter
      vibratoGain.gain.setValueAtTime(150, now);
      vibrato.connect(vibratoGain);
      vibratoGain.connect(animalOsc.frequency);
      vibrato.start(now);
      vibrato.stop(now + 0.9);

      animalGain.gain.setValueAtTime(0.45, now);
      animalGain.gain.exponentialRampToValueAtTime(0.01, now + 0.9);
      animalOsc.connect(animalGain);
      animalGain.connect(this.masterGain);
      animalOsc.start(now);
      animalOsc.stop(now + 0.9);

      // Layer C: Foley (Snapping celery sticks - mutated leg bones cracking under high-speed sprint)
      const snapNoise = this.ctx.createBufferSource();
      const snapBuf = this.createNoiseBuffer(0.12);
      if (snapBuf) {
        snapNoise.buffer = snapBuf;
        const hpFilter = this.ctx.createBiquadFilter();
        hpFilter.type = 'highpass';
        hpFilter.frequency.setValueAtTime(3400, now);

        const snapGain = this.ctx.createGain();
        snapGain.gain.setValueAtTime(0.85, now);
        snapGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

        snapNoise.connect(hpFilter);
        hpFilter.connect(snapGain);
        snapGain.connect(this.masterGain);
        snapNoise.start(now);
      }

    } else if (activeType === 'skinwalker') {
      // 3. SKINWALKER - Reversed ghostly pre-echo, Deer/Elk bugle screech, scraping wooden skeletal click
      
      // Layer A: Reversed Ghostly pre-echo (Swells in volume and pitch, then cuts, followed by the normal sound)
      const echoOsc = this.ctx.createOscillator();
      const echoGain = this.ctx.createGain();
      echoOsc.type = 'sine';
      echoOsc.frequency.setValueAtTime(180, now);
      echoOsc.frequency.linearRampToValueAtTime(820, now + 0.45); // Sweeps up
      
      echoGain.gain.setValueAtTime(0.001, now);
      echoGain.gain.linearRampToValueAtTime(0.65, now + 0.4); // Volume swell
      echoGain.gain.setValueAtTime(0.001, now + 0.45); // Sharp cut
      
      echoOsc.connect(echoGain);
      echoGain.connect(this.masterGain);
      echoOsc.start(now);
      echoOsc.stop(now + 0.45);

      // Layer B: Animal (Elk bugle metallic whistle + Tasmanian Devil screech)
      const mainScaryScream = () => {
        const elkOsc = this.ctx!.createOscillator();
        const tasmOsc = this.ctx!.createOscillator();
        const mainGain = this.ctx!.createGain();

        elkOsc.type = 'sine';
        // Elk bugle - high metallic whistling slide
        elkOsc.frequency.setValueAtTime(1450, now + 0.45);
        elkOsc.frequency.exponentialRampToValueAtTime(2150, now + 0.65);
        elkOsc.frequency.linearRampToValueAtTime(950, now + 1.2);

        // Pitch vibrato
        const vib = this.ctx!.createOscillator();
        const vibG = this.ctx!.createGain();
        vib.frequency.setValueAtTime(45, now + 0.45);
        vibG.gain.setValueAtTime(80, now + 0.45);
        vib.connect(vibG);
        vibG.connect(elkOsc.frequency);
        vib.start(now + 0.45);
        vib.stop(now + 1.2);

        // Tasmanian Devil screech - harsh square waves
        tasmOsc.type = 'sawtooth';
        tasmOsc.frequency.setValueAtTime(260, now + 0.45);
        tasmOsc.frequency.linearRampToValueAtTime(190, now + 1.2);

        mainGain.gain.setValueAtTime(0.55, now + 0.45);
        mainGain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);

        elkOsc.connect(mainGain);
        tasmOsc.connect(mainGain);
        mainGain.connect(this.masterGain!);

        elkOsc.start(now + 0.45);
        tasmOsc.start(now + 0.45);
        elkOsc.stop(now + 1.2);
        tasmOsc.stop(now + 1.2);
      };
      mainScaryScream();

      // Layer C: Foley (Scraping heavy key across cardboard - sharp scraping, wooden skeletal click)
      const scrapeNoise = this.ctx.createBufferSource();
      const scrapeBuf = this.createNoiseBuffer(0.8);
      if (scrapeBuf) {
        scrapeNoise.buffer = scrapeBuf;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(5500, now + 0.4);
        filter.Q.setValueAtTime(8, now + 0.4);

        const scrapeGain = this.ctx.createGain();
        scrapeGain.gain.setValueAtTime(0.4, now + 0.4);
        scrapeGain.gain.exponentialRampToValueAtTime(0.01, now + 1.1);

        scrapeNoise.connect(filter);
        filter.connect(scrapeGain);
        scrapeGain.connect(this.masterGain);
        scrapeNoise.start(now + 0.4);
      }

    } else if (activeType === 'double_tank') {
      // 4. DOUBLE TANK - Deep gravelly sub-bass, Silverback Gorilla roar, subterranean Alligator growl, Sandbag concrete hits
      
      // Layer A: Colossal Sub-bass rumbles (Gravely chest vibrations)
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(32, now); // massive subwoofer rattling 32Hz
      subOsc.frequency.linearRampToValueAtTime(25, now + 1.4);

      subGain.gain.setValueAtTime(1.4, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
      subOsc.connect(subGain);
      subGain.connect(this.masterGain);
      subOsc.start(now);
      subOsc.stop(now + 1.4);

      // Layer B: Animal (Silverback Gorilla roar combined with Alligator low-frequency vibrating growl)
      const roarOsc = this.ctx.createOscillator();
      const roarGain = this.ctx.createGain();
      roarOsc.type = 'sawtooth';
      roarOsc.frequency.setValueAtTime(85, now);
      roarOsc.frequency.exponentialRampToValueAtTime(45, now + 1.2);

      // Low filter to represent massive throat density
      const lowFilter = this.ctx.createBiquadFilter();
      lowFilter.type = 'lowpass';
      lowFilter.frequency.setValueAtTime(180, now);

      // Hiss noise representation of alligator growl
      const hissNoise = this.ctx.createBufferSource();
      const hissBuf = this.createNoiseBuffer(1.1);
      if (hissBuf) {
        hissNoise.buffer = hissBuf;
        const bpFilter = this.ctx.createBiquadFilter();
        bpFilter.type = 'bandpass';
        bpFilter.frequency.setValueAtTime(120, now);
        bpFilter.Q.setValueAtTime(1.0, now);

        const hissGain = this.ctx.createGain();
        hissGain.gain.setValueAtTime(0.6, now);
        hissGain.gain.exponentialRampToValueAtTime(0.01, now + 1.1);

        hissNoise.connect(bpFilter);
        bpFilter.connect(hissGain);
        hissGain.connect(this.masterGain);
        hissNoise.start(now);
      }

      roarGain.gain.setValueAtTime(1.1, now);
      roarGain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
      roarOsc.connect(lowFilter);
      lowFilter.connect(roarGain);
      roarGain.connect(this.masterGain);
      roarOsc.start(now);
      roarOsc.stop(now + 1.2);

      // Layer C: Foley (Slamming a damp sandbag onto concrete - low heavy impact)
      const impactOsc = this.ctx.createOscillator();
      const impactGain = this.ctx.createGain();
      impactOsc.type = 'triangle';
      impactOsc.frequency.setValueAtTime(65, now);
      impactOsc.frequency.exponentialRampToValueAtTime(20, now + 0.35);

      impactGain.gain.setValueAtTime(1.5, now);
      impactGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      impactOsc.connect(impactGain);
      impactGain.connect(this.masterGain);
      impactOsc.start(now);
      impactOsc.stop(now + 0.35);

    } else if (activeType === 'jockey') {
      // 5. JOCKEY (9 TENTACLES) - Throat clicking, gargling water, Camel gurgle, wet macaroni tentacle sloshing
      
      // Layer A: Human throat clicking & water gargling
      const gargleOsc = this.ctx.createOscillator();
      const gargleGain = this.ctx.createGain();
      gargleOsc.type = 'sine';
      gargleOsc.frequency.setValueAtTime(320, now);

      // Modulation representing fast bubbling gargling water
      const bubbleLFO = this.ctx.createOscillator();
      const bubbleGain = this.ctx.createGain();
      bubbleLFO.type = 'sine';
      bubbleLFO.frequency.setValueAtTime(42, now); // LFO rate 42Hz for fast gargling
      bubbleGain.gain.setValueAtTime(140, now);
      bubbleLFO.connect(bubbleGain);
      bubbleGain.connect(gargleOsc.frequency);
      
      bubbleLFO.start(now);
      bubbleLFO.stop(now + 0.85);

      gargleGain.gain.setValueAtTime(0.45, now);
      gargleGain.gain.exponentialRampToValueAtTime(0.01, now + 0.85);
      gargleOsc.connect(gargleGain);
      gargleGain.connect(this.masterGain);
      gargleOsc.start(now);
      gargleOsc.stop(now + 0.85);

      // Layer B: Animal (Camel gurgling / Elephant trunk spluttering)
      const camelNoise = this.ctx.createBufferSource();
      const camelBuf = this.createNoiseBuffer(0.8);
      if (camelBuf) {
        camelNoise.buffer = camelBuf;
        
        // Sweep filter representing Camel splutter
        const camelFilter = this.ctx.createBiquadFilter();
        camelFilter.type = 'bandpass';
        camelFilter.frequency.setValueAtTime(250, now);
        camelFilter.frequency.exponentialRampToValueAtTime(550, now + 0.7);
        camelFilter.Q.setValueAtTime(3.0, now);

        const camelGain = this.ctx.createGain();
        camelGain.gain.setValueAtTime(0.65, now);
        camelGain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

        camelNoise.connect(camelFilter);
        camelFilter.connect(camelGain);
        camelGain.connect(this.masterGain);
        camelNoise.start(now);
      }

      // Layer C: Foley (Sloshing a large bowl of cold macaroni - dragging wet leather belt whipping tentacle sound)
      [0.1, 0.25, 0.4, 0.55].forEach((delay) => {
        const whipNoise = this.ctx!.createBufferSource();
        const whipBuf = this.createNoiseBuffer(0.12);
        if (whipBuf) {
          whipNoise.buffer = whipBuf;
          const bandpass = this.ctx!.createBiquadFilter();
          bandpass.type = 'bandpass';
          bandpass.frequency.setValueAtTime(1100, now + delay);
          
          const whipGain = this.ctx!.createGain();
          whipGain.gain.setValueAtTime(0.4, now + delay);
          whipGain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.1);

          whipNoise.connect(bandpass);
          bandpass.connect(whipGain);
          whipGain.connect(this.masterGain!);
          whipNoise.start(now + delay);
        }
      });

    } else if (activeType === 'witch_crying') {
      // 6A. CRYING WITCH (CRYING STATE) - Sorrowful weeping, human sobbing, Barn Owl shivering whines
      
      // Layer A: Sorrowful weeping human sobbing hyperventilating
      [0, 0.25, 0.5, 0.75].forEach((delay) => {
        const sobOsc = this.ctx!.createOscillator();
        const sobGain = this.ctx!.createGain();
        sobOsc.type = 'sine';
        sobOsc.frequency.setValueAtTime(540, now + delay);
        sobOsc.frequency.linearRampToValueAtTime(450, now + delay + 0.2);

        // Breath envelope
        sobGain.gain.setValueAtTime(0.01, now + delay);
        sobGain.gain.linearRampToValueAtTime(0.2, now + delay + 0.08);
        sobGain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.2);

        sobOsc.connect(sobGain);
        sobGain.connect(this.masterGain!);
        sobOsc.start(now + delay);
        sobOsc.stop(now + delay + 0.2);
      });

      // Layer B: Animal (Barn Owl shivering low whine / Cougar weeping)
      const owlOsc = this.ctx.createOscillator();
      const owlGain = this.ctx.createGain();
      owlOsc.type = 'sine';
      owlOsc.frequency.setValueAtTime(780, now);
      owlOsc.frequency.linearRampToValueAtTime(680, now + 0.95);

      // Tremolo representing shivering cry
      const tremolo = this.ctx.createOscillator();
      const tremoloGain = this.ctx.createGain();
      tremolo.frequency.setValueAtTime(8, now); // 8Hz shivering oscillations
      tremoloGain.gain.setValueAtTime(0.08, now);
      tremolo.connect(tremoloGain);
      tremoloGain.connect(owlGain.gain);
      tremolo.start(now);
      tremolo.stop(now + 0.95);

      owlGain.gain.setValueAtTime(0.12, now);
      owlGain.gain.exponentialRampToValueAtTime(0.001, now + 0.95);
      owlOsc.connect(owlGain);
      owlGain.connect(this.masterGain);
      owlOsc.start(now);
      owlOsc.stop(now + 0.95);

    } else if (activeType === 'witch_scream') {
      // 6B. CRYING WITCH (SCREAM STATE) - Blood-curdling screams, Cougar/Mountain Lion screams, Fork scratching chalkboard
      
      // Layer A: Blood-curdling human scream (abrupt ear-piercing shrieks)
      const screamOsc1 = this.ctx.createOscillator();
      const screamOsc2 = this.ctx.createOscillator();
      const screamGain = this.ctx.createGain();

      screamOsc1.type = 'sawtooth';
      screamOsc2.type = 'square';

      screamOsc1.frequency.setValueAtTime(750, now);
      screamOsc1.frequency.linearRampToValueAtTime(1650, now + 0.18);
      screamOsc1.frequency.linearRampToValueAtTime(1100, now + 1.4);

      screamOsc2.frequency.setValueAtTime(760, now);
      screamOsc2.frequency.linearRampToValueAtTime(1700, now + 0.18);

      screamGain.gain.setValueAtTime(1.1, now);
      screamGain.gain.exponentialRampToValueAtTime(0.01, now + 1.4);

      screamOsc1.connect(screamGain);
      screamOsc2.connect(screamGain);
      screamGain.connect(this.masterGain);

      screamOsc1.start(now);
      screamOsc2.start(now);
      screamOsc1.stop(now + 1.4);
      screamOsc2.stop(now + 1.4);

      // Layer B: Animal (Cougar/Mountain Lion shriek - sounds exactly like a terrified human screaming in the woods)
      const cougarOsc = this.ctx.createOscillator();
      const cougarGain = this.ctx.createGain();
      cougarOsc.type = 'sawtooth';
      cougarOsc.frequency.setValueAtTime(950, now);
      cougarOsc.frequency.exponentialRampToValueAtTime(650, now + 1.15); // pitch-bend slide

      // Violent vibrato
      const cougarVib = this.ctx.createOscillator();
      const cougarVibG = this.ctx.createGain();
      cougarVib.frequency.setValueAtTime(18, now);
      cougarVibG.gain.setValueAtTime(90, now);
      cougarVib.connect(cougarVibG);
      cougarVibG.connect(cougarOsc.frequency);
      cougarVib.start(now);
      cougarVib.stop(now + 1.15);

      cougarGain.gain.setValueAtTime(0.6, now);
      cougarGain.gain.exponentialRampToValueAtTime(0.01, now + 1.15);
      cougarOsc.connect(cougarGain);
      cougarGain.connect(this.masterGain);
      cougarOsc.start(now);
      cougarOsc.stop(now + 1.15);

      // Layer C: Foley (Scraping long metal forks/nails across chalkboard blended into claw attacks)
      const forkOsc = this.ctx.createOscillator();
      const forkGain = this.ctx.createGain();
      forkOsc.type = 'sine';
      forkOsc.frequency.setValueAtTime(3400, now); // extremely high piercing 3400Hz

      // Add highpassed noise for chalkboard friction grit
      const frictionNoise = this.ctx.createBufferSource();
      const frictionBuf = this.createNoiseBuffer(0.9);
      if (frictionBuf) {
        frictionNoise.buffer = frictionBuf;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(4500, now);

        const noiseG = this.ctx.createGain();
        noiseG.gain.setValueAtTime(0.4, now);
        noiseG.gain.exponentialRampToValueAtTime(0.01, now + 0.9);

        frictionNoise.connect(filter);
        filter.connect(noiseG);
        noiseG.connect(this.masterGain);
        frictionNoise.start(now);
      }

      forkGain.gain.setValueAtTime(0.3, now);
      forkGain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
      forkOsc.connect(forkGain);
      forkGain.connect(this.masterGain);
      forkOsc.start(now);
      forkOsc.stop(now + 1.0);

    } else if (activeType === 'cloud_creature') {
      // 7. CLOUD CREATURE - Whispering wind, Leopard raspy inhale, untuned analog TV/radio white noise static
      
      // Layer A: Microphone wind (blowing air directly across mic capsule simulating heavy wind)
      const windNoise = this.ctx.createBufferSource();
      const windBuf = this.createNoiseBuffer(1.4);
      if (windBuf) {
        windNoise.buffer = windBuf;
        
        // Low bandpass sweeping representing shifting heavy wind currents
        const bpFilter = this.ctx.createBiquadFilter();
        bpFilter.type = 'bandpass';
        bpFilter.frequency.setValueAtTime(140, now);
        bpFilter.frequency.linearRampToValueAtTime(320, now + 1.4);
        bpFilter.Q.setValueAtTime(1.5, now);

        const windGain = this.ctx.createGain();
        
        // Slow LFO for howling intensity surges
        const surgeLFO = this.ctx.createOscillator();
        const surgeG = this.ctx.createGain();
        surgeLFO.type = 'sine';
        surgeLFO.frequency.setValueAtTime(0.5, now); // slow 0.5Hz howl
        surgeG.gain.setValueAtTime(0.15, now);
        surgeLFO.connect(surgeG);
        surgeG.connect(windGain.gain);
        
        surgeLFO.start(now);
        surgeLFO.stop(now + 1.4);

        windGain.gain.setValueAtTime(0.65, now);
        windGain.gain.exponentialRampToValueAtTime(0.01, now + 1.4);

        windNoise.connect(bpFilter);
        bpFilter.connect(windGain);
        windGain.connect(this.masterGain);
        windNoise.start(now);
      }

      // Layer B: Animal (Leopard's raspy breath/inhale and Snake hisses)
      const hissNoise = this.ctx.createBufferSource();
      const hissBuf = this.createNoiseBuffer(1.0);
      if (hissBuf) {
        hissNoise.buffer = hissBuf;
        const hpFilter = this.ctx.createBiquadFilter();
        hpFilter.type = 'highpass';
        hpFilter.frequency.setValueAtTime(3800, now);

        const hissGain = this.ctx.createGain();
        hissGain.gain.setValueAtTime(0.45, now);
        hissGain.gain.exponentialRampToValueAtTime(0.01, now + 1.0);

        hissNoise.connect(hpFilter);
        hpFilter.connect(hissGain);
        hissGain.connect(this.masterGain);
        hissNoise.start(now);
      }

      // Layer C: Foley (Untuned analog radio white noise & TV static friction)
      const staticNoise = this.ctx.createBufferSource();
      const staticBuf = this.createNoiseBuffer(0.9);
      if (staticBuf) {
        staticNoise.buffer = staticBuf;
        
        // Screechy static filter
        const staticFilter = this.ctx.createBiquadFilter();
        staticFilter.type = 'bandpass';
        staticFilter.frequency.setValueAtTime(6500, now);
        staticFilter.Q.setValueAtTime(6, now);

        const staticGain = this.ctx.createGain();
        
        // Crackly grain modulation
        const crackleLFO = this.ctx.createOscillator();
        const crackleGain = this.ctx.createGain();
        crackleLFO.type = 'square';
        crackleLFO.frequency.setValueAtTime(25, now); // crackly 25Hz gating
        crackleGain.gain.setValueAtTime(0.18, now);
        crackleLFO.connect(crackleGain);
        crackleGain.connect(staticGain.gain);
        
        crackleLFO.start(now);
        crackleLFO.stop(now + 0.9);

        staticGain.gain.setValueAtTime(0.35, now);
        staticGain.gain.exponentialRampToValueAtTime(0.01, now + 0.9);

        staticNoise.connect(staticFilter);
        staticFilter.connect(staticGain);
        staticGain.connect(this.masterGain);
        staticNoise.start(now);
      }

    } else if (activeType === 'phantom') {
      // 8. FLYING PHANTOM - Tongue bat clicking, Hawk screams & Dolphin trill, heavy leather jacket tattered wing flaps
      
      // Layer A: Bat sonar echolocation (sharp tongue clicking)
      [0, 0.12, 0.24, 0.36, 0.48].forEach((delay) => {
        const clickOsc = this.ctx!.createOscillator();
        const clickGain = this.ctx!.createGain();
        clickOsc.type = 'sine';
        clickOsc.frequency.setValueAtTime(4200, now + delay); // ultra high pitch click

        clickGain.gain.setValueAtTime(0.3, now + delay);
        clickGain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.005); // extremely brief 5ms click

        clickOsc.connect(clickGain);
        clickGain.connect(this.masterGain!);
        clickOsc.start(now + delay);
        clickOsc.stop(now + delay + 0.005);
      });

      // Layer B: Animal (Hawk/Eagle screams pitched down paired with Dolphin trill)
      const hawkOsc = this.ctx.createOscillator();
      const hawkGain = this.ctx.createGain();
      hawkOsc.type = 'sawtooth';
      hawkOsc.frequency.setValueAtTime(1400, now);
      hawkOsc.frequency.exponentialRampToValueAtTime(550, now + 0.6); // pitched down shriek

      // Dolphin trill pitch vibrato
      const trillLFO = this.ctx.createOscillator();
      const trillGain = this.ctx.createGain();
      trillLFO.type = 'sine';
      trillLFO.frequency.setValueAtTime(45, now); // high rate trill 45Hz
      trillGain.gain.setValueAtTime(160, now);
      trillLFO.connect(trillGain);
      trillGain.connect(hawkOsc.frequency);
      
      trillLFO.start(now);
      trillLFO.stop(now + 0.6);

      hawkGain.gain.setValueAtTime(0.55, now);
      hawkGain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      hawkOsc.connect(hawkGain);
      hawkGain.connect(this.masterGain);
      hawkOsc.start(now);
      hawkOsc.stop(now + 0.6);

      // Layer C: Foley (Violently snapping a tattered leathery wing - giant air-pushing thuds)
      const flapNoise = this.ctx.createBufferSource();
      const flapBuf = this.createNoiseBuffer(0.4);
      if (flapBuf) {
        flapNoise.buffer = flapBuf;
        const lowpass = this.ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.setValueAtTime(140, now); // low tattered thud

        const flapGain = this.ctx.createGain();
        flapGain.gain.setValueAtTime(1.1, now);
        flapGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

        flapNoise.connect(lowpass);
        lowpass.connect(flapGain);
        flapGain.connect(this.masterGain);
        flapNoise.start(now);
      }
    }
  }

  // --- TANK ENGINE SOUND ---
  public playTankEngineRumble() {
    this.init();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(42, now);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(150, now);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.5);
  }

  public playExplosion() {
    this.init();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(10, now + 1.2);
    gain.gain.setValueAtTime(1.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    const noise = this.ctx.createBufferSource();
    const buf = this.createNoiseBuffer(1.2);
    if (buf) {
      noise.buffer = buf;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(1.4, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.masterGain);
      noise.start(now);
    }

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 1.2);
  }
}

export const soundEngine = new SoundEngine();

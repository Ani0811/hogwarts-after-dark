/**
 * Procedural Web Audio Soundscape & Spell Synthesizer for Hogwarts After Dark.
 * Uses native Web Audio API — 100% zero external sound files or network dependencies.
 */

class ProceduralSoundscape {
  private ctx: AudioContext | null = null
  private ambientGain: GainNode | null = null
  private sfxGain: GainNode | null = null
  private masterGain: GainNode | null = null
  private ambientOsc1: OscillatorNode | null = null
  private ambientOsc2: OscillatorNode | null = null
  private isMuted: boolean = false
  private volume: number = 0.6
  private isAmbientPlaying: boolean = false

  constructor() {
    // Read saved preferences
    try {
      const savedMute = localStorage.getItem('had_sound_muted')
      if (savedMute !== null) {
        this.isMuted = savedMute === 'true'
      }
      const savedVol = localStorage.getItem('had_sound_vol')
      if (savedVol !== null) {
        this.volume = parseFloat(savedVol) || 0.6
      }
    } catch {
      // localStorage may be unavailable in some sandboxes
    }
  }

  /**
   * Initializes AudioContext on user gesture to comply with browser autoplay policies.
   */
  private initContext(): AudioContext | null {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!AudioCtx) return null
      this.ctx = new AudioCtx()

      // Master Gain
      this.masterGain = this.ctx.createGain()
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime)
      this.masterGain.connect(this.ctx.destination)

      // SFX Gain
      this.sfxGain = this.ctx.createGain()
      this.sfxGain.gain.setValueAtTime(0.85, this.ctx.currentTime)
      this.sfxGain.connect(this.masterGain)

      // Ambient Gain
      this.ambientGain = this.ctx.createGain()
      this.ambientGain.gain.setValueAtTime(0.18, this.ctx.currentTime)
      this.ambientGain.connect(this.masterGain)
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }

    return this.ctx
  }

  public getIsMuted(): boolean {
    return this.isMuted
  }

  public getVolume(): number {
    return this.volume
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted
    try {
      localStorage.setItem('had_sound_muted', String(this.isMuted))
    } catch {}

    if (this.masterGain && this.ctx) {
      const targetGain = this.isMuted ? 0 : this.volume
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime)
      this.masterGain.gain.linearRampToValueAtTime(targetGain, this.ctx.currentTime + 0.15)
    }

    if (!this.isMuted && !this.isAmbientPlaying) {
      this.startAmbient()
    }

    return this.isMuted
  }

  public setVolume(val: number): void {
    this.volume = Math.max(0, Math.min(1, val))
    try {
      localStorage.setItem('had_sound_vol', String(this.volume))
    } catch {}

    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime)
      this.masterGain.gain.linearRampToValueAtTime(this.volume, this.ctx.currentTime + 0.05)
    }
  }

  /**
   * Starts a continuous, subtle atmospheric nocturnal drone (castle wind + low resonance).
   */
  public startAmbient(): void {
    if (this.isAmbientPlaying) return
    const ctx = this.initContext()
    if (!ctx || !this.ambientGain) return

    try {
      // Low drone (F#1 ~ 46.25 Hz)
      this.ambientOsc1 = ctx.createOscillator()
      this.ambientOsc1.type = 'sine'
      this.ambientOsc1.frequency.setValueAtTime(46.25, ctx.currentTime)

      // Sub-harmonic drone (C#2 ~ 69.3 Hz)
      this.ambientOsc2 = ctx.createOscillator()
      this.ambientOsc2.type = 'triangle'
      this.ambientOsc2.frequency.setValueAtTime(69.3, ctx.currentTime)

      // Filter for warm nocturnal resonance
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(140, ctx.currentTime)

      // Subtle LFO modulation for breathing wind effect
      const lfo = ctx.createOscillator()
      const lfoGain = ctx.createGain()
      lfo.type = 'sine'
      lfo.frequency.setValueAtTime(0.08, ctx.currentTime) // 12-second cycle
      lfoGain.gain.setValueAtTime(40, ctx.currentTime)
      lfo.connect(filter.frequency)
      lfo.start()

      this.ambientOsc1.connect(filter)
      this.ambientOsc2.connect(filter)
      filter.connect(this.ambientGain)

      this.ambientOsc1.start()
      this.ambientOsc2.start()
      this.isAmbientPlaying = true
    } catch {
      // Ignore audio start errors if restricted by browser
    }
  }

  // ==========================================
  // SPELLCASTING SOUND SYNTHESIS
  // ==========================================

  /**
   * Lumos Maxima: Brilliant warm harmonic chime with expanding high-frequency glow.
   */
  public playLumos(): void {
    const ctx = this.initContext()
    if (!ctx || !this.sfxGain || this.isMuted) return

    const now = ctx.currentTime
    const notes = [261.63, 392.00, 523.25, 659.25, 1046.50] // C4, G4, C5, E5, C6

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const noteGain = ctx.createGain()
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle'
      osc.frequency.setValueAtTime(freq, now + idx * 0.08)

      noteGain.gain.setValueAtTime(0, now)
      noteGain.gain.linearRampToValueAtTime(0.18 / (idx + 1), now + idx * 0.08 + 0.04)
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 1.2)

      osc.connect(noteGain)
      noteGain.connect(this.sfxGain!)
      osc.start(now + idx * 0.08)
      osc.stop(now + idx * 0.08 + 1.25)
    })
  }

  /**
   * Revelio: Crystalline pentatonic shimmer sweep, revealing hidden anomalies.
   */
  public playRevelio(): void {
    const ctx = this.initContext()
    if (!ctx || !this.sfxGain || this.isMuted) return

    const now = ctx.currentTime
    const freqs = [587.33, 739.99, 880.00, 1174.66, 1479.98, 1760.00] // D5, F#5, A5, D6, F#6, A6

    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + i * 0.05)

      g.gain.setValueAtTime(0, now + i * 0.05)
      g.gain.linearRampToValueAtTime(0.14, now + i * 0.05 + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.05 + 0.9)

      osc.connect(g)
      g.connect(this.sfxGain!)
      osc.start(now + i * 0.05)
      osc.stop(now + i * 0.05 + 0.95)
    })
  }

  /**
   * Specialis Revelio: Arcane harmonic arpeggio with high-pass sweeping filter.
   */
  public playSpecialisRevelio(): void {
    const ctx = this.initContext()
    if (!ctx || !this.sfxGain || this.isMuted) return

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const filter = ctx.createBiquadFilter()
    const g = ctx.createGain()

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(220, now) // A3
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.5) // Sweep to A5

    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(300, now)
    filter.frequency.exponentialRampToValueAtTime(2400, now + 0.6)
    filter.Q.setValueAtTime(8, now)

    g.gain.setValueAtTime(0, now)
    g.gain.linearRampToValueAtTime(0.2, now + 0.08)
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.9)

    osc.connect(filter)
    filter.connect(g)
    g.connect(this.sfxGain!)

    osc.start(now)
    osc.stop(now + 0.95)
  }

  /**
   * Memoria Vestigium: Deep time-dilation pitch drop with ethereal echo.
   */
  public playMemoriaVestigium(): void {
    const ctx = this.initContext()
    if (!ctx || !this.sfxGain || this.isMuted) return

    const now = ctx.currentTime

    // Main low pitch dive
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(440, now)
    osc.frequency.exponentialRampToValueAtTime(73.42, now + 0.8) // Down to D2

    g.gain.setValueAtTime(0, now)
    g.gain.linearRampToValueAtTime(0.25, now + 0.05)
    g.gain.exponentialRampToValueAtTime(0.0001, now + 1.4)

    osc.connect(g)
    g.connect(this.sfxGain!)
    osc.start(now)
    osc.stop(now + 1.45)
  }

  // ==========================================
  // TACTICAL UI & FORENSIC FEEDBACK
  // ==========================================

  /**
   * Parchment Page Turn / Document Rustle: Filtered burst of noise.
   */
  public playParchment(): void {
    const ctx = this.initContext()
    if (!ctx || !this.sfxGain || this.isMuted) return

    const now = ctx.currentTime
    const bufferSize = ctx.sampleRate * 0.12 // 120ms
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35))
    }

    const noise = ctx.createBufferSource()
    noise.buffer = buffer

    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(1200, now)
    filter.Q.setValueAtTime(1.8, now)

    const g = ctx.createGain()
    g.gain.setValueAtTime(0.12, now)
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.12)

    noise.connect(filter)
    filter.connect(g)
    g.connect(this.sfxGain!)
    noise.start(now)
  }

  /**
   * Spectrum Shift: High-frequency electrical resonance hum when switching light modes.
   */
  public playSpectrumShift(): void {
    const ctx = this.initContext()
    if (!ctx || !this.sfxGain || this.isMuted) return

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const g = ctx.createGain()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(1200, now)
    osc.frequency.linearRampToValueAtTime(600, now + 0.14)

    g.gain.setValueAtTime(0.1, now)
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.15)

    osc.connect(g)
    g.connect(this.sfxGain!)
    osc.start(now)
    osc.stop(now + 0.16)
  }

  /**
   * Clue Discovered: Harmonic chord progression signaling an investigation breakthrough.
   */
  public playClueDiscovered(): void {
    const ctx = this.initContext()
    if (!ctx || !this.sfxGain || this.isMuted) return

    const now = ctx.currentTime
    const notes = [329.63, 493.88, 659.25, 987.77] // E4, B4, E5, B5

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + i * 0.04)

      g.gain.setValueAtTime(0, now + i * 0.04)
      g.gain.linearRampToValueAtTime(0.15, now + i * 0.04 + 0.03)
      g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.04 + 1.1)

      osc.connect(g)
      g.connect(this.sfxGain!)
      osc.start(now + i * 0.04)
      osc.stop(now + i * 0.04 + 1.15)
    })
  }

  /**
   * Grand Inquest Victory Fanfare.
   */
  public playVerdictVictory(): void {
    const ctx = this.initContext()
    if (!ctx || !this.sfxGain || this.isMuted) return

    const now = ctx.currentTime
    const chord = [261.63, 329.63, 392.00, 523.25, 659.25] // C Major triumphant

    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, now + idx * 0.07)

      g.gain.setValueAtTime(0, now + idx * 0.07)
      g.gain.linearRampToValueAtTime(0.2, now + idx * 0.07 + 0.05)
      g.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.07 + 2.5)

      osc.connect(g)
      g.connect(this.sfxGain!)
      osc.start(now + idx * 0.07)
      osc.stop(now + idx * 0.07 + 2.6)
    })
  }

  /**
   * Verdict Rejection Gong.
   */
  public playVerdictFailure(): void {
    const ctx = this.initContext()
    if (!ctx || !this.sfxGain || this.isMuted) return

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(110, now) // A2
    osc.frequency.exponentialRampToValueAtTime(55, now + 1.2)

    g.gain.setValueAtTime(0.22, now)
    g.gain.exponentialRampToValueAtTime(0.0001, now + 1.3)

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(320, now)

    osc.connect(filter)
    filter.connect(g)
    g.connect(this.sfxGain!)
    osc.start(now)
    osc.stop(now + 1.35)
  }
}

export const soundscape = new ProceduralSoundscape()


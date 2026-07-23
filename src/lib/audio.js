// Web Audio API procedural sound engine — zero external audio files.
let ctx = null
let droneGain = null
let osc1 = null
let osc2 = null
let filter = null
let isMuted = true

export function initAudio() {
  if (ctx) return
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    ctx = new AudioCtx()

    // Master drone gain
    droneGain = ctx.createGain()
    droneGain.gain.setValueAtTime(0, ctx.currentTime)

    // Lowpass filter for deep space drone
    filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(140, ctx.currentTime)

    // Deep twin oscillators
    osc1 = ctx.createOscillator()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(55, ctx.currentTime) // A1 note

    osc2 = ctx.createOscillator()
    osc2.type = 'triangle'
    osc2.frequency.setValueAtTime(110.5, ctx.currentTime) // A2 with subtle detune

    osc1.connect(filter)
    osc2.connect(filter)
    filter.connect(droneGain)
    droneGain.connect(ctx.destination)

    osc1.start()
    osc2.start()
  } catch (e) {
    console.warn('Web Audio not supported', e)
  }
}

export function toggleAudio() {
  initAudio()
  if (!ctx) return false

  if (ctx.state === 'suspended') {
    ctx.resume()
  }

  isMuted = !isMuted
  if (droneGain) {
    const targetGain = isMuted ? 0 : 0.18
    droneGain.gain.setTargetAtTime(targetGain, ctx.currentTime, 0.3)
  }

  if (!isMuted) {
    playClick(880, 0.05)
  }
  return !isMuted
}

export function getAudioState() {
  return !isMuted
}

export function playClick(freq = 600, duration = 0.04) {
  if (!ctx || isMuted) return
  try {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, ctx.currentTime + duration)

    gain.gain.setValueAtTime(0.08, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start()
    osc.stop(ctx.currentTime + duration)
  } catch (e) { }
}

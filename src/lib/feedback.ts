// Playful feedback (Slice 8, DESIGN §11): synthesized SFX + haptics, gated by the
// settings store (on by default + toggle). Sounds are generated with the Web Audio
// API — no audio assets to ship or cache, so they work fully offline. Haptics use
// navigator.vibrate where available (Android/Chrome; iOS Safari ignores it silently).

import { useSettingsStore } from '@/stores/settings'

let ctx: AudioContext | null = null

/** Lazily create / resume the shared AudioContext (allowed: answering is a gesture). */
function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  if (!ctx) ctx = new Ctor()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

/** One short synthesized note. */
function note(
  ac: AudioContext,
  freq: number,
  start: number,
  dur: number,
  type: OscillatorType = 'sine',
  peak = 0.22,
) {
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, start)
  // Quick attack, smooth exponential decay — a clean, non-harsh blip.
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur)
  osc.connect(gain).connect(ac.destination)
  osc.start(start)
  osc.stop(start + dur + 0.02)
}

function vibrate(pattern: number | number[]) {
  if (!useSettingsStore().haptics) return
  try {
    navigator.vibrate?.(pattern)
  } catch {
    // unsupported — ignore
  }
}

function play(build: (ac: AudioContext, t0: number) => void) {
  if (!useSettingsStore().sound) return
  const ac = audio()
  if (!ac) return
  build(ac, ac.currentTime)
}

/** Correct answer — a bright rising two-note ding. */
export function playCorrect() {
  play((ac, t) => {
    note(ac, 784, t, 0.12) // G5
    note(ac, 1046, t + 0.09, 0.16) // C6
  })
  vibrate(18)
}

/** Wrong answer — a short low buzz. */
export function playWrong() {
  play((ac, t) => {
    note(ac, 160, t, 0.22, 'square', 0.16)
  })
  vibrate([35, 40, 35])
}

/** Session complete / milestone — an ascending fanfare arpeggio. */
export function playFanfare() {
  play((ac, t) => {
    const seq = [523, 659, 784, 1046] // C5 E5 G5 C6
    seq.forEach((f, i) => note(ac, f, t + i * 0.11, 0.22, 'triangle', 0.2))
  })
  vibrate([20, 40, 20, 40, 80])
}

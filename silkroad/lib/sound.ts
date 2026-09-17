/**
 * Tiny WebAudio blips for mascot interactions.
 *
 * Synthesised rather than loaded so there are no audio assets to ship and
 * nothing to download. The context is created lazily on first use, which also
 * keeps us on the right side of browser autoplay policy — every call here
 * happens inside a user gesture.
 */

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!ctx) {
      const Ctor = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    // Browsers suspend the context until a gesture resumes it.
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

interface BlipOptions {
  from: number;
  to: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
}

function blip({ from, to, duration, type = 'sine', gain = 0.09 }: BlipOptions) {
  const ac = audio();
  if (!ac) return;
  const osc = ac.createOscillator();
  const vol = ac.createGain();
  const now = ac.currentTime;

  osc.type = type;
  osc.frequency.setValueAtTime(from, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(to, 1), now + duration);

  vol.gain.setValueAtTime(0.0001, now);
  vol.gain.exponentialRampToValueAtTime(gain, now + duration * 0.16);
  vol.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(vol).connect(ac.destination);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

/** Short rising squeak — the tap reaction. */
export function playOink() {
  blip({ from: 420, to: 780, duration: 0.11, type: 'triangle', gain: 0.07 });
  window.setTimeout(() => blip({ from: 700, to: 330, duration: 0.13, type: 'triangle', gain: 0.055 }), 90);
}

/** Bright two-note chime — a coin landing. */
export function playCoin() {
  blip({ from: 990, to: 1000, duration: 0.09, type: 'square', gain: 0.04 });
  window.setTimeout(() => blip({ from: 1480, to: 1500, duration: 0.16, type: 'square', gain: 0.035 }), 75);
}

/** Soft descending puff — the pig dozing off. */
export function playSnore() {
  blip({ from: 240, to: 120, duration: 0.42, type: 'sine', gain: 0.045 });
}

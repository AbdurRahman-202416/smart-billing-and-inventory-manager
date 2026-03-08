/**
 * Lightweight scan-feedback sounds using the Web Audio API.
 * No external files needed — tones are synthesized at runtime.
 *
 * A single AudioContext is reused across calls to avoid hitting the browser
 * limit on simultaneous AudioContext instances.
 */

let _ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!_ctx || _ctx.state === "closed") {
      _ctx = new (window.AudioContext ||
        // Safari fallback
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
    }
    // Some browsers suspend the context until a user gesture occurs.
    // By the time a scan fires the user has already granted camera access,
    // so resume() is usually a no-op, but it's still good practice.
    if (_ctx.state === "suspended") _ctx.resume();
    return _ctx;
  } catch {
    return null;
  }
}

/**
 * Schedule a single tone on an existing AudioContext.
 */
function scheduleTone(
  ctx: AudioContext,
  frequency: number,
  startAt: number,
  duration: number,
  type: OscillatorType,
  volume: number
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, startAt);

  // Smooth attack / release to avoid clicks
  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(volume, startAt + 0.008);
  gain.gain.setValueAtTime(volume, startAt + duration - 0.025);
  gain.gain.linearRampToValueAtTime(0, startAt + duration);

  osc.start(startAt);
  osc.stop(startAt + duration);
}

/**
 * Success beep — two ascending sine tones (classic barcode-scanner sound).
 */
export function playScanSuccess(): void {
  const ctx = getCtx();
  if (!ctx) return;

  const t = ctx.currentTime;
  scheduleTone(ctx, 1200, t,        0.07,  "sine",   0.40);
  scheduleTone(ctx, 1800, t + 0.09, 0.13,  "sine",   0.35);
}

/**
 * Error buzz — two descending square-wave pulses.
 */
export function playScanError(): void {
  const ctx = getCtx();
  if (!ctx) return;

  const t = ctx.currentTime;
  scheduleTone(ctx, 520, t,        0.12, "square", 0.14);
  scheduleTone(ctx, 360, t + 0.16, 0.18, "square", 0.11);
}

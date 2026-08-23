let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(freq: number, duration: number, type: OscillatorType, gain = 0.12, delay = 0) {
  const ac = audio();
  if (!ac) return;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  const t0 = ac.currentTime + delay;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

export type SoundName = "place" | "move" | "capture" | "invalid" | "win" | "lose";

export function playSound(name: SoundName, muted: boolean) {
  if (muted) return;
  switch (name) {
    case "place":
      tone(520, 0.12, "sine");
      break;
    case "move":
      tone(360, 0.1, "triangle", 0.09);
      break;
    case "capture":
      tone(180, 0.22, "sawtooth", 0.1);
      tone(110, 0.3, "square", 0.06, 0.05);
      break;
    case "invalid":
      tone(140, 0.16, "square", 0.07);
      break;
    case "win":
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, "sine", 0.11, i * 0.1));
      break;
    case "lose":
      [440, 349, 262].forEach((f, i) => tone(f, 0.28, "triangle", 0.1, i * 0.12));
      break;
  }
}

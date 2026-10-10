import type { Side } from "@/lib/game/engine";

type Props = {
  winner: Side;
  seed: number;
  count?: number;
};

const COLORS = ["var(--a1)", "#10b981", "#f59e0b", "#e7e5e4", "var(--a2)", "#38bdf8"];

/** Deterministic CSS confetti — no randomness, so SSR and client agree. */
export function Confetti({ winner, seed, count = 36 }: Props) {
  void winner;
  const pieces = Array.from({ length: count }, (_, i) => {
    const left = (i * 53 + seed * 17) % 100;
    const duration = 2.6 + ((i * 7 + seed * 3) % 20) / 10;
    const delay = ((i * 13 + seed * 5) % 24) / 10;
    const size = 6 + ((i * 11 + seed) % 7);
    const color = COLORS[(i + seed) % COLORS.length];
    const round = (i + seed) % 3 === 0;
    return { left, duration, delay, size, color, round };
  });

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {pieces.map((pc, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: `${pc.left}%`,
            width: pc.size,
            height: pc.round ? pc.size : pc.size * 0.55,
            backgroundColor: pc.color,
            borderRadius: pc.round ? "50%" : 2,
            animationDuration: `${pc.duration}s`,
            animationDelay: `${pc.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

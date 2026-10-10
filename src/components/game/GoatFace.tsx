// Realistic goat face — the single goat look used by every goat piece,
// the turn pill, the scoreboard and the victory card.
export function GoatFaceArt() {
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      {/* Horns */}
      <path
        d="M -7 -8 C -16 -11 -20 -21 -14 -29 C -12 -31 -9.5 -30 -9.5 -28 C -13 -23 -12 -16 -5 -12 Z"
        fill="#d6d3d1"
        stroke="#57534e"
        strokeWidth={1.4}
      />
      <path
        d="M 7 -8 C 16 -11 20 -21 14 -29 C 12 -31 9.5 -30 9.5 -28 C 13 -23 12 -16 5 -12 Z"
        fill="#d6d3d1"
        stroke="#57534e"
        strokeWidth={1.4}
      />
      <path
        d="M -15.5 -22 L -10.5 -20 M -16.5 -18 L -11 -16 M -16 -13.5 L -11 -12"
        stroke="#78716c"
        strokeWidth={1.2}
      />
      <path
        d="M 15.5 -22 L 10.5 -20 M 16.5 -18 L 11 -16 M 16 -13.5 L 11 -12"
        stroke="#78716c"
        strokeWidth={1.2}
      />
      {/* Ears */}
      <path
        d="M -11 1 L -23 4 L -21 10 L -10 7 Z"
        fill="#e7e5e4"
        stroke="#a8a29e"
        strokeWidth={1.2}
      />
      <path d="M 11 1 L 23 4 L 21 10 L 10 7 Z" fill="#e7e5e4" stroke="#a8a29e" strokeWidth={1.2} />
      <path d="M -12.5 4 L -20 6 M 12.5 4 L 20 6" stroke="#d6d3d1" strokeWidth={1.2} />
      {/* Head */}
      <ellipse
        cx={0}
        cy={2}
        rx={10.5}
        ry={12.5}
        fill="#fafaf9"
        stroke="#a8a29e"
        strokeWidth={1.5}
      />
      <ellipse cx={-7} cy={4} rx={3} ry={8} fill="#e7e5e4" stroke="none" opacity={0.7} />
      <ellipse cx={7} cy={4} rx={3} ry={8} fill="#e7e5e4" stroke="none" opacity={0.7} />
      <ellipse cx={0} cy={-5} rx={6} ry={4} fill="#ffffff" stroke="none" opacity={0.9} />
      {/* Forelock tuft */}
      <path
        d="M -6.5 -8.5 L -3.5 -14 L -0.5 -9 L 2.5 -14 L 6.5 -8.5 Z"
        fill="#f5f5f4"
        stroke="#a8a29e"
        strokeWidth={1}
      />
      {/* Eyes: white, amber iris, horizontal goat pupil */}
      <ellipse cx={-4.8} cy={0} rx={3} ry={2.6} fill="#ffffff" stroke="#57534e" strokeWidth={1} />
      <ellipse cx={4.8} cy={0} rx={3} ry={2.6} fill="#ffffff" stroke="#57534e" strokeWidth={1} />
      <circle cx={-4.8} cy={0} r={1.9} fill="#78350f" stroke="none" />
      <circle cx={4.8} cy={0} r={1.9} fill="#78350f" stroke="none" />
      <rect x={-7.3} y={-0.9} width={5} height={1.8} rx={0.9} fill="#1c1917" stroke="none" />
      <rect x={2.3} y={-0.9} width={5} height={1.8} rx={0.9} fill="#1c1917" stroke="none" />
      <circle cx={-4} cy={-0.8} r={0.6} fill="#ffffff" stroke="none" />
      <circle cx={5.6} cy={-0.8} r={0.6} fill="#ffffff" stroke="none" />
      {/* Nose */}
      <ellipse cx={0} cy={7.5} rx={3.4} ry={2.5} fill="#d6a08e" stroke="#78716c" strokeWidth={1} />
      <circle cx={-1.4} cy={7.5} r={0.55} fill="#57534e" stroke="none" />
      <circle cx={1.4} cy={7.5} r={0.55} fill="#57534e" stroke="none" />
      {/* Mouth + beard */}
      <path d="M -3 11 Q 0 13 3 11" fill="none" stroke="#57534e" strokeWidth={1.4} />
      <path d="M -2.8 12.3 L 0 19.5 L 2.8 12.3 Z" fill="#e7e5e4" stroke="#a8a29e" strokeWidth={1} />
      <path d="M 0 13.5 L 0 18" stroke="#a8a29e" strokeWidth={1} />
    </g>
  );
}

export function GoatFaceMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="-26 -32 52 56"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Goat"
    >
      <GoatFaceArt />
    </svg>
  );
}

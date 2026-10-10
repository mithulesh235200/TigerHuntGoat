// Realistic tiger face — the single tiger look used by every tiger piece,
// the header logo, the turn pill and the victory card.
export function TigerFaceArt() {
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      {/* Ears */}
      <path d="M -19 -8 L -24 -24 L -7 -15 Z" fill="#c2570b" stroke="#7c2d12" strokeWidth={1.6} />
      <path d="M 19 -8 L 24 -24 L 7 -15 Z" fill="#c2570b" stroke="#7c2d12" strokeWidth={1.6} />
      <path d="M -18.5 -11.5 L -21 -20.5 L -10 -15 Z" fill="#fcd9a8" stroke="none" />
      <path d="M 18.5 -11.5 L 21 -20.5 L 10 -15 Z" fill="#fcd9a8" stroke="none" />
      {/* Head base */}
      <circle cx={0} cy={1} r={19} fill="#f59e0b" stroke="#7c2d12" strokeWidth={2} />
      {/* Fur light + shade */}
      <ellipse cx={0} cy={-9} rx={12} ry={7} fill="#fcd34d" stroke="none" opacity={0.45} />
      <ellipse cx={-13.5} cy={8} rx={5.5} ry={9} fill="#d97706" stroke="none" opacity={0.45} />
      <ellipse cx={13.5} cy={8} rx={5.5} ry={9} fill="#d97706" stroke="none" opacity={0.45} />
      {/* White eye patches */}
      <ellipse cx={-7.5} cy={-1} rx={6} ry={4.8} fill="#fff7ed" stroke="none" opacity={0.95} />
      <ellipse cx={7.5} cy={-1} rx={6} ry={4.8} fill="#fff7ed" stroke="none" opacity={0.95} />
      {/* Forehead stripes */}
      <path d="M 0 -18 L 0 -9" stroke="#431407" strokeWidth={3.2} />
      <path d="M -8.5 -16.5 L -4.5 -9.5" stroke="#431407" strokeWidth={3} />
      <path d="M 8.5 -16.5 L 4.5 -9.5" stroke="#431407" strokeWidth={3} />
      <path d="M -14.5 -12 L -9.5 -7.5" stroke="#431407" strokeWidth={2.6} />
      <path d="M 14.5 -12 L 9.5 -7.5" stroke="#431407" strokeWidth={2.6} />
      {/* Cheek stripes */}
      <path d="M -18 -2 L -12 -1" stroke="#431407" strokeWidth={2.8} />
      <path d="M -18.5 5 L -12.5 4" stroke="#431407" strokeWidth={2.8} />
      <path d="M -17 11 L -12 9.5" stroke="#431407" strokeWidth={2.4} />
      <path d="M 18 -2 L 12 -1" stroke="#431407" strokeWidth={2.8} />
      <path d="M 18.5 5 L 12.5 4" stroke="#431407" strokeWidth={2.8} />
      <path d="M 17 11 L 12 9.5" stroke="#431407" strokeWidth={2.4} />
      {/* Eyes: gold iris, round pupil, lid line, catchlight */}
      <ellipse
        cx={-7.5}
        cy={-1}
        rx={3.4}
        ry={3}
        fill="#b45309"
        stroke="#431407"
        strokeWidth={1.2}
      />
      <ellipse cx={7.5} cy={-1} rx={3.4} ry={3} fill="#b45309" stroke="#431407" strokeWidth={1.2} />
      <ellipse cx={-7.5} cy={-1} rx={1.2} ry={2.2} fill="#140b02" stroke="none" />
      <ellipse cx={7.5} cy={-1} rx={1.2} ry={2.2} fill="#140b02" stroke="none" />
      <circle cx={-6.6} cy={-1.9} r={0.8} fill="#ffffff" stroke="none" />
      <circle cx={8.4} cy={-1.9} r={0.8} fill="#ffffff" stroke="none" />
      <path d="M -11.5 -3.2 Q -7.5 -5.5 -3.5 -3.2" fill="none" stroke="#431407" strokeWidth={1.8} />
      <path d="M 3.5 -3.2 Q 7.5 -5.5 11.5 -3.2" fill="none" stroke="#431407" strokeWidth={1.8} />
      {/* Muzzle */}
      <ellipse cx={0} cy={9.5} rx={11.5} ry={7.5} fill="#fff7ed" stroke="none" />
      {/* Nose */}
      <path
        d="M -4.5 5.5 Q 0 4.3 4.5 5.5 L 2.5 9.3 Q 0 10.3 -2.5 9.3 Z"
        fill="#9a3412"
        stroke="#431407"
        strokeWidth={1}
      />
      <circle cx={-2.6} cy={7} r={0.7} fill="#431407" stroke="none" />
      <circle cx={2.6} cy={7} r={0.7} fill="#431407" stroke="none" />
      {/* Mouth */}
      <path
        d="M 0 10 L 0 12.5 M 0 12.5 Q -1.2 14.5 -4.5 14 M 0 12.5 Q 1.2 14.5 4.5 14"
        fill="none"
        stroke="#431407"
        strokeWidth={1.4}
      />
      {/* Whisker spots + whiskers */}
      <circle cx={-7} cy={9} r={0.8} fill="#a8a29e" stroke="none" />
      <circle cx={-9.5} cy={11} r={0.8} fill="#a8a29e" stroke="none" />
      <circle cx={7} cy={9} r={0.8} fill="#a8a29e" stroke="none" />
      <circle cx={9.5} cy={11} r={0.8} fill="#a8a29e" stroke="none" />
      <path
        d="M -10 9.5 L -19 7.5 M -10 11.5 L -19 12.5 M 10 9.5 L 19 7.5 M 10 11.5 L 19 12.5"
        stroke="#ffffff"
        strokeWidth={1}
        opacity={0.9}
      />
    </g>
  );
}

export function TigerFaceMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="-26 -26 52 52"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Tiger"
    >
      <TigerFaceArt />
    </svg>
  );
}

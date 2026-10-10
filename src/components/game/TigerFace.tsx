// Cute flat tiger face — matches the app's chosen tiger look.
// Shared by the board pieces, header logo, turn pill and victory card
// so every tiger in the game is the same face.
export function TigerFaceArt() {
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      {/* Ears */}
      <circle cx={-14} cy={-13} r={8.5} fill="#e06f16" stroke="#8a3d0c" strokeWidth={1.6} />
      <circle cx={14} cy={-13} r={8.5} fill="#e06f16" stroke="#8a3d0c" strokeWidth={1.6} />
      <circle cx={-14} cy={-13} r={4} fill="#f9ad55" stroke="none" />
      <circle cx={14} cy={-13} r={4} fill="#f9ad55" stroke="none" />
      {/* Head */}
      <circle cx={0} cy={2} r={19} fill="#f5851f" stroke="#8a3d0c" strokeWidth={1.8} />
      {/* Forehead stripes */}
      <path d="M 0 -17 L -3.5 -8 L 3.5 -8 Z" fill="#4a2a12" stroke="none" />
      <path d="M -10 -14 L -10 -6 L -5 -9 Z" fill="#4a2a12" stroke="none" />
      <path d="M 10 -14 L 10 -6 L 5 -9 Z" fill="#4a2a12" stroke="none" />
      {/* Cheek stripes */}
      <path d="M -18 -3 L -12 -2" stroke="#4a2a12" strokeWidth={3.4} />
      <path d="M -18 5 L -12 4" stroke="#4a2a12" strokeWidth={3.4} />
      <path d="M 18 -3 L 12 -2" stroke="#4a2a12" strokeWidth={3.4} />
      <path d="M 18 5 L 12 4" stroke="#4a2a12" strokeWidth={3.4} />
      {/* Eyes */}
      <ellipse cx={-7} cy={0} rx={2} ry={3} fill="#3a2312" stroke="none" />
      <ellipse cx={7} cy={0} rx={2} ry={3} fill="#3a2312" stroke="none" />
      {/* Muzzle + chin */}
      <ellipse cx={0} cy={9.5} rx={12} ry={8} fill="#f6f1e8" stroke="none" />
      <ellipse cx={0} cy={14.5} rx={7.5} ry={4.5} fill="#e9e2f2" stroke="none" opacity={0.9} />
      {/* Nose + mouth */}
      <path d="M -3.5 6.5 L 3.5 6.5 L 0 10 Z" fill="#3a2312" stroke="none" />
      <path
        d="M 0 10 L 0 12.5 M 0 12.5 Q -1 14 -4 13.5 M 0 12.5 Q 1 14 4 13.5"
        fill="none"
        stroke="#3a2312"
        strokeWidth={1.3}
      />
      {/* Whisker dots */}
      <circle cx={-7.5} cy={9} r={0.9} fill="#b8b0a6" stroke="none" />
      <circle cx={-9.5} cy={11.5} r={0.9} fill="#b8b0a6" stroke="none" />
      <circle cx={7.5} cy={9} r={0.9} fill="#b8b0a6" stroke="none" />
      <circle cx={9.5} cy={11.5} r={0.9} fill="#b8b0a6" stroke="none" />
    </g>
  );
}

export function TigerFaceMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="-24 -24 48 48"
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

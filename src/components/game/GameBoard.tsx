import { EDGES, LABELS, POINTS } from "@/lib/game/board";
import type { GameState, Move } from "@/lib/game/engine";

const PAD = 48;
const STEP = 96;
const W = 4 * STEP + PAD * 2;
const H = 5 * STEP + PAD * 2;

const px = (i: number) => PAD + POINTS[i].x * STEP;
const py = (i: number) => PAD + POINTS[i].y * STEP;

type Props = {
  state: GameState;
  selected: number | null;
  targets: Move[];
  lastMove: Move | null;
  hint: Move | null;
  interactive: boolean;
  turnTimeLeft?: number;
  turnTimeLimit?: number;
  onNodeClick: (i: number) => void;
};

export function GameBoard({
  state,
  selected,
  targets,
  lastMove,
  hint,
  interactive,
  turnTimeLeft,
  turnTimeLimit,
  onNodeClick,
}: Props) {
  const targetMap = new Map(targets.map((m) => [m.to, m]));
  const lastFrom = lastMove && lastMove.kind !== "place" ? lastMove.from : null;
  const lastTo = lastMove ? lastMove.to : null;
  const hintFrom = hint && hint.kind !== "place" ? hint.from : null;
  const hintTo = hint?.to ?? null;
  const moveTypeLabel =
    lastMove?.kind === "capture"
      ? "Capture"
      : lastMove?.kind === "place"
        ? "Placement"
        : lastMove
          ? "Move"
          : "Ready";
  const moveTypeColor =
    lastMove?.kind === "capture"
      ? "border-rose-500/40 bg-rose-500/10 text-rose-200"
      : lastMove?.kind === "place"
        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
        : "border-amber-500/40 bg-amber-500/10 text-amber-200";
  const timerRatio = turnTimeLimit && turnTimeLeft !== undefined ? turnTimeLeft / turnTimeLimit : 1;
  const timeUrgent = interactive && turnTimeLeft !== undefined && timerRatio <= 0.27;

  return (
    <div className="relative w-full max-w-[600px] p-2">
      <div className="pointer-events-none absolute left-4 top-4 z-10 flex items-center gap-2 rounded-full border border-white/10 bg-stone-950/70 px-3 py-1.5 shadow-lg shadow-stone-950/40 backdrop-blur-sm">
        <div
          className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] ${moveTypeColor}`}
        >
          {moveTypeLabel}
        </div>
        <span
          className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${timeUrgent ? "text-rose-300" : "text-stone-300"}`}
        >
          {timeUrgent
            ? `Time pressure · ${turnTimeLeft}s`
            : lastMove
              ? lastMove.kind === "capture"
                ? "Tactical strike"
                : "Last turn"
              : "Awaiting move"}
        </span>
      </div>

      {/* Outer ambient glow background container */}
      <div className="absolute -inset-1 rounded-[2.5rem] bg-gradient-to-r from-amber-500/20 via-emerald-500/10 to-amber-500/20 opacity-70 blur-xl transition-all duration-500 group-hover:opacity-100" />

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className={`relative w-full select-none rounded-[2rem] bg-gradient-to-b from-stone-950 via-zinc-900 to-stone-950 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] ring-1 transition-all duration-500 ${timeUrgent ? "animate-pulse ring-rose-500/50 shadow-rose-950/30" : "ring-amber-500/20"}`}
        role="img"
        aria-label="Aadu Pulli Aatam board"
      >
        <defs>
          {/* Radial Gradients for Pieces */}
          <radialGradient id="tigerGrad" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="35%" stopColor="#f59e0b" />
            <stop offset="85%" stopColor="#b45309" />
            <stop offset="100%" stopColor="#78350f" />
          </radialGradient>

          <radialGradient id="goatGrad" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#a7f3d0" />
            <stop offset="40%" stopColor="#10b981" />
            <stop offset="85%" stopColor="#047857" />
            <stop offset="100%" stopColor="#064e3b" />
          </radialGradient>

          <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>

          <filter id="shadowFilter" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#000000" floodOpacity="0.75" />
          </filter>

          <filter id="glowTiger" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Board Outer Border Frame Pattern */}
        <rect
          x={PAD / 2}
          y={PAD / 2}
          width={W - PAD}
          height={H - PAD}
          rx={24}
          fill="none"
          stroke="url(#tigerGrad)"
          strokeWidth="1.5"
          strokeOpacity="0.15"
        />

        {/* Last Move Path Trajectory */}
        {lastFrom !== null && lastTo !== null && (
          <g>
            <line
              x1={px(lastFrom)}
              y1={py(lastFrom)}
              x2={px(lastTo)}
              y2={py(lastTo)}
              stroke="#f59e0b"
              strokeWidth={8}
              strokeLinecap="round"
              opacity={0.35}
              className="animate-pulse"
            />
            <line
              x1={px(lastFrom)}
              y1={py(lastFrom)}
              x2={px(lastTo)}
              y2={py(lastTo)}
              stroke="#fbbf24"
              strokeWidth={3}
              strokeLinecap="round"
              strokeDasharray="6 6"
              opacity={0.8}
            />
          </g>
        )}

        {/* Tactical Hint Indicator */}
        {hintTo !== null && (
          <g>
            {hintFrom !== null && (
              <line
                x1={px(hintFrom)}
                y1={py(hintFrom)}
                x2={px(hintTo)}
                y2={py(hintTo)}
                stroke="#10b981"
                strokeWidth={5}
                strokeLinecap="round"
                strokeDasharray="8 6"
                opacity={0.9}
              />
            )}
            <circle
              cx={px(hintTo)}
              cy={py(hintTo)}
              r={hint?.kind === "capture" ? 30 : 24}
              fill="rgba(16, 185, 129, 0.15)"
              stroke="#10b981"
              strokeWidth={3}
              className="animate-pulse"
            />
          </g>
        )}

        {/* Grid Edges Lines */}
        {EDGES.map(([a, b]) => (
          <g key={`edge-${a}-${b}`}>
            {/* Outer Glow line */}
            <line
              x1={px(a)}
              y1={py(a)}
              x2={px(b)}
              y2={py(b)}
              stroke="#78350f"
              strokeWidth={4}
              strokeLinecap="round"
              opacity={0.4}
            />
            {/* Inner Crisp line */}
            <line
              x1={px(a)}
              y1={py(a)}
              x2={px(b)}
              y2={py(b)}
              stroke="#f59e0b"
              strokeWidth={2}
              strokeLinecap="round"
              opacity={0.65}
            />
          </g>
        ))}

        {/* Nodes and Pieces */}
        {POINTS.map((_, i) => {
          const cell = state.cells[i];
          const target = targetMap.get(i);
          const isSelected = selected === i;
          const isLast = lastTo === i;
          const isNodeInteractive =
            interactive &&
            (cell === state.turn ||
              target !== undefined ||
              (state.turn === "goat" && state.goatsToPlace > 0 && cell === "empty"));
          const nodeLabel =
            cell === "empty"
              ? `${LABELS[i]}, empty${target ? ", legal destination" : ""}`
              : `${LABELS[i]}, ${cell}${isSelected ? ", selected" : ""}`;

          return (
            <g
              key={`node-${i}`}
              onClick={() => interactive && onNodeClick(i)}
              onKeyDown={(event) => {
                if (isNodeInteractive && (event.key === "Enter" || event.key === " ")) {
                  event.preventDefault();
                  onNodeClick(i);
                }
              }}
              aria-label={nodeLabel}
              aria-current={isSelected ? "true" : undefined}
              aria-disabled={!isNodeInteractive}
              role="button"
              tabIndex={isNodeInteractive ? 0 : -1}
              className={`transition-all duration-200 ${isNodeInteractive ? "cursor-pointer" : "cursor-default"}`}
            >
              {/* Invisible Hit Area */}
              <circle cx={px(i)} cy={py(i)} r={32} fill="transparent" />

              {/* Node Base Pin */}
              <circle cx={px(i)} cy={py(i)} r={10} fill="url(#nodeGlow)" />
              <circle cx={px(i)} cy={py(i)} r={5} fill="#f59e0b" opacity={0.7} />
              <circle cx={px(i)} cy={py(i)} r={2} fill="#fef08a" />

              {/* Legal Move Target Marker */}
              {target && (
                <g className="animate-pulse">
                  <circle
                    cx={px(i)}
                    cy={py(i)}
                    r={target.kind === "capture" ? 25 : 18}
                    fill={
                      target.kind === "capture"
                        ? "rgba(239, 68, 68, 0.25)"
                        : "rgba(16, 185, 129, 0.25)"
                    }
                    stroke={target.kind === "capture" ? "#ef4444" : "#10b981"}
                    strokeWidth={3}
                    strokeDasharray={target.kind === "capture" ? "4 4" : "none"}
                  />
                  <circle
                    cx={px(i)}
                    cy={py(i)}
                    r={6}
                    fill={target.kind === "capture" ? "#ef4444" : "#10b981"}
                  />
                </g>
              )}

              {/* Occupied Piece */}
              {cell !== "empty" && (
                <g
                  filter="url(#shadowFilter)"
                  className={`transition-transform duration-300 ${isSelected ? "scale-115" : "hover:scale-105"}`}
                  style={{
                    transformOrigin: `${px(i)}px ${py(i)}px`,
                  }}
                >
                  {/* Selection Ring Glow */}
                  {isSelected && (
                    <circle
                      cx={px(i)}
                      cy={py(i)}
                      r={cell === "tiger" ? 32 : 27}
                      fill="none"
                      stroke="#fbbf24"
                      strokeWidth={3.5}
                      className="animate-pulse"
                      strokeDasharray="6 4"
                    />
                  )}

                  {isLast && (
                    <circle
                      cx={px(i)}
                      cy={py(i)}
                      r={cell === "tiger" ? 34 : 29}
                      fill="none"
                      stroke={cell === "tiger" ? "#fbbf24" : "#34d399"}
                      strokeWidth={2.5}
                      className="animate-ping"
                      opacity={0.8}
                    />
                  )}

                  {/* Piece Outer Ring & Base Fill */}
                  <circle
                    cx={px(i)}
                    cy={py(i)}
                    r={cell === "tiger" ? 26 : 21}
                    fill={cell === "tiger" ? "url(#tigerGrad)" : "url(#goatGrad)"}
                    stroke={cell === "tiger" ? "#fef08a" : "#a7f3d0"}
                    strokeWidth={isSelected ? 3 : 1.5}
                    strokeOpacity={0.8}
                  />

                  {/* Piece Inner Icon Artwork */}
                  {cell === "tiger" ? (
                    /* Detailed Tiger Face Emblem */
                    <g
                      transform={`translate(${px(i)}, ${py(i)})`}
                      className="stroke-amber-950"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      {/* Ears */}
                      <path d="M -16 -12 L -21 -25 L -8 -17 Z" fill="#b45309" />
                      <path d="M 16 -12 L 21 -25 L 8 -17 Z" fill="#b45309" />
                      {/* Forehead Stripes */}
                      <path
                        d="M -7 -18 L 0 -11 L 7 -18"
                        fill="none"
                        stroke="#78350f"
                        strokeWidth={2.2}
                      />
                      <path d="M 0 -22 L 0 -15" stroke="#78350f" strokeWidth={2.2} />
                      {/* Whiskers */}
                      <path d="M -16 -4 L -7 -2 M -16 3 L -7 1 M -15 10 L -7 5" stroke="#451a03" />
                      <path d="M 16 -4 L 7 -2 M 16 3 L 7 1 M 15 10 L 7 5" stroke="#451a03" />
                      {/* Eyes */}
                      <circle
                        cx={-6}
                        cy={-3}
                        r={2.5}
                        fill="#fef08a"
                        stroke="#451a03"
                        strokeWidth={1}
                      />
                      <circle
                        cx={6}
                        cy={-3}
                        r={2.5}
                        fill="#fef08a"
                        stroke="#451a03"
                        strokeWidth={1}
                      />
                      <circle cx={-6} cy={-3} r={1} fill="#000" stroke="none" />
                      <circle cx={6} cy={-3} r={1} fill="#000" stroke="none" />
                      {/* Snout & Mouth */}
                      <path
                        d="M -6 4 Q 0 0 6 4 L 3 10 L 0 12 L -3 10 Z"
                        fill="#fef08a"
                        stroke="#78350f"
                        strokeWidth={1.5}
                      />
                      <path d="M -4 9 Q 0 14 4 9" fill="none" stroke="#451a03" strokeWidth={1.8} />
                    </g>
                  ) : (
                    /* Detailed Goat Horns Emblem */
                    <g
                      transform={`translate(${px(i)}, ${py(i)})`}
                      className="stroke-emerald-950"
                      strokeWidth={1.8}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      {/* Curved Horns */}
                      <path
                        d="M -10 -8 C -18 -18 -15 -27 -7 -25 C -8 -19 -4 -16 -1 -14"
                        fill="#064e3b"
                        stroke="#a7f3d0"
                        strokeWidth={1.2}
                      />
                      <path
                        d="M 10 -8 C 18 -18 15 -27 7 -25 C 8 -19 4 -16 1 -14"
                        fill="#064e3b"
                        stroke="#a7f3d0"
                        strokeWidth={1.2}
                      />
                      {/* Ears */}
                      <path
                        d="M -14 -4 L -20 -1 L -14 3 Z"
                        fill="#047857"
                        stroke="#ecfdf5"
                        strokeWidth={1}
                      />
                      <path
                        d="M 14 -4 L 20 -1 L 14 3 Z"
                        fill="#047857"
                        stroke="#ecfdf5"
                        strokeWidth={1}
                      />
                      {/* Face Shape */}
                      <ellipse
                        cy={2}
                        rx={9}
                        ry={11}
                        fill="#10b981"
                        stroke="#047857"
                        strokeWidth={1.5}
                      />
                      {/* Eyes */}
                      <circle
                        cx={-4}
                        cy={-1}
                        r={1.8}
                        fill="#ecfdf5"
                        stroke="#064e3b"
                        strokeWidth={0.8}
                      />
                      <circle
                        cx={4}
                        cy={-1}
                        r={1.8}
                        fill="#ecfdf5"
                        stroke="#064e3b"
                        strokeWidth={0.8}
                      />
                      {/* Snout Nose */}
                      <path d="M -3 6 Q 0 9 3 6" fill="none" stroke="#064e3b" strokeWidth={1.6} />
                    </g>
                  )}
                </g>
              )}

              {/* Last Move Destination Indicator */}
              {isLast && (
                <circle
                  cx={px(i)}
                  cy={py(i)}
                  r={30}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  opacity={0.6}
                  strokeDasharray="4 4"
                />
              )}
              <title>{`${LABELS[i]} ${cell !== "empty" ? `(${cell.toUpperCase()})` : ""}`}</title>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

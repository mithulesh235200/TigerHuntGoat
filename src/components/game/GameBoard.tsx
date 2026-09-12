import { EDGES, LABELS, POINTS } from "@/lib/game/board";
import type { GameState, Move } from "@/lib/game/engine";

const PAD = 52;
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
      ? "Tactical Capture"
      : lastMove?.kind === "place"
        ? "Goat Placement"
        : lastMove
          ? "Piece Movement"
          : "Battle Ready";

  const moveTypeColor =
    lastMove?.kind === "capture"
      ? "border-rose-500/50 bg-rose-500/20 text-rose-200 shadow-rose-950/40"
      : lastMove?.kind === "place"
        ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-200 shadow-emerald-950/40"
        : "border-amber-500/50 bg-amber-500/20 text-amber-200 shadow-amber-950/40";

  const timerRatio = turnTimeLimit && turnTimeLeft !== undefined ? turnTimeLeft / turnTimeLimit : 1;
  const timeUrgent = interactive && turnTimeLeft !== undefined && timerRatio <= 0.27;

  return (
    <div className="relative w-full max-w-[620px] p-2">
      {/* Top Floating Match Header Chips */}
      <div className="pointer-events-none absolute left-6 top-6 z-10 flex flex-wrap items-center gap-2">
        <div
          className={`flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] shadow-lg backdrop-blur-md transition-all ${moveTypeColor}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
          <span>{moveTypeLabel}</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-stone-950/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-300 shadow-md backdrop-blur-md">
          <span className={timeUrgent ? "text-rose-400 animate-pulse font-extrabold" : "text-amber-400"}>
            {timeUrgent ? `⚡ Urgent · ${turnTimeLeft}s` : `Turn #${state.cells.filter(c => c !== "empty").length}`}
          </span>
        </div>
      </div>

      {/* Ambient background glow backdrop */}
      <div className="absolute -inset-2 rounded-[3rem] bg-gradient-to-tr from-amber-500/20 via-orange-500/10 to-emerald-500/20 opacity-70 blur-2xl transition-all duration-700 hover:opacity-100" />

      {/* Main SVG Game Board */}
      <div className="relative overflow-hidden rounded-[2.5rem] border border-amber-500/25 bg-gradient-to-b from-stone-950 via-zinc-950 to-stone-950 p-3 shadow-[0_30px_70px_rgba(0,0,0,0.95)] ring-1 ring-white/10 backdrop-blur-xl">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className={`w-full select-none rounded-[2rem] transition-all duration-500 ${
            timeUrgent ? "ring-2 ring-rose-500/60 shadow-rose-950/50 animate-pulse" : ""
          }`}
          role="img"
          aria-label="Aadu Puli Aatam Traditional Strategic Board"
        >
          <defs>
            {/* Rich Radial Gradients */}
            <radialGradient id="boardBgGrad" cx="50%" cy="50%" r="75%">
              <stop offset="0%" stopColor="#1c1917" />
              <stop offset="60%" stopColor="#0c0a09" />
              <stop offset="100%" stopColor="#030712" />
            </radialGradient>

            <radialGradient id="tigerGrad" cx="35%" cy="30%" r="75%">
              <stop offset="0%" stopColor="#ffedd5" />
              <stop offset="25%" stopColor="#f59e0b" />
              <stop offset="70%" stopColor="#ea580c" />
              <stop offset="95%" stopColor="#9a3412" />
              <stop offset="100%" stopColor="#451a03" />
            </radialGradient>

            <radialGradient id="goatGrad" cx="35%" cy="30%" r="75%">
              <stop offset="0%" stopColor="#ecfdf5" />
              <stop offset="30%" stopColor="#10b981" />
              <stop offset="75%" stopColor="#047857" />
              <stop offset="95%" stopColor="#064e3b" />
              <stop offset="100%" stopColor="#022c22" />
            </radialGradient>

            <radialGradient id="nodeGlowGold" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#d97706" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#78350f" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="nodeGlowTarget" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0" />
            </radialGradient>

            {/* Drop Shadow Filters */}
            <filter id="pieceShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="8" stdDeviation="7" floodColor="#000000" floodOpacity="0.85" />
            </filter>

            <filter id="glowTigerFilter" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <filter id="glowGoatFilter" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Board Background Pattern */}
          <rect x={0} y={0} width={W} height={H} rx={32} fill="url(#boardBgGrad)" />

          {/* Traditional Outer Decorative Frame Corner Accents */}
          <g stroke="#f59e0b" strokeWidth="1.5" strokeOpacity="0.35" fill="none">
            <path d={`M ${PAD / 2} ${PAD / 2 + 20} L ${PAD / 2} ${PAD / 2} L ${PAD / 2 + 20} ${PAD / 2}`} />
            <path d={`M ${W - PAD / 2 - 20} ${PAD / 2} L ${W - PAD / 2} ${PAD / 2} L ${W - PAD / 2} ${PAD / 2 + 20}`} />
            <path d={`M ${PAD / 2} ${H - PAD / 2 - 20} L ${PAD / 2} ${H - PAD / 2} L ${PAD / 2 + 20} ${H - PAD / 2}`} />
            <path d={`M ${W - PAD / 2 - 20} ${H - PAD / 2} L ${W - PAD / 2} ${H - PAD / 2} L ${W - PAD / 2} ${H - PAD / 2 - 20}`} />
          </g>

          {/* Grid Edges (Lines) */}
          {EDGES.map(([a, b]) => (
            <g key={`edge-${a}-${b}`}>
              {/* Wide Ambient Glow Line */}
              <line
                x1={px(a)}
                y1={py(a)}
                x2={px(b)}
                y2={py(b)}
                stroke="#9a3412"
                strokeWidth={7}
                strokeLinecap="round"
                opacity={0.3}
              />
              {/* Crisp Golden Inner Center Line */}
              <line
                x1={px(a)}
                y1={py(a)}
                x2={px(b)}
                y2={py(b)}
                stroke="#f59e0b"
                strokeWidth={2.5}
                strokeLinecap="round"
                opacity={0.75}
              />
              {/* Highlight accent thread */}
              <line
                x1={px(a)}
                y1={py(a)}
                x2={px(b)}
                y2={py(b)}
                stroke="#fef08a"
                strokeWidth={0.8}
                strokeLinecap="round"
                opacity={0.4}
              />
            </g>
          ))}

          {/* Last Move Trajectory Line */}
          {lastFrom !== null && lastTo !== null && (
            <g>
              <line
                x1={px(lastFrom)}
                y1={py(lastFrom)}
                x2={px(lastTo)}
                y2={py(lastTo)}
                stroke="#f59e0b"
                strokeWidth={10}
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
                strokeWidth={3.5}
                strokeLinecap="round"
                strokeDasharray="8 6"
                opacity={0.9}
              />
              {/* Floating pulse dot on target */}
              <circle
                cx={px(lastTo)}
                cy={py(lastTo)}
                r={16}
                fill="none"
                stroke="#f59e0b"
                strokeWidth={2}
                className="animate-ping"
                opacity={0.7}
              />
            </g>
          )}

          {/* Tactical Hint Indicator Path */}
          {hintTo !== null && (
            <g>
              {hintFrom !== null && (
                <line
                  x1={px(hintFrom)}
                  y1={py(hintFrom)}
                  x2={px(hintTo)}
                  y2={py(hintTo)}
                  stroke="#10b981"
                  strokeWidth={6}
                  strokeLinecap="round"
                  strokeDasharray="8 6"
                  opacity={0.9}
                />
              )}
              <circle
                cx={px(hintTo)}
                cy={py(hintTo)}
                r={hint?.kind === "capture" ? 32 : 26}
                fill="rgba(16, 185, 129, 0.2)"
                stroke="#10b981"
                strokeWidth={3}
                className="animate-pulse"
              />
            </g>
          )}

          {/* Board Nodes & Game Pieces */}
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
                ? `${LABELS[i]} (Empty point${target ? ", Legal Destination" : ""})`
                : `${LABELS[i]} (${cell.toUpperCase()}${isSelected ? ", Selected" : ""})`;

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
                className={`group transition-all duration-300 ${
                  isNodeInteractive ? "cursor-pointer" : "cursor-default"
                }`}
              >
                {/* Touch/Mouse Large Hit Target Area */}
                <circle cx={px(i)} cy={py(i)} r={34} fill="transparent" />

                {/* Node Junction Point Visual */}
                <circle cx={px(i)} cy={py(i)} r={14} fill="url(#nodeGlowGold)" opacity={0.6} />
                <circle cx={px(i)} cy={py(i)} r={6} fill="#b45309" stroke="#f59e0b" strokeWidth={1.5} />
                <circle cx={px(i)} cy={py(i)} r={2.5} fill="#fef08a" />

                {/* Node Label Text on Hover or Active */}
                <text
                  x={px(i)}
                  y={py(i) + 32}
                  textAnchor="middle"
                  fill="#78716c"
                  fontSize="9"
                  fontWeight="bold"
                  letterSpacing="0.1em"
                  className="opacity-40 transition-opacity group-hover:opacity-100 group-hover:fill-amber-300"
                >
                  {LABELS[i]}
                </text>

                {/* Legal Destination Target Marker */}
                {target && (
                  <g className="animate-pulse">
                    <circle
                      cx={px(i)}
                      cy={py(i)}
                      r={target.kind === "capture" ? 28 : 20}
                      fill={
                        target.kind === "capture"
                          ? "rgba(239, 68, 68, 0.25)"
                          : "rgba(16, 185, 129, 0.25)"
                      }
                      stroke={target.kind === "capture" ? "#ef4444" : "#10b981"}
                      strokeWidth={3.5}
                      strokeDasharray={target.kind === "capture" ? "5 4" : "none"}
                    />
                    <circle
                      cx={px(i)}
                      cy={py(i)}
                      r={7}
                      fill={target.kind === "capture" ? "#ef4444" : "#10b981"}
                      stroke="#ffffff"
                      strokeWidth={1.5}
                    />
                  </g>
                )}

                {/* Occupied Piece Token */}
                {cell !== "empty" && (
                  <g
                    filter="url(#pieceShadow)"
                    className={`transition-all duration-300 ${
                      isSelected ? "scale-125" : "hover:scale-110"
                    }`}
                    style={{
                      transformOrigin: `${px(i)}px ${py(i)}px`,
                    }}
                  >
                    {/* Selection Active Ring */}
                    {isSelected && (
                      <g>
                        <circle
                          cx={px(i)}
                          cy={py(i)}
                          r={cell === "tiger" ? 34 : 29}
                          fill="none"
                          stroke="#fbbf24"
                          strokeWidth={4}
                          className="animate-pulse"
                          strokeDasharray="8 5"
                        />
                        <circle
                          cx={px(i)}
                          cy={py(i)}
                          r={cell === "tiger" ? 40 : 35}
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth={1.5}
                          opacity={0.6}
                        />
                      </g>
                    )}

                    {/* Last Move Arrival Ping Ring */}
                    {isLast && (
                      <circle
                        cx={px(i)}
                        cy={py(i)}
                        r={cell === "tiger" ? 36 : 31}
                        fill="none"
                        stroke={cell === "tiger" ? "#fbbf24" : "#34d399"}
                        strokeWidth={2.5}
                        className="animate-ping"
                        opacity={0.85}
                      />
                    )}

                    {/* Outer Token Body */}
                    <circle
                      cx={px(i)}
                      cy={py(i)}
                      r={cell === "tiger" ? 27 : 22}
                      fill={cell === "tiger" ? "url(#tigerGrad)" : "url(#goatGrad)"}
                      stroke={cell === "tiger" ? "#fef08a" : "#a7f3d0"}
                      strokeWidth={isSelected ? 3.5 : 2}
                      strokeOpacity={0.9}
                    />

                    {/* Inner Artwork Emblem */}
                    {cell === "tiger" ? (
                      /* Detailed Tiger Face Emblem */
                      <g
                        transform={`translate(${px(i)}, ${py(i)})`}
                        className="stroke-amber-950"
                        strokeWidth={2.2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        {/* Ears */}
                        <path d="M -16 -12 L -22 -26 L -8 -17 Z" fill="#b45309" stroke="#fef08a" strokeWidth={1} />
                        <path d="M 16 -12 L 22 -26 L 8 -17 Z" fill="#b45309" stroke="#fef08a" strokeWidth={1} />
                        {/* Forehead Stripes */}
                        <path d="M -8 -19 L 0 -11 L 8 -19" fill="none" stroke="#78350f" strokeWidth={2.5} />
                        <path d="M 0 -23 L 0 -15" stroke="#78350f" strokeWidth={2.5} />
                        {/* Whiskers */}
                        <path d="M -17 -4 L -8 -2 M -17 3 L -8 1 M -16 10 L -8 5" stroke="#451a03" />
                        <path d="M 17 -4 L 8 -2 M 17 3 L 8 1 M 16 10 L 8 5" stroke="#451a03" />
                        {/* Eyes */}
                        <circle cx={-6} cy={-3} r={2.8} fill="#fef08a" stroke="#451a03" strokeWidth={1.2} />
                        <circle cx={6} cy={-3} r={2.8} fill="#fef08a" stroke="#451a03" strokeWidth={1.2} />
                        <circle cx={-6} cy={-3} r={1.2} fill="#000" />
                        <circle cx={6} cy={-3} r={1.2} fill="#000" />
                        {/* Snout & Nose */}
                        <path d="M -6 4 Q 0 0 6 4 L 3 10 L 0 12 L -3 10 Z" fill="#fef08a" stroke="#78350f" strokeWidth={1.5} />
                        <path d="M -4 9 Q 0 14 4 9" fill="none" stroke="#451a03" strokeWidth={2} />
                      </g>
                    ) : (
                      /* Detailed Goat Horns Emblem */
                      <g
                        transform={`translate(${px(i)}, ${py(i)})`}
                        className="stroke-emerald-950"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        {/* Curved Horns */}
                        <path
                          d="M -10 -8 C -19 -19 -16 -28 -7 -26 C -9 -20 -4 -16 -1 -14"
                          fill="#064e3b"
                          stroke="#a7f3d0"
                          strokeWidth={1.4}
                        />
                        <path
                          d="M 10 -8 C 19 -19 16 -28 7 -26 C 9 -20 4 -16 1 -14"
                          fill="#064e3b"
                          stroke="#a7f3d0"
                          strokeWidth={1.4}
                        />
                        {/* Ears */}
                        <path d="M -14 -4 L -21 -1 L -14 3 Z" fill="#047857" stroke="#ecfdf5" strokeWidth={1.2} />
                        <path d="M 14 -4 L 21 -1 L 14 3 Z" fill="#047857" stroke="#ecfdf5" strokeWidth={1.2} />
                        {/* Head */}
                        <ellipse cy={2} rx={9.5} ry={11.5} fill="#10b981" stroke="#047857" strokeWidth={1.6} />
                        {/* Eyes */}
                        <circle cx={-4.5} cy={-1} r={2} fill="#ecfdf5" stroke="#064e3b" strokeWidth={0.9} />
                        <circle cx={4.5} cy={-1} r={2} fill="#ecfdf5" stroke="#064e3b" strokeWidth={0.9} />
                        {/* Snout */}
                        <path d="M -3 6 Q 0 9.5 3 6" fill="none" stroke="#064e3b" strokeWidth={1.8} />
                      </g>
                    )}
                  </g>
                )}

                <title>{`${LABELS[i]} ${cell !== "empty" ? `(${cell.toUpperCase()})` : ""}`}</title>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

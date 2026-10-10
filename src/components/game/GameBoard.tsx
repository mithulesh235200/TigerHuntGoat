import { useEffect, useRef } from "react";
import { EDGES, LABELS, POINTS } from "@/lib/game/board";
import type { GameState, Move } from "@/lib/game/engine";
import { TigerFaceArt } from "@/components/game/TigerFace";
import { useLang } from "@/lib/i18n";
import { prefersReducedMotion } from "@/lib/device";

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
  const { t } = useLang();
  const targetMap = new Map(targets.map((m) => [m.to, m]));
  const lastFrom = lastMove && lastMove.kind !== "place" ? lastMove.from : null;
  const lastTo = lastMove ? lastMove.to : null;
  const hintFrom = hint && hint.kind !== "place" ? hint.from : null;
  const hintTo = hint?.to ?? null;

  const moveTypeLabel =
    lastMove?.kind === "capture"
      ? t.moveCapture
      : lastMove?.kind === "place"
        ? t.movePlacement
        : lastMove
          ? t.moveMovement
          : t.battleReady;

  const moveTypeColor =
    lastMove?.kind === "capture"
      ? "border-rose-500/50 bg-rose-500/20 text-rose-200 shadow-rose-950/40"
      : lastMove?.kind === "place"
        ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-200 shadow-emerald-950/40"
        : "border-amber-500/50 bg-amber-500/20 text-amber-200 shadow-amber-950/40";

  const timerRatio = turnTimeLimit && turnTimeLeft !== undefined ? turnTimeLeft / turnTimeLimit : 1;
  const timeUrgent = interactive && turnTimeLeft !== undefined && timerRatio <= 0.27;

  // Capture shake via WAAPI: retriggers on every capture, no remounts, no focus loss.
  const frameRef = useRef<HTMLDivElement>(null);
  const prevLastMove = useRef<Move | null>(null);
  useEffect(() => {
    const prev = prevLastMove.current;
    prevLastMove.current = lastMove;
    if (!lastMove || lastMove === prev || lastMove.kind !== "capture") return;
    if (prefersReducedMotion()) return;
    frameRef.current?.animate(
      [
        { transform: "translate(0, 0)" },
        { transform: "translate(-5px, 3px)" },
        { transform: "translate(5px, -3px)" },
        { transform: "translate(-2px, -1px)" },
        { transform: "translate(0, 0)" },
      ],
      { duration: 320, easing: "ease-out" },
    );
  }, [lastMove]);

  return (
    <div className={`relative w-full max-w-[620px] p-2 board-turn-${state.turn}`}>
      {/* Top Floating Match Header Chips */}
      <div className="pointer-events-none absolute left-6 top-6 z-10 flex flex-wrap items-center gap-2">
        <div
          className={`flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] shadow-lg backdrop-blur-md transition-all ${moveTypeColor}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
          <span>{moveTypeLabel}</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-stone-950/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-300 shadow-md backdrop-blur-md">
          <span
            className={timeUrgent ? "text-rose-400 animate-pulse font-extrabold" : "text-amber-400"}
          >
            {timeUrgent
              ? t.urgent.replace("{n}", String(turnTimeLeft))
              : t.turnHash.replace("{n}", String(state.cells.filter((c) => c !== "empty").length))}
          </span>
        </div>
      </div>

      {/* Ambient background glow backdrop */}
      <div className="t-board-aura absolute -inset-2 rounded-[3rem] opacity-70 blur-2xl transition-all duration-700 hover:opacity-100" />

      {/* Main SVG Game Board */}
      <div
        ref={frameRef}
        className="t-board-frame relative overflow-hidden rounded-[2.5rem] bg-gradient-to-b from-stone-950 via-zinc-950 to-stone-950 p-3 ring-1 ring-white/10 backdrop-blur-xl"
      >
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
              <stop offset="0%" style={{ stopColor: "var(--a1)" }} stopOpacity="0.8" />
              <stop offset="60%" style={{ stopColor: "var(--a1)" }} stopOpacity="0.3" />
              <stop offset="100%" style={{ stopColor: "var(--a1)" }} stopOpacity="0" />
            </radialGradient>

            <radialGradient id="nodeGlowTarget" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0" />
            </radialGradient>

            {/* Drop Shadow Filters */}
            <filter id="pieceShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow
                dx="0"
                dy="8"
                stdDeviation="7"
                floodColor="#000000"
                floodOpacity="0.85"
              />
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
          <g
            style={{ stroke: "var(--board-line)" }}
            strokeWidth="1.5"
            strokeOpacity="0.35"
            fill="none"
          >
            <path
              d={`M ${PAD / 2} ${PAD / 2 + 20} L ${PAD / 2} ${PAD / 2} L ${PAD / 2 + 20} ${PAD / 2}`}
            />
            <path
              d={`M ${W - PAD / 2 - 20} ${PAD / 2} L ${W - PAD / 2} ${PAD / 2} L ${W - PAD / 2} ${PAD / 2 + 20}`}
            />
            <path
              d={`M ${PAD / 2} ${H - PAD / 2 - 20} L ${PAD / 2} ${H - PAD / 2} L ${PAD / 2 + 20} ${H - PAD / 2}`}
            />
            <path
              d={`M ${W - PAD / 2 - 20} ${H - PAD / 2} L ${W - PAD / 2} ${H - PAD / 2} L ${W - PAD / 2} ${H - PAD / 2 - 20}`}
            />
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
              {/* Crisp Theme Inner Center Line */}
              <line
                x1={px(a)}
                y1={py(a)}
                x2={px(b)}
                y2={py(b)}
                style={{ stroke: "var(--board-line)" }}
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
                style={{ stroke: "var(--a1)" }}
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
                style={{ stroke: "var(--a3)" }}
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
                style={{ stroke: "var(--a1)" }}
                strokeWidth={2}
                className="animate-ping"
                opacity={0.7}
              />
            </g>
          )}

          {/* Capture shockwave on the captured square */}
          {lastMove?.kind === "capture" && (
            <circle
              key={`poof-${lastMove.from}-${lastMove.over}-${lastMove.to}`}
              cx={px(lastMove.over)}
              cy={py(lastMove.over)}
              r={22}
              fill="none"
              stroke="#f43f5e"
              strokeWidth={3}
              className="capture-poof"
            />
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
                ? (target ? t.ariaDest : t.ariaEmpty).replace("{node}", LABELS[i])
                : (isSelected ? t.ariaSelected : t.ariaPiece)
                    .replace("{node}", LABELS[i])
                    .replace("{side}", cell.toUpperCase());

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
                className={`group board-node transition-all duration-300 ${
                  isNodeInteractive ? "board-node-interactive cursor-pointer" : "cursor-default"
                }`}
              >
                {/* Touch/Mouse Large Hit Target Area */}
                <circle cx={px(i)} cy={py(i)} r={34} fill="transparent" />

                {/* Node Junction Point Visual */}
                <circle cx={px(i)} cy={py(i)} r={14} fill="url(#nodeGlowGold)" opacity={0.6} />
                <circle
                  cx={px(i)}
                  cy={py(i)}
                  r={6}
                  style={{ fill: "var(--a2)", stroke: "var(--a1)" }}
                  strokeWidth={1.5}
                />
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
                  className="opacity-40 transition-opacity group-hover:opacity-100 group-hover:fill-[var(--a-soft)]"
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
                    className={`transition-all duration-300 ${isLast ? "piece-land" : ""} ${
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
                          style={{ stroke: "var(--a3)" }}
                          strokeWidth={4}
                          className="animate-pulse"
                          strokeDasharray="8 5"
                        />
                        <circle
                          cx={px(i)}
                          cy={py(i)}
                          r={cell === "tiger" ? 40 : 35}
                          fill="none"
                          style={{ stroke: "var(--a1)" }}
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
                      /* Cute tiger face — the app's single tiger look */
                      <g transform={`translate(${px(i)}, ${py(i)})`}>
                        <TigerFaceArt />
                      </g>
                    ) : (
                      /* Realistic Goat Face Emblem */
                      <g
                        transform={`translate(${px(i)}, ${py(i)})`}
                        className="stroke-emerald-950"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        {/* Ridged curved horns */}
                        <path
                          d="M -7 -9 C -17 -13 -21 -24 -13 -30 C -11 -31 -9 -30 -9 -28 C -13 -24 -12 -17 -5 -13 Z"
                          fill="#d6d3d1"
                          stroke="#57534e"
                          strokeWidth={1.4}
                        />
                        <path
                          d="M 7 -9 C 17 -13 21 -24 13 -30 C 11 -31 9 -30 9 -28 C 13 -24 12 -17 5 -13 Z"
                          fill="#d6d3d1"
                          stroke="#57534e"
                          strokeWidth={1.4}
                        />
                        <path
                          d="M -15 -22 L -10 -20 M -16 -18 L -11 -16"
                          stroke="#78716c"
                          strokeWidth={1.2}
                        />
                        <path
                          d="M 15 -22 L 10 -20 M 16 -18 L 11 -16"
                          stroke="#78716c"
                          strokeWidth={1.2}
                        />
                        {/* Drooping ears */}
                        <path
                          d="M -11 0 L -22 3 L -20 9 L -10 6 Z"
                          fill="#e7e5e4"
                          stroke="#a8a29e"
                          strokeWidth={1.2}
                        />
                        <path
                          d="M 11 0 L 22 3 L 20 9 L 10 6 Z"
                          fill="#e7e5e4"
                          stroke="#a8a29e"
                          strokeWidth={1.2}
                        />
                        {/* Head */}
                        <ellipse
                          cx={0}
                          cy={2}
                          rx={10}
                          ry={12}
                          fill="#fafaf9"
                          stroke="#a8a29e"
                          strokeWidth={1.5}
                        />
                        {/* Forelock tuft */}
                        <path
                          d="M -6 -8 L -3 -13 L 0 -8 L 3 -13 L 6 -8 Z"
                          fill="#e7e5e4"
                          stroke="#a8a29e"
                          strokeWidth={1}
                        />
                        {/* Eyes with horizontal slit pupils */}
                        <ellipse
                          cx={-4.5}
                          cy={0}
                          rx={2.8}
                          ry={2.4}
                          fill="#ffffff"
                          stroke="#57534e"
                          strokeWidth={1}
                        />
                        <ellipse
                          cx={4.5}
                          cy={0}
                          rx={2.8}
                          ry={2.4}
                          fill="#ffffff"
                          stroke="#57534e"
                          strokeWidth={1}
                        />
                        <rect
                          x={-6.9}
                          y={-0.9}
                          width={4.8}
                          height={1.8}
                          rx={0.9}
                          fill="#1c1917"
                          stroke="none"
                        />
                        <rect
                          x={2.1}
                          y={-0.9}
                          width={4.8}
                          height={1.8}
                          rx={0.9}
                          fill="#1c1917"
                          stroke="none"
                        />
                        {/* Nose */}
                        <ellipse
                          cx={0}
                          cy={7.5}
                          rx={3.2}
                          ry={2.4}
                          fill="#d6a08e"
                          stroke="#78716c"
                          strokeWidth={1}
                        />
                        <circle cx={-1.3} cy={7.5} r={0.5} fill="#57534e" stroke="none" />
                        <circle cx={1.3} cy={7.5} r={0.5} fill="#57534e" stroke="none" />
                        {/* Mouth + goatee beard */}
                        <path
                          d="M -3 11 Q 0 13 3 11"
                          fill="none"
                          stroke="#57534e"
                          strokeWidth={1.4}
                        />
                        <path
                          d="M -2.5 12.5 L 0 20 L 2.5 12.5 Z"
                          fill="#e7e5e4"
                          stroke="#a8a29e"
                          strokeWidth={1}
                        />
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

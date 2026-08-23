import { EDGES, LABELS, POINTS } from "@/lib/game/board";
import type { GameState, Move } from "@/lib/game/engine";

const PAD = 44;
const STEP = 92;
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
  onNodeClick: (i: number) => void;
};

export function GameBoard({ state, selected, targets, lastMove, hint, interactive, onNodeClick }: Props) {
  const targetMap = new Map(targets.map((m) => [m.kind === "place" ? m.to : m.to, m]));
  const lastFrom = lastMove && lastMove.kind !== "place" ? lastMove.from : null;
  const lastTo = lastMove ? lastMove.to : null;
  const hintFrom = hint && hint.kind !== "place" ? hint.from : null;
  const hintTo = hint?.to ?? null;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full max-w-[560px] select-none rounded-3xl bg-board shadow-board ring-1 ring-line/25"
      role="img"
      aria-label="Aadu Pulli Aatam board"
    >
      <defs>
        <radialGradient id="tigerFill" cx="35%" cy="30%">
          <stop offset="0%" stopColor="var(--tiger-glow)" />
          <stop offset="100%" stopColor="var(--tiger)" />
        </radialGradient>
        <radialGradient id="goatFill" cx="35%" cy="30%">
          <stop offset="0%" stopColor="var(--goat-glow)" />
          <stop offset="100%" stopColor="var(--goat)" />
        </radialGradient>
      </defs>

      {lastFrom !== null && lastTo !== null && (
        <line
          x1={px(lastFrom)}
          y1={py(lastFrom)}
          x2={px(lastTo)}
          y2={py(lastTo)}
          className="stroke-highlight"
          strokeWidth={9}
          strokeLinecap="round"
          opacity={0.45}
        />
      )}

      {hintTo !== null && (
        <>
          {hintFrom !== null && (
            <line
              x1={px(hintFrom)}
              y1={py(hintFrom)}
              x2={px(hintTo)}
              y2={py(hintTo)}
              className="stroke-highlight"
              strokeWidth={5}
              strokeLinecap="round"
              strokeDasharray="8 7"
              opacity={0.9}
            />
          )}
          <circle
            cx={px(hintTo)}
            cy={py(hintTo)}
            r={hint?.kind === "capture" ? 28 : 23}
            className="fill-highlight/15 stroke-highlight animate-pulse-ring"
            strokeWidth={3}
          />
        </>
      )}

      {EDGES.map(([a, b]) => (
        <line
          key={`${a}-${b}`}
          x1={px(a)}
          y1={py(a)}
          x2={px(b)}
          y2={py(b)}
          className="stroke-line"
          strokeWidth={3}
          strokeLinecap="round"
          opacity={0.55}
        />
      ))}

      {POINTS.map((_, i) => {
        const cell = state.cells[i];
        const target = targetMap.get(i);
        const isSelected = selected === i;
        const isLast = lastTo === i;
        return (
          <g
            key={i}
            onClick={() => interactive && onNodeClick(i)}
            className={interactive ? "cursor-pointer" : "cursor-default"}
          >
            <circle cx={px(i)} cy={py(i)} r={30} fill="transparent" />
            <circle cx={px(i)} cy={py(i)} r={7} className="fill-line" opacity={0.6} />

            {target && (
              <circle
                cx={px(i)}
                cy={py(i)}
                r={target.kind === "capture" ? 22 : 16}
                className={
                  target.kind === "capture"
                    ? "fill-danger/25 stroke-danger animate-pulse-ring"
                    : "fill-highlight/20 stroke-highlight animate-pulse-ring"
                }
                strokeWidth={3}
              />
            )}

            {cell !== "empty" && (
              <g
                className="transition-transform duration-300"
                style={{ transform: `translate(${px(i)}px, ${py(i)}px)` }}
              >
                <circle
                  r={cell === "tiger" ? 26 : 21}
                  fill={cell === "tiger" ? "url(#tigerFill)" : "url(#goatFill)"}
                  className={`${isSelected ? "stroke-highlight" : "stroke-line/40"} drop-shadow`}
                  strokeWidth={isSelected ? 4 : 2}
                />
                {cell === "tiger" ? (
                  <g className="stroke-line" strokeWidth={2.5} strokeLinecap="round" fill="none">
                    <path d="M -13 -8 L -5 -12" />
                    <path d="M -13 0 L -4 -2" />
                    <path d="M -12 8 L -4 8" />
                    <path d="M 13 -8 L 5 -12" />
                    <path d="M 13 0 L 4 -2" />
                    <path d="M 12 8 L 4 8" />
                    <circle cx={-4} cy={1} r={1.6} className="fill-line" />
                    <circle cx={4} cy={1} r={1.6} className="fill-line" />
                  </g>
                ) : (
                  <circle r={8} className="fill-line/15 stroke-line/40" strokeWidth={1.5} />
                )}

              </g>
            )}

            {isLast && (
              <circle
                cx={px(i)}
                cy={py(i)}
                r={32}
                className="fill-none stroke-highlight"
                strokeWidth={2}
                opacity={0.7}
              />
            )}
            <title>{LABELS[i]}</title>
          </g>
        );
      })}
    </svg>
  );
}

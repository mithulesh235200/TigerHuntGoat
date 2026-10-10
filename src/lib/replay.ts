// Compact move-list codec for shareable replay links (?replay=...).
// Encoding: P<to> place, M<from><to> move, C<from><over><to> capture,
// node ids 0..22 written as single base-36 chars.
import { applyMove, createGame, type GameState, type Move } from "./game/engine";

const N = (n: number) => n.toString(36);
const P = (ch: string) => parseInt(ch, 36);

export function diffStates(prev: GameState, next: GameState): Move | null {
  if (next.goatsToPlace === prev.goatsToPlace - 1) {
    const to = next.cells.findIndex((c, i) => c === "goat" && prev.cells[i] === "empty");
    return to >= 0 ? { kind: "place", to } : null;
  }
  // General diff: find vacated origin, new occupation, and cleared capture square.
  // (For captures, the origin is the emptied square whose piece now sits at dest.)
  const emptied: number[] = [];
  let dest = -1;
  for (let i = 0; i < prev.cells.length; i++) {
    if (prev.cells[i] !== "empty" && next.cells[i] === "empty") emptied.push(i);
    if (prev.cells[i] === "empty" && next.cells[i] !== "empty") dest = i;
  }
  if (emptied.length === 0 || dest === -1) return null;
  const movedPiece = next.cells[dest];
  const origin = emptied.find((i) => prev.cells[i] === movedPiece) ?? emptied[0];
  const over = emptied.find((i) => i !== origin) ?? -1;
  if (over !== -1) return { kind: "capture", from: origin, to: dest, over };
  return { kind: "move", from: origin, to: dest };
}

export function encodeMove(m: Move): string {
  if (m.kind === "place") return `P${N(m.to)}`;
  if (m.kind === "move") return `M${N(m.from)}${N(m.to)}`;
  return `C${N(m.from)}${N(m.over)}${N(m.to)}`;
}

export function encodeHistory(history: GameState[]): string | null {
  if (history.length < 2) return null;
  const parts: string[] = [];
  for (let i = 1; i < history.length; i++) {
    const m = diffStates(history[i - 1], history[i]);
    if (!m) return null;
    parts.push(encodeMove(m));
  }
  return parts.join("");
}

export function decodeMoves(code: string): GameState[] | null {
  try {
    const states: GameState[] = [createGame()];
    let i = 0;
    while (i < code.length) {
      const kind = code[i++];
      if (kind === "P") {
        const to = P(code[i++]);
        if (!Number.isInteger(to)) return null;
        states.push(applyMove(states[states.length - 1], { kind: "place", to }));
      } else if (kind === "M") {
        const from = P(code[i++]);
        const to = P(code[i++]);
        if (!Number.isInteger(from) || !Number.isInteger(to)) return null;
        states.push(applyMove(states[states.length - 1], { kind: "move", from, to }));
      } else if (kind === "C") {
        const from = P(code[i++]);
        const over = P(code[i++]);
        const to = P(code[i++]);
        if (!Number.isInteger(from) || !Number.isInteger(over) || !Number.isInteger(to)) {
          return null;
        }
        states.push(applyMove(states[states.length - 1], { kind: "capture", from, to, over }));
      } else {
        return null;
      }
    }
    return states.length > 1 ? states : null;
  } catch {
    return null;
  }
}

/** Rebuild per-move Move list (for log text) from decoded states. */
export function movesFromHistory(history: GameState[]): Move[] {
  const out: Move[] = [];
  for (let i = 1; i < history.length; i++) {
    const m = diffStates(history[i - 1], history[i]);
    if (!m) break;
    out.push(m);
  }
  return out;
}

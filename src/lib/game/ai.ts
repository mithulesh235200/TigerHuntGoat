import { ADJACENCY, CENTRALITY, JUMPS } from "./board";
import {
  applyMove,
  legalMoves,
  tigerPositions,
  type GameState,
  type Move,
  type Side,
} from "./engine";

export type Difficulty = "easy" | "medium" | "hard";
export const DEPTH: Record<Difficulty, number> = { easy: 1, medium: 3, hard: 5 };

/** Positive = good for tigers, negative = good for goats. */
export function evaluate(s: GameState): number {
  if (s.winner === "tiger") return 100000;
  if (s.winner === "goat") return -100000;

  let score = 0;
  score += s.goatsCaptured * 1000;

  const tigers = tigerPositions(s);
  let mobility = 0;
  for (const t of tigers) {
    let free = 0;
    for (const n of ADJACENCY[t]) if (s.cells[n] === "empty") free++;
    for (const [over, to] of JUMPS[t]) {
      if (s.cells[over] === "goat" && s.cells[to] === "empty") score += 1000; // capture threat
    }
    mobility += free;
    if (free === 0) score -= 200; // fully cornered
    else if (free === 1) score -= 100; // partially cornered
    score += CENTRALITY[t] * 8; // reward high-mobility central nodes
  }
  score += mobility * 100;

  // Goats gain from compact, mutually defended formations.
  let goatSupport = 0;
  s.cells.forEach((c, i) => {
    if (c !== "goat") return;
    for (const n of ADJACENCY[i]) if (s.cells[n] === "goat") goatSupport++;
  });
  score -= goatSupport * 12;

  return score;
}

function ordered(s: GameState, moves: Move[]) {
  return [...moves].sort((a, b) => Number(b.kind === "capture") - Number(a.kind === "capture"));
}

function minimax(s: GameState, depth: number, alpha: number, beta: number): number {
  if (depth === 0 || s.winner) return evaluate(s);
  const moves = ordered(s, legalMoves(s));
  if (moves.length === 0) return evaluate(s);

  if (s.turn === "tiger") {
    let best = -Infinity;
    for (const m of moves) {
      best = Math.max(best, minimax(applyMove(s, m), depth - 1, alpha, beta));
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  }
  let best = Infinity;
  for (const m of moves) {
    best = Math.min(best, minimax(applyMove(s, m), depth - 1, alpha, beta));
    beta = Math.min(beta, best);
    if (beta <= alpha) break;
  }
  return best;
}

function limitMoves(s: GameState, moves: Move[], difficulty: Difficulty) {
  // Keep the search tractable during the goat placement phase on hard.
  if (s.turn !== "goat" || difficulty === "easy") return moves;
  const scored = moves
    .map((m) => ({ m, v: evaluate(applyMove(s, m)) }))
    .sort((a, b) => a.v - b.v);
  const width = difficulty === "hard" ? 8 : 12;
  return scored.slice(0, width).map((x) => x.m);
}

export function chooseMove(state: GameState, side: Side, difficulty: Difficulty): Move | null {
  const all = legalMoves(state);
  if (all.length === 0) return null;

  if (difficulty === "easy") {
    const captures = all.filter((m) => m.kind === "capture");
    const pool = captures.length ? captures : all;
    // greedy one-ply with a dash of randomness
    const scored = pool.map((m) => ({ m, v: evaluate(applyMove(state, m)) }));
    scored.sort((a, b) => (side === "tiger" ? b.v - a.v : a.v - b.v));
    const top = scored.slice(0, Math.max(1, Math.ceil(scored.length * 0.3)));
    return top[Math.floor(Math.random() * top.length)].m;
  }

  const depth = DEPTH[difficulty];
  const candidates = ordered(state, limitMoves(state, all, difficulty));
  let bestMove = candidates[0];
  let bestVal = side === "tiger" ? -Infinity : Infinity;
  let alpha = -Infinity;
  let beta = Infinity;

  for (const m of candidates) {
    const v = minimax(applyMove(state, m), depth - 1, alpha, beta);
    if (side === "tiger" ? v > bestVal : v < bestVal) {
      bestVal = v;
      bestMove = m;
    }
    if (side === "tiger") alpha = Math.max(alpha, bestVal);
    else beta = Math.min(beta, bestVal);
  }
  return bestMove;
}

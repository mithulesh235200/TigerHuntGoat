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
  score += s.goatsCaptured * 1200;

  const tigers = tigerPositions(s);
  const tigerMoves: number[] = [];
  let mobility = 0;

  for (const t of tigers) {
    let free = 0;
    for (const n of ADJACENCY[t]) {
      if (s.cells[n] === "empty") free++;
    }
    let captureThreats = 0;
    for (const [over, to] of JUMPS[t]) {
      if (s.cells[over] === "goat" && s.cells[to] === "empty") {
        captureThreats++;
        score += 1400;
      }
    }
    tigerMoves.push(free + captureThreats);
    mobility += free;
    if (free === 0) score -= 260;
    else if (free === 1) score -= 120;
    score += CENTRALITY[t] * 10;
    if (captureThreats > 0) score += captureThreats * 300;
  }
  score += mobility * 120;

  if (tigers.length === 0) score -= 15000;
  if (tigers.length === 1) score -= 4000;

  const goats = s.cells.filter((c) => c === "goat").length;
  let goatMobility = 0;
  let goatSupport = 0;
  s.cells.forEach((c, i) => {
    if (c !== "goat") return;
    for (const n of ADJACENCY[i]) {
      if (s.cells[n] === "empty") goatMobility++;
      if (s.cells[n] === "goat") goatSupport++;
    }
  });
  score -= goats * 25;
  score -= goatMobility * 20;
  score -= goatSupport * 18;

  const totalLegal = legalMoves(s).length;
  if (totalLegal > 0) score += Math.min(totalLegal, 12) * 15;

  return score;
}

function actionScore(s: GameState, move: Move) {
  const next = applyMove(s, move);
  const immediate = move.kind === "capture" ? 3000 : move.kind === "place" ? 400 : 0;
  return immediate + evaluate(next);
}

function stateKey(s: GameState): string {
  return `${s.cells.join("")}|${s.turn}|${s.goatsToPlace}|${s.goatsCaptured}|${s.winner ?? ""}`;
}

function ordered(s: GameState, moves: Move[]) {
  return [...moves].sort((a, b) => actionScore(s, b) - actionScore(s, a));
}

function minimax(s: GameState, depth: number, alpha: number, beta: number, path: Set<string> = new Set()): number {
  const key = stateKey(s);
  // Cycle guard: if this exact position already appeared earlier in the current
  // line, the play is looping forever — treat it as a draw instead of recursing.
  if (path.has(key)) return 0;
  if (depth === 0 || s.winner) return evaluate(s);

  path.add(key);
  try {
    const moves = ordered(s, legalMoves(s));
    if (moves.length === 0) return evaluate(s);

    if (s.turn === "tiger") {
      let best = -Infinity;
      for (const m of moves) {
        best = Math.max(best, minimax(applyMove(s, m), depth - 1, alpha, beta, path));
        alpha = Math.max(alpha, best);
        if (beta <= alpha) break;
      }
      return best;
    }
    let best = Infinity;
    for (const m of moves) {
      best = Math.min(best, minimax(applyMove(s, m), depth - 1, alpha, beta, path));
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  } finally {
    path.delete(key);
  }
}

function limitMoves(s: GameState, moves: Move[], difficulty: Difficulty) {
  // Prune the goat AI's candidate moves (both AI-vs-AI and human-hint paths use
  // this). `evaluate` is written tiger-perspective (positive = good for tigers),
  // so the GOAT must minimize while the TIGER must maximize.
  if (s.turn !== "goat" || difficulty === "easy") return moves;
  const scored = moves
    .map((m) => ({ m, v: actionScore(s, m) }))
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
    const v = minimax(applyMove(state, m), depth - 1, alpha, beta, new Set([stateKey(state)]));
    if (side === "tiger" ? v > bestVal : v < bestVal) {
      bestVal = v;
      bestMove = m;
    }
    if (side === "tiger") alpha = Math.max(alpha, bestVal);
    else beta = Math.min(beta, bestVal);
  }
  return bestMove;
}

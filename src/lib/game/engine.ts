import { ADJACENCY, JUMPS, NODE_COUNT } from "./board";

export type Side = "goat" | "tiger";
export type Cell = "empty" | "goat" | "tiger";

export const TOTAL_GOATS = 15;
export const CAPTURES_TO_WIN = 5;
export const TIGER_START = [0, 1, 2];

export type Move =
  | { kind: "place"; to: number }
  | { kind: "move"; from: number; to: number }
  | { kind: "capture"; from: number; to: number; over: number };

export type GameState = {
  cells: Cell[];
  turn: Side;
  goatsToPlace: number;
  goatsCaptured: number;
  winner: Side | null;
};

export function createGame(): GameState {
  const cells: Cell[] = Array<Cell>(NODE_COUNT).fill("empty");
  for (const t of TIGER_START) cells[t] = "tiger";
  return { cells, turn: "goat", goatsToPlace: TOTAL_GOATS, goatsCaptured: 0, winner: null };
}

export function cloneState(s: GameState): GameState {
  return { ...s, cells: [...s.cells] };
}

export function tigerPositions(s: GameState) {
  const out: number[] = [];
  s.cells.forEach((c, i) => c === "tiger" && out.push(i));
  return out;
}

export function legalMoves(s: GameState): Move[] {
  if (s.winner) return [];
  const moves: Move[] = [];
  if (s.turn === "tiger") {
    for (const from of tigerPositions(s)) {
      for (const [over, to] of JUMPS[from]) {
        if (s.cells[over] === "goat" && s.cells[to] === "empty") {
          moves.push({ kind: "capture", from, to, over });
        }
      }
      for (const to of ADJACENCY[from]) {
        if (s.cells[to] === "empty") moves.push({ kind: "move", from, to });
      }
    }
  } else {
    if (s.goatsToPlace > 0) {
      for (let i = 0; i < NODE_COUNT; i++) {
        if (s.cells[i] === "empty") moves.push({ kind: "place", to: i });
      }
    } else {
      for (let from = 0; from < NODE_COUNT; from++) {
        if (s.cells[from] !== "goat") continue;
        for (const to of ADJACENCY[from]) {
          if (s.cells[to] === "empty") moves.push({ kind: "move", from, to });
        }
      }
    }
  }
  return moves;
}

function tigerHasAnyMove(s: GameState) {
  for (const from of tigerPositions(s)) {
    for (const to of ADJACENCY[from]) if (s.cells[to] === "empty") return true;
    for (const [over, to] of JUMPS[from]) {
      if (s.cells[over] === "goat" && s.cells[to] === "empty") return true;
    }
  }
  return false;
}

export function applyMove(state: GameState, move: Move): GameState {
  const s = cloneState(state);
  if (move.kind === "place") {
    s.cells[move.to] = "goat";
    s.goatsToPlace -= 1;
  } else {
    const piece = s.cells[move.from];
    s.cells[move.from] = "empty";
    s.cells[move.to] = piece;
    if (move.kind === "capture") {
      s.cells[move.over] = "empty";
      s.goatsCaptured += 1;
    }
  }
  s.turn = state.turn === "goat" ? "tiger" : "goat";

  if (s.goatsCaptured >= CAPTURES_TO_WIN) s.winner = "tiger";
  else if (!tigerHasAnyMove(s)) s.winner = "goat";
  else if (s.turn === "goat" && legalMoves(s).length === 0) s.winner = "tiger";

  return s;
}

export function movesFrom(s: GameState, from: number): Move[] {
  return legalMoves(s).filter((m) => m.kind !== "place" && m.from === from) as Move[];
}

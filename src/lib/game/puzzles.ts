// Puzzle / Challenge Mode: pre-set board positions with specific objectives.
// Each puzzle defines a starting board, the side to move, the objective, and hints.
import type { GameState, Cell } from "./engine";
import { createGame } from "./engine";

export type PuzzleObjective = "capture" | "trap" | "place";

export type Puzzle = {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  objective: PuzzleObjective;
  objectiveText: string;
  hint: string;
  // Initial board state (cells array, turn, goatsToPlace, goatsCaptured)
  initial: () => GameState;
  // Check if the puzzle is solved given the current state
  isSolved: (state: GameState) => boolean;
  // Maximum moves allowed (null = unlimited)
  maxMoves?: number;
};

// Helper: create a custom board state
function customState(
  cells: Cell[],
  turn: "goat" | "tiger",
  goatsToPlace = 0,
  goatsCaptured = 0,
): GameState {
  return {
    cells,
    turn,
    goatsToPlace,
    goatsCaptured,
    winner: null,
  };
}

// ---- Puzzle 1: Tiger capture in 1 (easy) ----
// Tigers at apex and two adjacent points, goat in between - tiger can jump capture.
const puzzle1Cells: Cell[] = Array(23).fill("empty");
puzzle1Cells[0] = "tiger"; // apex
puzzle1Cells[3] = "goat"; // grid top-left
puzzle1Cells[8] = "empty";
puzzle1Cells[13] = "empty"; // landing spot for capture

export const PUZZLES: Puzzle[] = [
  {
    id: "tiger-capture-1",
    title: "The First Capture",
    difficulty: "easy",
    objective: "capture",
    objectiveText: "Capture a goat in one move as the tiger.",
    hint: "Jump the tiger over the goat into the empty space beyond.",
    initial: () => customState(puzzle1Cells, "tiger"),
    isSolved: (state) => state.goatsCaptured >= 1,
    maxMoves: 1,
  },
  // Add more puzzles programmatically below
];

// Generate additional puzzle variants with different board setups
function makeCapturePuzzle(
  id: string,
  title: string,
  tigerPos: number,
  goatPos: number,
  landingPos: number,
): Puzzle {
  const cells: Cell[] = Array(23).fill("empty");
  cells[tigerPos] = "tiger";
  cells[goatPos] = "goat";
  return {
    id,
    title,
    difficulty: "medium",
    objective: "capture",
    objectiveText: "Capture the goat as the tiger.",
    hint: "Position your tiger to jump over the goat into the empty landing spot.",
    initial: () => customState(cells, "tiger"),
    isSolved: (state) => state.goatsCaptured >= 1,
    maxMoves: 3,
  };
}

// Generate trap puzzles (goat must trap tigers)
function makeTrapPuzzle(
  id: string,
  title: string,
  tigerPositions: number[],
  goatPositions: number[],
): Puzzle {
  const cells: Cell[] = Array(23).fill("empty");
  for (const p of tigerPositions) cells[p] = "tiger";
  for (const p of goatPositions) cells[p] = "goat";
  return {
    id,
    title,
    difficulty: "hard",
    objective: "trap",
    objectiveText: "Trap all tigers so they have no legal moves.",
    hint: "Use your goats to block every escape route for the tigers.",
    initial: () => customState(cells, "goat", 0, 0),
    isSolved: (state) => state.winner === "goat",
    maxMoves: 10,
  };
}

// Add generated puzzles
PUZZLES.push(
  makeCapturePuzzle("tiger-capture-2", "Corner Trap", 0, 3, 13),
  makeCapturePuzzle("tiger-capture-3", "Side Strike", 3, 8, 13),
  makeCapturePuzzle("tiger-capture-4", "Center Jump", 8, 13, 18),
  makeTrapPuzzle("goat-trap-1", "The Pincer", [0, 1, 2], [3, 8, 13]),
  makeTrapPuzzle("goat-trap-2", "Box In", [0, 1, 2], [3, 4, 8]),
);

export function getPuzzleById(id: string): Puzzle | undefined {
  return PUZZLES.find((p) => p.id === id);
}

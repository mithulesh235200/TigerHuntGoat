import { createJiti } from "jiti";
const jiti = createJiti(import.meta.url);
const engine = await jiti.import("./src/lib/game/engine.ts");
const ai = await jiti.import("./src/lib/game/ai.ts");

const { createGame, legalMoves, applyMove, tigerPositions } = engine;
const { chooseMove } = ai;

function key(s) {
  return s.cells.join("") + "|" + s.turn + "|" + s.goatsToPlace + "|" + s.goatsCaptured + "|" + (s.winner ?? "");
}

let state = createGame();
const seen = new Map();
let plies = 0;
let repeats = 0;
let firstRepeat = { at: -1, k: "" };
while (!state.winner && plies < 1500) {
  const k = key(state);
  if (seen.has(k)) {
    repeats++;
    if (firstRepeat.at < 0) firstRepeat = { at: plies, k };
  }
  seen.set(k, plies);
  const moves = legalMoves(state);
  if (moves.length === 0) {
    console.log(`STUCK_NO_MOVES plies=${plies} winner=${state.winner}`);
    break;
  }
  const move = chooseMove(state, state.turn, "hard");
  if (!move) {
    console.log(`STUCK_NULL plies=${plies} winner=${state.winner}`);
    break;
  }
  state = applyMove(state, move);
  plies++;
}
console.log(`RESULT winner=${state.winner} plies=${plies} repeats=${repeats} firstRepeat=${JSON.stringify(firstRepeat)}`);
console.log(`FINAL_STATE ${JSON.stringify({ cells: state.cells, turn: state.turn, goatsToPlace: state.goatsToPlace, goatsCaptured: state.goatsCaptured, winner: state.winner })}`);
console.log("SIM_DONE_2");

import { chooseMove, type Difficulty } from "./ai";
import type { GameState, Move, Side } from "./engine";

type Req = { id: number; state: GameState; side: Side; difficulty: Difficulty };
type Res = { id: number; move: Move | null };

// Typed view of the worker global: the project's tsconfig only pulls in the
// DOM lib, so `self` is typed as Window here.
const ctx = self as unknown as {
  onmessage: ((e: MessageEvent<Req>) => void) | null;
  postMessage(message: Res): void;
};

ctx.onmessage = (e) => {
  const { id, state, side, difficulty } = e.data;
  try {
    ctx.postMessage({ id, move: chooseMove(state, side, difficulty) });
  } catch (error) {
    console.error("AI worker search failed", error);
    ctx.postMessage({ id, move: null });
  }
};

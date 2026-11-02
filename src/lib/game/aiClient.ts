import { chooseMove, type Difficulty } from "./ai";
import type { GameState, Move, Side } from "./engine";

/**
 * Off-main-thread `chooseMove`.
 *
 * The minimax search blocks for hundreds of milliseconds on "hard", which used
 * to freeze the travel animation and delay every reply. Running it in a worker
 * keeps the board animating and the UI responsive; if workers are unavailable
 * (SSR, blocked context) we fall back to a deferred synchronous search so the
 * caller still gets an answer without blocking the render that asked for it.
 */

type Job = {
  state: GameState;
  side: Side;
  difficulty: Difficulty;
  resolve: (move: Move | null) => void;
  timer?: ReturnType<typeof setTimeout>;
};

type Res = { id: number; move: Move | null };

// A search should never take this long; if the worker goes quiet, recompute
// on the main thread instead of leaving the game stuck waiting.
const WORKER_TIMEOUT_MS = 10_000;

let worker: Worker | null = null;
let disabled = false;
let seq = 0;
const pending = new Map<number, Job>();

function runSync(job: Job) {
  // Yield first so a slow search never blocks the render/effect that asked for it.
  setTimeout(() => {
    try {
      job.resolve(chooseMove(job.state, job.side, job.difficulty));
    } catch (error) {
      console.error("AI search failed", error);
      job.resolve(null);
    }
  }, 0);
}

function settle(id: number, move: Move | null) {
  const job = pending.get(id);
  if (!job) return;
  pending.delete(id);
  if (job.timer) clearTimeout(job.timer);
  job.resolve(move);
}

function getWorker(): Worker | null {
  if (disabled || typeof Worker === "undefined") return null;
  if (worker) return worker;
  try {
    const w = new Worker(new URL("./ai.worker.ts", import.meta.url), { type: "module" });
    w.onmessage = (e: MessageEvent<Res>) => settle(e.data.id, e.data.move);
    w.onerror = () => {
      disabled = true;
      w.terminate();
      worker = null;
      for (const [id, job] of [...pending]) {
        pending.delete(id);
        if (job.timer) clearTimeout(job.timer);
        runSync(job);
      }
    };
    worker = w;
    return w;
  } catch (error) {
    console.warn("AI worker unavailable, falling back to main thread", error);
    disabled = true;
    return null;
  }
}

export function chooseMoveAsync(
  state: GameState,
  side: Side,
  difficulty: Difficulty,
): Promise<Move | null> {
  return new Promise((resolve) => {
    const w = getWorker();
    if (!w) {
      runSync({ state, side, difficulty, resolve });
      return;
    }
    const id = ++seq;
    const job: Job = { state, side, difficulty, resolve };
    job.timer = setTimeout(() => {
      if (!pending.has(id)) return;
      pending.delete(id);
      runSync(job);
    }, WORKER_TIMEOUT_MS);
    pending.set(id, job);
    w.postMessage({ id, state, side, difficulty });
  });
}

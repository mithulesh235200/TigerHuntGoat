import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";

import { GameBoard } from "@/components/game/GameBoard";
import { Sidebar, type GameMode } from "@/components/game/Sidebar";
import { LABELS } from "@/lib/game/board";
import { chooseMove, type Difficulty } from "@/lib/game/ai";
import {
  applyMove,
  createGame,
  legalMoves,
  movesFrom,
  type GameState,
  type Move,
  type Side,
} from "@/lib/game/engine";
import { playSound } from "@/lib/game/sound";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aadu Puli Aatam — Goats & Tigers Strategy Game" },
      {
        name: "description",
        content:
          "Play Aadu Puli Aatam (Lambs and Tigers) online: 23-point board, 15 goats, 3 tigers, and a minimax AI opponent with three difficulty levels.",
      },
      { property: "og:title", content: "Aadu Puli Aatam — Goats & Tigers Strategy Game" },
      {
        property: "og:description",
        content:
          "The classic Tamil hunt game with a smart local AI: trap the tigers as goats, or capture five goats as tigers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function describe(move: Move, side: Side) {
  const who = side === "tiger" ? "🐯" : "🐐";
  if (move.kind === "place") return `${who} placed on ${LABELS[move.to]}`;
  if (move.kind === "capture")
    return `${who} ${LABELS[move.from]} → ${LABELS[move.to]}, captured ${LABELS[move.over]}`;
  return `${who} ${LABELS[move.from]} → ${LABELS[move.to]}`;
}

function Page() {
  const [history, setHistory] = useState<GameState[]>([createGame()]);
  const [log, setLog] = useState<string[]>([]);
  const [mode, setMode] = useState<GameMode>("goat-vs-ai");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [muted, setMuted] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [targets, setTargets] = useState<Move[]>([]);
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const [hint, setHint] = useState<Move | null>(null);
  const [status, setStatus] = useState("Place a goat on any empty point to begin.");
  const [thinking, setThinking] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const state = history[history.length - 1];
  const humanSide: Side | null =
    mode === "goat-vs-ai" ? "goat" : mode === "tiger-vs-ai" ? "tiger" : null;
  const aiSide: Side | null = humanSide === "goat" ? "tiger" : humanSide === "tiger" ? "goat" : null;
  const isAiTurn = !state.winner && aiSide === state.turn;

  const commit = useCallback(
    (next: GameState, move: Move, side: Side) => {
      setHistory((h) => [...h, next]);
      setLog((l) => [...l, describe(move, side)]);
      setLastMove(move);
      setHint(null);
      setSelected(null);
      setTargets([]);
      playSound(move.kind === "capture" ? "capture" : move.kind === "place" ? "place" : "move", muted);
      if (next.winner) {
        const humanWon = humanSide ? next.winner === humanSide : true;
        playSound(humanWon ? "win" : "lose", muted);
        setStatus(
          next.winner === "tiger"
            ? "Tigers captured 5 goats and win the hunt."
            : "All tigers are trapped — the goats win!",
        );
      } else if (move.kind === "capture") {
        setStatus(`A goat was captured on ${LABELS[move.over]}.`);
      } else {
        setStatus(next.turn === "goat" ? "Goats to move." : "Tigers to move.");
      }
    },
    [humanSide, muted],
  );

  // AI turn
  useEffect(() => {
    if (!isAiTurn || !aiSide) return;
    setThinking(true);
    timer.current = setTimeout(() => {
      const move = chooseMove(state, aiSide, difficulty);
      setThinking(false);
      if (!move) return;
      commit(applyMove(state, move), move, aiSide);
    }, 350);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [isAiTurn, aiSide, state, difficulty, commit]);

  const handleNode = (i: number) => {
    if (state.winner || thinking || isAiTurn) return;
    setHint(null);
    const side = state.turn;
    const all = legalMoves(state);

    if (side === "goat" && state.goatsToPlace > 0) {
      const place = all.find((m) => m.kind === "place" && m.to === i);
      if (!place) {
        playSound("invalid", muted);
        setStatus("That point is occupied — pick an empty one.");
        return;
      }
      commit(applyMove(state, place), place, side);
      return;
    }

    if (selected !== null) {
      const chosen = targets.find((m) => m.to === i);
      if (chosen) {
        commit(applyMove(state, chosen), chosen, side);
        return;
      }
    }

    if (state.cells[i] === side) {
      const options = movesFrom(state, i);
      setSelected(i);
      setTargets(options);
      if (options.length === 0) {
        playSound("invalid", muted);
        setStatus("That piece has no legal move.");
      } else {
        setStatus("Choose a highlighted destination.");
      }
      return;
    }

    setSelected(null);
    setTargets([]);
    playSound("invalid", muted);
    setStatus("Select one of your own pieces first.");
  };

  const newGame = () => {
    setHistory([createGame()]);
    setLog([]);
    setLastMove(null);
    setHint(null);
    setSelected(null);
    setTargets([]);
    setStatus("New game. Goats place first.");
  };

  const undo = () => {
    if (history.length < 2) return;
    // step back over the AI reply too
    const steps = aiSide && history.length > 2 ? 2 : 1;
    setHistory((h) => h.slice(0, Math.max(1, h.length - steps)));
    setLog((l) => l.slice(0, Math.max(0, l.length - steps)));
    setLastMove(null);
    setHint(null);
    setSelected(null);
    setTargets([]);
    setStatus("Move undone.");
  };

  const showHint = () => {
    if (state.winner || thinking || isAiTurn) return;
    const suggested = chooseMove(state, state.turn, difficulty);
    if (!suggested) {
      setStatus("No legal move is available.");
      return;
    }
    setHint(suggested);
    setSelected(null);
    setTargets([]);
    setStatus(`Tactical hint: ${describe(suggested, state.turn)}.`);
  };

  return (
    <main className="min-h-screen bg-background px-4 py-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 text-center lg:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Traditional Tamil hunt game
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-foreground lg:text-5xl">
            Aadu Puli Aatam
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground lg:text-base">
            Three tigers hunt fifteen goats on a 23-point board. Trap every tiger to win as the
            herd, or devour five goats to win the hunt.
          </p>
        </header>

        <div className="flex flex-col items-start gap-8 lg:flex-row">
          <div className="flex w-full flex-1 justify-center">
            <GameBoard
              state={state}
              selected={selected}
              targets={targets}
              lastMove={lastMove}
              hint={hint}
              interactive={!state.winner && !isAiTurn && !thinking}
              onNodeClick={handleNode}
            />
          </div>
          <Sidebar
            state={state}
            mode={mode}
            difficulty={difficulty}
            muted={muted}
            status={status}
            log={log}
            thinking={thinking}
            canUndo={history.length > 1 && !thinking}
            canHint={!state.winner && !thinking && !isAiTurn}
            onMode={(m) => {
              setMode(m);
              newGame();
            }}
            onDifficulty={setDifficulty}
            onToggleMute={() => setMuted((v) => !v)}
            onNewGame={newGame}
            onReset={newGame}
            onUndo={undo}
            onHint={showHint}
          />
        </div>
      </div>
    </main>
  );
}

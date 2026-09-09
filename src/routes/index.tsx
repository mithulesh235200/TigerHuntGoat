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
import { createRoomChannel } from "@/lib/online";
import type { RealtimeChannel } from "@supabase/supabase-js";

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

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

const SETTINGS_KEY = "aadu-puli-aatam-settings";
const MATCH_KEY = "aadu-puli-aatam-active-match";

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
  const [gameStarted, setGameStarted] = useState(false);
  const [turnTimeLeft, setTurnTimeLeft] = useState(30);
  const [challengeMode, setChallengeMode] = useState(false);
  const [sessionCount, setSessionCount] = useState(1);
  const [matchStats, setMatchStats] = useState({
    games: 0,
    goatWins: 0,
    tigerWins: 0,
    currentStreak: 0,
  });
  const [roomId, setRoomId] = useState<string | null>(null);
  const [onlineRole, setOnlineRole] = useState<"goat" | "tiger">("goat");
  const [copied, setCopied] = useState(false);
  const [matchLoaded, setMatchLoaded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onlineChannel = useRef<RealtimeChannel | null>(null);
  const receivedOnlineState = useRef(false);
  const historyRef = useRef(history);
  const logRef = useRef(log);
  const lastMoveRef = useRef(lastMove);
  const TURN_TIME_LIMIT = 30;

  historyRef.current = history;
  logRef.current = log;
  lastMoveRef.current = lastMove;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedMatch = window.localStorage.getItem(MATCH_KEY);
    if (savedMatch) {
      try {
        const parsed = JSON.parse(savedMatch) as {
          history?: GameState[];
          log?: string[];
          mode?: GameMode;
          challengeMode?: boolean;
          sessionCount?: number;
          roomId?: string | null;
        };
        if (parsed.history?.length) {
          setHistory(parsed.history);
          setLog(parsed.log ?? []);
          if (parsed.mode) setMode(parsed.mode);
          if (typeof parsed.challengeMode === "boolean") setChallengeMode(parsed.challengeMode);
          if (parsed.sessionCount) setSessionCount(parsed.sessionCount);
          if (parsed.roomId) setRoomId(parsed.roomId);
          setGameStarted(true);
          setStatus("Match restored. Continue where you left off.");
        }
      } catch {
        window.localStorage.removeItem(MATCH_KEY);
      }
    }
    setMatchLoaded(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !matchLoaded || !gameStarted) return;

    window.localStorage.setItem(
      MATCH_KEY,
      JSON.stringify({
        history,
        log,
        mode,
        challengeMode,
        sessionCount,
        roomId,
      }),
    );
  }, [history, log, mode, challengeMode, sessionCount, roomId, gameStarted, matchLoaded]);

  useEffect(() => {
    if (mode !== "online" || !roomId || !gameStarted) return;
    const channel = createRoomChannel(roomId);
    if (!channel) {
      setStatus("Online rooms need VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
      return;
    }

    onlineChannel.current = channel;
    channel
      .on("broadcast", { event: "state" }, ({ payload }) => {
        if (payload.senderRole === onlineRole || !payload.history?.length) return;
        receivedOnlineState.current = true;
        setHistory(payload.history as GameState[]);
        setLog((payload.log as string[]) ?? []);
        setLastMove((payload.lastMove as Move | null) ?? null);
        setHint(null);
        setSelected(null);
        setTargets([]);
        setStatus("Opponent moved. Your turn.");
      })
      .on("broadcast", { event: "request-state" }, () => {
        if (onlineRole !== "goat") return;
        void channel.send({
          type: "broadcast",
          event: "state",
          payload: {
            senderRole: onlineRole,
            history: historyRef.current,
            log: logRef.current,
            lastMove: lastMoveRef.current,
          },
        });
      })
      .subscribe((status) => {
        if (status !== "SUBSCRIBED") return;
        if (onlineRole === "tiger") {
          void channel.send({ type: "broadcast", event: "request-state", payload: {} });
        } else {
          void channel.send({
            type: "broadcast",
            event: "state",
            payload: {
              senderRole: onlineRole,
              history: historyRef.current,
              log: logRef.current,
              lastMove: lastMoveRef.current,
            },
          });
        }
      });

    return () => {
      onlineChannel.current = null;
      void channel.unsubscribe();
    };
  }, [gameStarted, mode, onlineRole, roomId]);

  useEffect(() => {
    if (mode !== "online" || !onlineChannel.current) return;
    if (receivedOnlineState.current) {
      receivedOnlineState.current = false;
      return;
    }
    void onlineChannel.current.send({
      type: "broadcast",
      event: "state",
      payload: {
        senderRole: onlineRole,
        history,
        log,
        lastMove,
      },
    });
  }, [history, lastMove, log, mode, onlineRole]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const saved = window.localStorage.getItem(SETTINGS_KEY);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as {
        mode?: GameMode;
        difficulty?: Difficulty;
        muted?: boolean;
        challengeMode?: boolean;
      };

      if (parsed.mode) setMode(parsed.mode);
      if (parsed.difficulty) setDifficulty(parsed.difficulty);
      if (typeof parsed.muted === "boolean") setMuted(parsed.muted);
      if (typeof parsed.challengeMode === "boolean") setChallengeMode(parsed.challengeMode);
    } catch {
      // Ignore invalid settings.
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const settings = {
      mode,
      difficulty,
      muted,
      challengeMode,
    };

    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [mode, difficulty, muted, challengeMode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("aadu-puli-aatam-stats");
    if (!saved) return;
    try {
      setMatchStats(JSON.parse(saved));
    } catch {
      // Ignore invalid stored data.
    }
  }, []);

  // Check URL search parameters for shared 2-player room
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlMode = params.get("mode");
      const urlRoom = params.get("room");
      if (urlMode === "hotseat" || urlMode === "online" || urlRoom) {
        const nextMode = urlMode === "online" ? "online" : "hotseat";
        setMode(nextMode);
        setOnlineRole(params.get("role") === "tiger" ? "tiger" : "goat");
        if (urlRoom) {
          setRoomId(urlRoom);
          if (nextMode === "online") setGameStarted(true);
          setStatus(
            nextMode === "online"
              ? `Joined online room #${urlRoom}. Waiting for the host.`
              : `Joined 2-Player Match (Room #${urlRoom}). Goats place first!`,
          );
        } else {
          const newId = generateRoomId();
          setRoomId(newId);
        }
      }
    }
  }, []);

  const handleCopyInviteLink = useCallback(() => {
    let currentId = roomId;
    if (!currentId) {
      currentId = generateRoomId();
      setRoomId(currentId);
    }
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const pathname = typeof window !== "undefined" ? window.location.pathname : "/";
    const inviteUrl = `${origin}${pathname}?mode=hotseat&room=${currentId}`;

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(inviteUrl);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    setStatus(
      mode === "online"
        ? "Online invite copied. Your opponent can join from another device."
        : "Local match link copied. Open it on this device to resume the hotseat setup.",
    );
  }, [mode, roomId]);

  const state = history[history.length - 1];
  const challengeOpeningNodes = new Set([10, 11, 12, 13, 14, 15, 16, 17, 18]);
  const humanSide: Side | null =
    mode === "goat-vs-ai" || (mode === "online" && onlineRole === "goat")
      ? "goat"
      : mode === "tiger-vs-ai" || (mode === "online" && onlineRole === "tiger")
        ? "tiger"
        : null;
  const aiSide: Side | null =
    humanSide === "goat" ? "tiger" : humanSide === "tiger" ? "goat" : null;
  const isAiTurn = !state.winner && aiSide === state.turn;
  const isRemoteTurn = mode === "online" && state.turn !== onlineRole;
  const turnMoves = legalMoves(state);
  const captureMoves = turnMoves.filter((move) => move.kind === "capture");
  const coachInsight = state.winner
    ? "Match complete. Review the move feed to find the turning point."
    : captureMoves.length > 0
      ? `Capture window: ${captureMoves.length} jump${captureMoves.length === 1 ? " is" : "s are"} available. Take it before the herd can close the gap.`
      : state.turn === "goat" && state.goatsToPlace > 0
        ? challengeMode && state.goatsToPlace === 15
          ? "Opening read: claim a central point to build a flexible herd formation."
          : "Herd read: place near the center, then connect goats so the tigers lose escape routes."
        : state.turn === "tiger" && turnMoves.length <= 2
          ? "Danger read: tiger mobility is low. Create an escape route before hunting another goat."
          : state.goatsCaptured >= 3
            ? "Endgame pressure: two more captures finish the hunt. Prefer safe jumps over risky repositioning."
            : "Position read: keep pressure on the center and look for a jump that also preserves mobility.";
  const suggestedMove =
    !state.winner && !isAiTurn ? chooseMove(state, state.turn, difficulty) : null;
  const suggestedMoveText = suggestedMove ? describe(suggestedMove, state.turn) : "—";
  const summary = {
    winnerLabel: state.winner === "tiger" ? "Tigers" : "Goats",
    totalMoves: log.length,
    goatsCaptured: state.goatsCaptured,
    session: sessionCount,
    challenge: challengeMode ? "Challenge" : "Standard",
  };

  useEffect(() => {
    if (!gameStarted || state.winner) return;
    setTurnTimeLeft(TURN_TIME_LIMIT);
  }, [state.turn, state.winner, history.length, gameStarted]);

  useEffect(() => {
    if (!gameStarted || state.winner || thinking || isAiTurn) return;
    const interval = setInterval(() => {
      setTurnTimeLeft((value) => {
        if (value <= 1) {
          setStatus((current) =>
            current.includes("Time")
              ? current
              : `${state.turn === "goat" ? "Goats" : "Tigers"} are running out of time — move quickly!`,
          );
          return 0;
        }
        return value - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [state.turn, state.winner, thinking, isAiTurn, gameStarted]);

  const commit = useCallback(
    (next: GameState, move: Move, side: Side) => {
      setHistory((h) => [...h, next]);
      setLog((l) => [...l, describe(move, side)]);
      setLastMove(move);
      setHint(null);
      setSelected(null);
      setTargets([]);
      playSound(
        move.kind === "capture" ? "capture" : move.kind === "place" ? "place" : "move",
        muted,
      );
      if (next.winner) {
        const humanWon = humanSide ? next.winner === humanSide : true;
        playSound(humanWon ? "win" : "lose", muted);
        setMatchStats((prev) => {
          const updated = {
            games: prev.games + 1,
            goatWins: prev.goatWins + (next.winner === "goat" ? 1 : 0),
            tigerWins: prev.tigerWins + (next.winner === "tiger" ? 1 : 0),
            currentStreak: next.winner === "goat" ? prev.currentStreak + 1 : 0,
          };
          if (typeof window !== "undefined") {
            window.localStorage.setItem("aadu-puli-aatam-stats", JSON.stringify(updated));
          }
          return updated;
        });
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
    if (state.winner || thinking || isAiTurn || isRemoteTurn) return;
    setHint(null);
    const side = state.turn;
    const all = legalMoves(state);

    if (side === "goat" && state.goatsToPlace > 0) {
      if (challengeMode && state.goatsToPlace === 15 && !challengeOpeningNodes.has(i)) {
        playSound("invalid", muted);
        setStatus("Challenge mode: the opening goat must be placed on a central point.");
        return;
      }
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
    setSessionCount((count) => count + 1);
    setHistory([createGame()]);
    setLog([]);
    setLastMove(null);
    setHint(null);
    setSelected(null);
    setTargets([]);
    setStatus("New game. Goats place first.");
    setTurnTimeLeft(TURN_TIME_LIMIT);
    setGameStarted(true);
  };

  const startMatch = (nextMode?: GameMode) => {
    if (nextMode) {
      setMode(nextMode);
      if (nextMode === "hotseat") {
        const id = generateRoomId();
        setRoomId(id);
        setStatus(`Local 2-player match ready. Room #${id}. Goats start first.`);
        } else if (nextMode === "online") {
          const id = generateRoomId();
          setRoomId(id);
          setOnlineRole("goat");
          setStatus(`Online room #${id} created. Copy the invite for the Tiger player.`);
      } else {
        setStatus(
          nextMode === "goat-vs-ai"
            ? "Goats to move. Pick a square to place."
            : "Tigers to move. The AI is setting up.",
        );
      }
    }
    setSessionCount((count) => count + 1);
    setGameStarted(true);
    setHistory([createGame()]);
    setLog([]);
    setLastMove(null);
    setHint(null);
    setSelected(null);
    setTargets([]);
    setTurnTimeLeft(TURN_TIME_LIMIT);
  };

  const undo = useCallback(() => {
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
  }, [aiSide, history.length]);

  const showHint = useCallback(() => {
    if (state.winner || thinking || isAiTurn || isRemoteTurn) return;
    const suggested = chooseMove(state, state.turn, difficulty);
    if (!suggested) {
      setStatus("No legal move is available.");
      return;
    }
    setHint(suggested);
    setSelected(null);
    setTargets([]);
    setStatus(`Tactical hint: ${describe(suggested, state.turn)}.`);
  }, [difficulty, isAiTurn, isRemoteTurn, state, thinking]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") return;

      if (event.key === "Escape") {
        setSelected(null);
        setTargets([]);
        setHint(null);
        return;
      }

      if (event.repeat) return;
      if (event.key.toLowerCase() === "h") showHint();
      if (event.key.toLowerCase() === "n") newGame();
      if (event.key.toLowerCase() === "u") undo();
      if (event.key.toLowerCase() === "m") setMuted((value) => !value);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [difficulty, history.length, isAiTurn, showHint, state, thinking, undo]);

  return (
    <main className="min-h-screen bg-background px-4 py-8 lg:px-10">
      {!gameStarted && !state.winner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 px-4 backdrop-blur-md">
          <div className="w-full max-w-2xl rounded-[2rem] border border-amber-500/30 bg-gradient-to-b from-stone-900 via-stone-950 to-stone-950 p-8 text-center shadow-[0_30px_80px_rgba(0,0,0,0.8)] ring-1 ring-white/5">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-[10px] font-bold uppercase tracking-[0.32em] text-amber-300">
              Traditional Strategy Game
            </div>
            <h2 className="mt-5 text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-orange-500 sm:text-5xl">
              Aadu Puli Aatam
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-stone-300 sm:text-base">
              Three tigers hunt fifteen goats on a 23-point board. Pick your mode, then trap or
              capture your way to the win.
            </p>

            <div className="mt-6 flex items-center justify-center">
              <button
                type="button"
                onClick={() => setChallengeMode((value) => !value)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] transition-all ${
                  challengeMode
                    ? "border-amber-500/50 bg-amber-500/10 text-amber-200"
                    : "border-stone-700 bg-stone-900/80 text-stone-300"
                }`}
              >
                <span>Challenge Mode</span>
                <span className="rounded-full bg-stone-950/80 px-2 py-0.5 text-[9px]">
                  {challengeMode ? "ON" : "OFF"}
                </span>
              </button>
            </div>

            <div className="mt-6 grid gap-3 text-left text-sm text-stone-300 sm:grid-cols-2 lg:grid-cols-4">
              <button
                onClick={() => startMatch("goat-vs-ai")}
                className={`rounded-2xl border p-4 text-left transition-all ${
                  mode === "goat-vs-ai"
                    ? "border-emerald-500/50 bg-emerald-500/10 shadow-lg shadow-emerald-900/20"
                    : "border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40"
                }`}
              >
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
                  Goats
                </div>
                <div className="mt-2 font-semibold">Play as the herd</div>
                <div className="mt-1 text-xs text-stone-400">vs AI Tigers</div>
              </button>

              <button
                onClick={() => startMatch("tiger-vs-ai")}
                className={`rounded-2xl border p-4 text-left transition-all ${
                  mode === "tiger-vs-ai"
                    ? "border-amber-500/50 bg-amber-500/10 shadow-lg shadow-amber-900/20"
                    : "border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40"
                }`}
              >
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">
                  Tigers
                </div>
                <div className="mt-2 font-semibold">Play as the hunters</div>
                <div className="mt-1 text-xs text-stone-400">vs AI Goats</div>
              </button>

              <button
                onClick={() => startMatch("hotseat")}
                className={`rounded-2xl border p-4 text-left transition-all ${
                  mode === "hotseat"
                    ? "border-sky-500/50 bg-sky-500/10 shadow-lg shadow-sky-900/20"
                    : "border-sky-500/20 bg-sky-500/5 hover:border-sky-500/40"
                }`}
              >
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-sky-300">
                  Local
                </div>
                <div className="mt-2 font-semibold">Two-player match</div>
                <div className="mt-1 text-xs text-stone-400">Same device</div>
              </button>

              <button
                onClick={() => startMatch("online")}
                className={`rounded-2xl border p-4 text-left transition-all ${
                  mode === "online"
                    ? "border-cyan-500/50 bg-cyan-500/10 shadow-lg shadow-cyan-900/20"
                    : "border-cyan-500/20 bg-cyan-500/5 hover:border-cyan-500/40"
                }`}
              >
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
                  Online
                </div>
                <div className="mt-2 font-semibold">Invite a friend</div>
                <div className="mt-1 text-xs text-stone-400">Across devices</div>
              </button>
            </div>

            {challengeMode && (
              <p className="mt-4 text-xs font-medium uppercase tracking-[0.18em] text-amber-200">
                Opening Rule: first goat must land on a central point.
              </p>
            )}

            <button
              onClick={() => startMatch(mode)}
              className="mt-8 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 text-sm font-black uppercase tracking-[0.22em] text-stone-950 shadow-lg shadow-amber-900/40 transition-transform hover:scale-[1.02] active:scale-95"
            >
              Start Match
            </button>
          </div>
        </div>
      )}

      {state.winner && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-stone-950/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[2rem] border border-amber-500/20 bg-gradient-to-b from-stone-900 via-stone-950 to-stone-950 p-8 text-center shadow-[0_30px_80px_rgba(0,0,0,0.85)] ring-1 ring-white/5">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.28em] text-amber-300">
              Match Complete
            </div>
            <h3 className="mt-5 text-3xl font-black text-stone-100">
              {state.winner === "tiger" ? "🐯 Tigers Win!" : "🐐 Goats Win!"}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-stone-300">
              {state.winner === "tiger"
                ? "The predators captured five goats and sealed the hunt."
                : "The herd trapped all three tigers and defended the board."}
            </p>

            <div className="mt-6 grid gap-3 text-left text-sm text-stone-300 sm:grid-cols-3">
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300">
                  Winner
                </div>
                <div className="mt-2 text-lg font-black text-stone-100">{summary.winnerLabel}</div>
              </div>

              <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-3">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-300">
                  Moves
                </div>
                <div className="mt-2 text-lg font-black text-stone-100">{summary.totalMoves}</div>
              </div>

              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300">
                  Captures
                </div>
                <div className="mt-2 text-lg font-black text-stone-100">
                  {summary.goatsCaptured}
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between rounded-xl border border-stone-700 bg-stone-950/60 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-300">
              <span>Session</span>
              <span>#{summary.session}</span>
              <span>{summary.challenge}</span>
            </div>

            <div className="mt-7 flex gap-3">
              <button
                onClick={newGame}
                className="flex-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-sm font-black uppercase tracking-[0.22em] text-stone-950 shadow-lg shadow-emerald-950/40 transition-transform hover:scale-[1.02] active:scale-95"
              >
                Play Again
              </button>
              <button
                onClick={() => setGameStarted(false)}
                className="flex-1 rounded-full border border-stone-700 bg-stone-900/80 px-6 py-3 text-sm font-black uppercase tracking-[0.22em] text-stone-200 transition-transform hover:scale-[1.02] active:scale-95"
              >
                Menu
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl">
        <header className="mb-10 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-amber-400 backdrop-blur-md">
            <span>ஆடு புலி ஆட்டம்</span>
            <span className="h-1 w-1 rounded-full bg-amber-400" />
            <span>Traditional Tamil Hunt Strategy</span>
          </div>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 lg:text-6xl drop-shadow-sm">
            Aadu Puli Aatam
          </h1>
          <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-stone-400 lg:text-base">
            Three tigers hunt fifteen goats on a 23-point strategic grid. Trap all three tigers to
            win as the herd, or capture five goats as the predators.
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
              interactive={!state.winner && !isAiTurn && !isRemoteTurn && !thinking && gameStarted}
              turnTimeLeft={turnTimeLeft}
              turnTimeLimit={TURN_TIME_LIMIT}
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
            legalMovesCount={turnMoves.length}
            suggestedMove={suggestedMoveText}
            coachInsight={coachInsight}
            turnTimeLeft={turnTimeLeft}
            turnTimeLimit={TURN_TIME_LIMIT}
            matchStats={matchStats}
            challengeMode={challengeMode}
            sessionCount={sessionCount}
            roomId={roomId}
            onlineRole={onlineRole}
            copied={copied}
            onCopyInviteLink={handleCopyInviteLink}
            onMode={(m) => {
              setMode(m);
              if (m === "online") {
                setRoomId(generateRoomId());
                setOnlineRole("goat");
              }
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

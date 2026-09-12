import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  HelpCircle,
  BookOpen,
  Volume2,
  VolumeX,
  Sparkles,
  Trophy,
  Swords,
  Shield,
  RotateCcw,
  Flame,
  X,
  Keyboard,
  Share2,
  Gamepad2,
} from "lucide-react";

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
  const who = side === "tiger" ? "🐯 Tiger" : "🐐 Goat";
  if (move.kind === "place") return `${who} placed on ${LABELS[move.to]}`;
  if (move.kind === "capture")
    return `${who} jumped ${LABELS[move.from]} → ${LABELS[move.to]} (Captured ${LABELS[move.over]})`;
  return `${who} moved ${LABELS[move.from]} → ${LABELS[move.to]}`;
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
  const [showRulesModal, setShowRulesModal] = useState(false);
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

    const params = new URLSearchParams(window.location.search);
    const urlMode = params.get("mode");
    const urlRoom = params.get("room");
    const urlRole = params.get("role");

    // Priority 1: Check URL parameters when joining via room link
    if (urlRoom || urlMode === "online" || urlMode === "hotseat") {
      const nextMode = urlMode === "online" ? "online" : "hotseat";
      setMode(nextMode);
      setOnlineRole(urlRole === "tiger" ? "tiger" : "goat");
      const currentRoom = urlRoom || generateRoomId();
      setRoomId(currentRoom);
      setHistory([createGame()]);
      setLog([]);
      setLastMove(null);
      setGameStarted(true);
      setStatus(
        nextMode === "online"
          ? `Joined online room #${currentRoom}. Connecting to opponent...`
          : `Joined 2-Player Match (Room #${currentRoom}). Goats place first!`,
      );
      setMatchLoaded(true);
      return;
    }

    // Priority 2: Restore local match if available
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

    onlineChannel.current = channel as any;
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
        setStatus("Opponent moved. Your turn!");
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

  const handleCopyInviteLink = useCallback(() => {
    let currentId = roomId;
    if (!currentId) {
      currentId = generateRoomId();
      setRoomId(currentId);
    }
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const pathname = typeof window !== "undefined" ? window.location.pathname : "/";
    const inviteUrl = `${origin}${pathname}?mode=${mode}&room=${currentId}&role=tiger`;

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(inviteUrl);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    setStatus(
      mode === "online"
        ? "Online invite link copied. Share with your opponent!"
        : "Local match link copied to clipboard.",
    );
  }, [mode, roomId]);

  const state = history[history.length - 1];
  const challengeOpeningNodes = new Set([10, 11, 12, 13, 14, 15, 16, 17, 18]);
  const humanSide: Side | null =
    mode === "goat-vs-ai"
      ? "goat"
      : mode === "tiger-vs-ai"
        ? "tiger"
        : mode === "online"
          ? onlineRole
          : null;

  const aiSide: Side | null =
    mode === "goat-vs-ai"
      ? "tiger"
      : mode === "tiger-vs-ai"
        ? "goat"
        : null;

  const isAiTurn = !state.winner && aiSide !== null && aiSide === state.turn;
  const isRemoteTurn = mode === "online" && state.turn !== onlineRole;
  const turnMoves = legalMoves(state);
  const captureMoves = turnMoves.filter((move) => move.kind === "capture");

  const coachInsight = state.winner
    ? "Match complete. Review the move log to see tactical turning points."
    : captureMoves.length > 0
      ? `Tactical strike window: ${captureMoves.length} jump${captureMoves.length === 1 ? " is" : "s are"} available.`
      : state.turn === "goat" && state.goatsToPlace > 0
        ? challengeMode && state.goatsToPlace === 15
          ? "Opening Rule: place goat on a central point to maximize herd defense."
          : "Herd Strategy: place goats near center to construct blocking barriers against tigers."
        : state.turn === "tiger" && turnMoves.length <= 2
          ? "Critical Danger: Tiger mobility is restricted. Find an escape route immediately!"
          : state.goatsCaptured >= 3
            ? "Predator Pressure: 2 more captures seal victory for the Tigers."
            : "Strategic Read: maintain central control and look for tactical jump openings.";

  const suggestedMove =
    !state.winner && !isAiTurn ? chooseMove(state, state.turn, difficulty) : null;
  const suggestedMoveText = suggestedMove ? describe(suggestedMove, state.turn) : "—";
  const summary = {
    winnerLabel: state.winner === "tiger" ? "Tigers" : "Goats",
    totalMoves: log.length,
    goatsCaptured: state.goatsCaptured,
    session: sessionCount,
    challenge: challengeMode ? "Challenge Rule" : "Standard Rule",
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
              : `${state.turn === "goat" ? "Goats" : "Tigers"} are running low on turn time!`,
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
            ? "Tigers captured 5 goats and win the hunt!"
            : "All tigers are trapped — the goats win!",
        );
      } else if (move.kind === "capture") {
        setStatus(`A goat was captured on point ${LABELS[move.over]}.`);
      } else {
        setStatus(next.turn === "goat" ? "Goats turn to move." : "Tigers turn to move.");
      }
    },
    [humanSide, muted],
  );

  // AI turn execution
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
        setStatus("Challenge Rule: first goat must land on a central point.");
        return;
      }
      const place = all.find((m) => m.kind === "place" && m.to === i);
      if (!place) {
        playSound("invalid", muted);
        setStatus("That point is occupied — choose an empty node.");
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
        setStatus("That piece has no legal destination.");
      } else {
        setStatus("Choose a highlighted destination point.");
      }
      return;
    }

    setSelected(null);
    setTargets([]);
    playSound("invalid", muted);
    setStatus("Select your own piece first.");
  };

  const newGame = () => {
    setSessionCount((count) => count + 1);
    setHistory([createGame()]);
    setLog([]);
    setLastMove(null);
    setHint(null);
    setSelected(null);
    setTargets([]);
    setStatus("New game started. Goats place first.");
    setTurnTimeLeft(TURN_TIME_LIMIT);
    setGameStarted(true);
  };

  const goToMainMenu = useCallback(() => {
    setHistory([createGame()]);
    setLog([]);
    setLastMove(null);
    setHint(null);
    setSelected(null);
    setTargets([]);
    setStatus("Place a goat on any empty point to begin.");
    setTurnTimeLeft(TURN_TIME_LIMIT);
    setGameStarted(false);
  }, []);

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
        setStatus(`Online room #${id} created. Copy invite link for Tiger player.`);
      } else {
        setStatus(
          nextMode === "goat-vs-ai"
            ? "Goats to move. Select an empty point."
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
      setStatus("No legal move available.");
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
        setShowRulesModal(false);
        return;
      }

      if (event.repeat) return;
      if (event.key.toLowerCase() === "h") showHint();
      if (event.key.toLowerCase() === "n") newGame();
      if (event.key.toLowerCase() === "u") undo();
      if (event.key.toLowerCase() === "m") setMuted((value) => !value);
      if (event.key.toLowerCase() === "?") setShowRulesModal((v) => !v);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [difficulty, history.length, isAiTurn, showHint, state, thinking, undo]);

  return (
    <main className="min-h-screen bg-background text-stone-100 pb-16">
      {/* Top Glassmorphic Navigation Header Bar */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-stone-950/80 px-4 py-3.5 backdrop-blur-xl lg:px-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          {/* Logo & Subtitle */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-500/40 bg-gradient-to-tr from-amber-500/20 to-orange-500/20 text-xl shadow-lg shadow-amber-950/50">
              🐯
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-orange-500">
                  Aadu Puli Aatam
                </h1>
                <span className="hidden rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-amber-300 sm:inline-block">
                  ஆடு புலி ஆட்டம்
                </span>
              </div>
              <p className="text-[11px] font-semibold text-stone-400">
                Traditional Tamil Hunt & Strategy Game
              </p>
            </div>
          </div>

          {/* Quick Header Actions & Modals */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowRulesModal(true)}
              className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-300 transition-all hover:bg-amber-500/20 hover:scale-105 active:scale-95"
            >
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">How to Play</span>
            </button>

            <button
              onClick={() => setMuted((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-800 bg-stone-900/90 text-stone-300 transition-all hover:bg-stone-800 hover:text-white"
              title={muted ? "Unmute Audio" : "Mute Audio"}
            >
              {muted ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4 text-emerald-400" />}
            </button>

            {gameStarted ? (
              <button
                onClick={goToMainMenu}
                className="flex items-center gap-1.5 rounded-xl border border-stone-800 bg-stone-900/90 px-3 py-1.5 text-xs font-bold text-stone-300 transition-all hover:bg-stone-800 hover:text-white active:scale-95"
              >
                <span>Main Menu</span>
              </button>
            ) : (
              <button
                onClick={() => setGameStarted(true)}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-stone-950 shadow-lg shadow-amber-950/40 transition-transform hover:scale-105 active:scale-95"
              >
                <span>Play Game</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Rules & How-To-Play Dialog Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/85 p-4 backdrop-blur-md">
          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-amber-500/30 bg-gradient-to-b from-stone-900 via-stone-950 to-stone-950 p-6 sm:p-8 shadow-[0_30px_90px_rgba(0,0,0,0.9)]">
            <button
              onClick={() => setShowRulesModal(false)}
              className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-stone-900 text-stone-400 transition-colors hover:bg-stone-800 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-amber-300">
              <HelpCircle className="h-3.5 w-3.5" />
              Game Guide & Strategy
            </div>

            <h2 className="mt-3 text-2xl font-black text-stone-100 sm:text-3xl">
              How to Play Aadu Puli Aatam
            </h2>
            <p className="mt-2 text-xs text-stone-400 sm:text-sm">
              Aadu Puli Aatam (Lambs & Tigers) is an asymmetric ancient South Indian strategy board game played on a 23-vertex grid.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {/* Goats Rules */}
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <div className="flex items-center gap-2 font-black text-emerald-400">
                  <Shield className="h-5 w-5" />
                  <span>The Goat Herd (15 Goats)</span>
                </div>
                <ul className="mt-3 space-y-2 text-xs text-stone-300">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span><strong>Placement Phase:</strong> Place 1 goat per turn onto any empty point. Goats cannot move until all 15 are placed.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span><strong>Movement Phase:</strong> Once all 15 goats are placed, goats move 1 step along connected lines to adjacent empty points.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span><strong>Victory Condition:</strong> Surround and completely trap all 3 Tigers so they have 0 legal moves available.</span>
                  </li>
                </ul>
              </div>

              {/* Tigers Rules */}
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                <div className="flex items-center gap-2 font-black text-amber-400">
                  <Swords className="h-5 w-5" />
                  <span>The Tigers (3 Tigers)</span>
                </div>
                <ul className="mt-3 space-y-2 text-xs text-stone-300">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <span><strong>Setup & Movement:</strong> Tigers start on predefined apex positions and move 1 step along connected lines.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <span><strong>Capture Mechanics:</strong> Tigers capture a goat by jumping over 1 adjacent goat into an empty space along a straight line path.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <span><strong>Victory Condition:</strong> Capture 5 goats, rendering it impossible for goats to block all 3 tigers.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Controls & Shortcuts */}
            <div className="mt-6 rounded-2xl border border-white/10 bg-stone-950/80 p-4">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-stone-300">
                <Keyboard className="h-4 w-4 text-amber-400" />
                <span>Keyboard Hotkeys</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-stone-400 sm:grid-cols-4">
                <div className="rounded-xl bg-stone-900 p-2 text-center">
                  <kbd className="rounded bg-stone-800 px-1.5 py-0.5 font-mono text-[10px] text-amber-300 font-bold">H</kbd> Tactical Hint
                </div>
                <div className="rounded-xl bg-stone-900 p-2 text-center">
                  <kbd className="rounded bg-stone-800 px-1.5 py-0.5 font-mono text-[10px] text-amber-300 font-bold">U</kbd> Undo Move
                </div>
                <div className="rounded-xl bg-stone-900 p-2 text-center">
                  <kbd className="rounded bg-stone-800 px-1.5 py-0.5 font-mono text-[10px] text-amber-300 font-bold">N</kbd> New Game
                </div>
                <div className="rounded-xl bg-stone-900 p-2 text-center">
                  <kbd className="rounded bg-stone-800 px-1.5 py-0.5 font-mono text-[10px] text-amber-300 font-bold">Esc</kbd> Clear Selection
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowRulesModal(false)}
              className="mt-6 flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-xs font-black uppercase tracking-wider text-stone-950 shadow-lg shadow-amber-950/40 transition-all hover:brightness-110"
            >
              Got It, Let's Play!
            </button>
          </div>
        </div>
      )}

      {/* Initial Match Setup Overlay */}
      {!gameStarted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/85 px-4 backdrop-blur-md">
          <div className="w-full max-w-2xl rounded-3xl border border-amber-500/30 bg-gradient-to-b from-stone-900 via-stone-950 to-stone-950 p-8 text-center shadow-[0_30px_90px_rgba(0,0,0,0.9)] ring-1 ring-white/10">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-[10px] font-bold uppercase tracking-[0.32em] text-amber-300">
              <Sparkles className="h-3.5 w-3.5" />
              Traditional Tamil Strategy Game
            </div>
            <h2 className="mt-5 text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-orange-500 sm:text-5xl">
              Aadu Puli Aatam
            </h2>
            <p className="mt-4 text-xs leading-relaxed text-stone-300 sm:text-sm">
              Three tigers hunt fifteen goats on a 23-point grid. Choose your side, test your strategic vision against the AI or invite friends.
            </p>

            <div className="mt-6 flex items-center justify-center">
              <button
                type="button"
                onClick={() => setChallengeMode((value) => !value)}
                className={`inline-flex items-center gap-2.5 rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] transition-all ${
                  challengeMode
                    ? "border-amber-400/60 bg-amber-500/20 text-amber-200 shadow-md shadow-amber-950/50"
                    : "border-stone-800 bg-stone-900/80 text-stone-400"
                }`}
              >
                <Flame className="h-3.5 w-3.5 text-amber-400" />
                <span>Challenge Opening Mode</span>
                <span className="rounded-full bg-stone-950 px-2 py-0.5 text-[9px] font-extrabold text-amber-400">
                  {challengeMode ? "ON" : "OFF"}
                </span>
              </button>
            </div>

            {/* Mode Select Grid */}
            <div className="mt-6 grid gap-3 text-left text-xs text-stone-300 sm:grid-cols-2 lg:grid-cols-4">
              <button
                onClick={() => startMatch("goat-vs-ai")}
                className={`rounded-2xl border p-4 text-left transition-all ${
                  mode === "goat-vs-ai"
                    ? "border-emerald-500/60 bg-emerald-500/15 shadow-lg shadow-emerald-950/30"
                    : "border-white/5 bg-stone-950/60 hover:border-emerald-500/30"
                }`}
              >
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">
                  Goats
                </div>
                <div className="mt-2 font-bold text-stone-100">Play as the Herd</div>
                <div className="mt-1 text-[11px] text-stone-400">vs Minimax AI Tigers</div>
              </button>

              <button
                onClick={() => startMatch("tiger-vs-ai")}
                className={`rounded-2xl border p-4 text-left transition-all ${
                  mode === "tiger-vs-ai"
                    ? "border-amber-500/60 bg-amber-500/15 shadow-lg shadow-amber-950/30"
                    : "border-white/5 bg-stone-950/60 hover:border-amber-500/30"
                }`}
              >
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">
                  Tigers
                </div>
                <div className="mt-2 font-bold text-stone-100">Play as the Hunters</div>
                <div className="mt-1 text-[11px] text-stone-400">vs Minimax AI Goats</div>
              </button>

              <button
                onClick={() => startMatch("hotseat")}
                className={`rounded-2xl border p-4 text-left transition-all ${
                  mode === "hotseat"
                    ? "border-sky-500/60 bg-sky-500/15 shadow-lg shadow-sky-950/30"
                    : "border-white/5 bg-stone-950/60 hover:border-sky-500/30"
                }`}
              >
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-400">
                  Local 2P
                </div>
                <div className="mt-2 font-bold text-stone-100">Hotseat Match</div>
                <div className="mt-1 text-[11px] text-stone-400">Same device</div>
              </button>

              <button
                onClick={() => startMatch("online")}
                className={`rounded-2xl border p-4 text-left transition-all ${
                  mode === "online"
                    ? "border-cyan-500/60 bg-cyan-500/15 shadow-lg shadow-cyan-950/30"
                    : "border-white/5 bg-stone-950/60 hover:border-cyan-500/30"
                }`}
              >
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">
                  Online
                </div>
                <div className="mt-2 font-bold text-stone-100">Invite a Friend</div>
                <div className="mt-1 text-[11px] text-stone-400">Realtime channel</div>
              </button>
            </div>

            <button
              onClick={() => startMatch(mode)}
              className="mt-8 inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-3.5 text-xs font-black uppercase tracking-[0.22em] text-stone-950 shadow-xl shadow-amber-950/50 transition-transform hover:scale-[1.03] active:scale-95"
            >
              Start Battle Match
            </button>
          </div>
        </div>
      )}

      {/* Match Complete Victory Celebration Overlay */}
      {state.winner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 px-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-amber-500/40 bg-gradient-to-b from-stone-900 via-stone-950 to-stone-950 p-8 text-center shadow-[0_30px_90px_rgba(0,0,0,0.95)] ring-1 ring-white/10">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-[10px] font-bold uppercase tracking-[0.28em] text-amber-300">
              <Trophy className="h-4 w-4 text-amber-400 animate-bounce" />
              Match Victory Complete
            </div>

            <h3 className="mt-5 text-3xl font-black text-stone-100">
              {state.winner === "tiger" ? "🐯 Tigers Win!" : "🐐 Goats Win!"}
            </h3>

            <p className="mt-3 text-xs leading-relaxed text-stone-300">
              {state.winner === "tiger"
                ? "The predators captured 5 goats and dominated the board."
                : "The goat herd successfully trapped all 3 tigers!"}
            </p>

            <div className="mt-6 grid grid-cols-3 gap-2.5 text-center text-xs">
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Winner</div>
                <div className="mt-1 text-base font-black text-stone-100">{summary.winnerLabel}</div>
              </div>

              <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-sky-400">Moves</div>
                <div className="mt-1 text-base font-black text-stone-100">{summary.totalMoves}</div>
              </div>

              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Captures</div>
                <div className="mt-1 text-base font-black text-stone-100">{summary.goatsCaptured}</div>
              </div>
            </div>

            <div className="mt-7 flex gap-3">
              <button
                onClick={newGame}
                className="flex-1 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3.5 text-xs font-black uppercase tracking-wider text-stone-950 shadow-xl shadow-emerald-950/40 transition-transform hover:scale-[1.02] active:scale-95"
              >
                Play Again
              </button>
              <button
                onClick={goToMainMenu}
                className="flex-1 rounded-2xl border border-stone-800 bg-stone-900/90 py-3.5 text-xs font-black uppercase tracking-wider text-stone-200 transition-transform hover:scale-[1.02] active:scale-95"
              >
                Main Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Game Section */}
      <div className="mx-auto max-w-7xl px-4 pt-6 lg:px-8">
        <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-start lg:justify-between">
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

import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { Confetti } from "@/components/game/Confetti";
import { PwaBadges } from "@/components/game/PwaBadges";
import { ThemePicker } from "@/components/game/ThemePicker";
import { Tutorial } from "@/components/game/Tutorial";
import {
  Sidebar,
  type GameMode,
  type TimeoutRule,
  type TimeoutSecs,
} from "@/components/game/Sidebar";
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
import { applyTheme, getSavedTheme, isThemeId, type ThemeId } from "@/lib/theme";
import { createRoomChannel, type UnifiedRealtimeChannel } from "@/lib/online";
import { describeMove } from "@/lib/describe";
import { decodeMoves, encodeHistory, movesFromHistory } from "@/lib/replay";
import { buzz, shareOrCopy } from "@/lib/device";
import { getSavedLang, useLang, type Lang } from "@/lib/i18n";
import { loadRecords, saveRecords, type GameRecord } from "@/lib/stats";

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

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

const SETTINGS_KEY = "aadu-puli-aatam-settings";
const MATCH_KEY = "aadu-puli-aatam-active-match";
const TOUR_KEY = "aadu-puli-aatam-tour-seen";

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
  const [theme, setTheme] = useState<ThemeId>("ember");
  const { lang, t, setLang: setLangStore } = useLang();
  const [timeoutSecs, setTimeoutSecs] = useState<TimeoutSecs>(30);
  const [timeoutRule, setTimeoutRule] = useState<TimeoutRule>("warn");
  const [records, setRecords] = useState<GameRecord[]>(() =>
    typeof window === "undefined" ? [] : loadRecords(),
  );
  const [viewingIndex, setViewingIndex] = useState<number | null>(null);
  const [replayCopied, setReplayCopied] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  const changeTheme = useCallback((th: ThemeId) => {
    setTheme(th);
    applyTheme(th);
  }, []);

  const changeLang = useCallback(
    (l: Lang) => {
      setLangStore(l);
    },
    [setLangStore],
  );

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onlineChannel = useRef<UnifiedRealtimeChannel | null>(null);
  const receivedOnlineState = useRef(false);
  const historyRef = useRef(history);
  const logRef = useRef(log);
  const lastMoveRef = useRef(lastMove);

  historyRef.current = history;
  logRef.current = log;
  lastMoveRef.current = lastMove;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const urlMode = params.get("mode");
    const urlRoom = params.get("room");
    const urlRole = params.get("role");
    const urlReplay = params.get("replay");

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
          ? t.sJoinedOnline.replace("{room}", currentRoom)
          : t.sJoinedLocal.replace("{room}", currentRoom),
      );
      setMatchLoaded(true);
      return;
    }

    // Priority 2: Shared replay link (?replay=...)
    if (urlReplay) {
      const decoded = decodeMoves(urlReplay);
      if (decoded) {
        const moves = movesFromHistory(decoded);
        let side: Side = "goat";
        const lines = moves.map((m) => {
          const line = describeMove(m, side, t);
          side = side === "goat" ? "tiger" : "goat";
          return line;
        });
        setHistory(decoded);
        setLog(lines);
        setLastMove(null);
        setGameStarted(true);
        setViewingIndex(0);
        setStatus(t.replayLoaded);
        setMatchLoaded(true);
        return;
      }
    }

    // Priority 3: Restore local match if available
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
          setStatus(t.sRestored);
        }
      } catch {
        window.localStorage.removeItem(MATCH_KEY);
      }
    }

    // First-ever visit: offer the interactive tour on the setup screen.
    try {
      if (!window.localStorage.getItem(TOUR_KEY) && !savedMatch && !urlReplay) {
        setShowTutorial(true);
      }
    } catch {
      // ignore
    }
    setMatchLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // Online rooms need network — stay on local game while offline.
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setStatus(t.sOfflinePause);
      return;
    }
    const channel = createRoomChannel(roomId);

    onlineChannel.current = channel;
    channel
      .on("broadcast", { event: "state" }, ({ payload }) => {
        if (payload.senderRole === onlineRole || !payload.history?.length) return;
        receivedOnlineState.current = true;
        const incoming = payload.history as GameState[];
        const wasLive = historyRef.current.length > 1 && incoming.length === 1;
        setHistory(incoming);
        setLog((payload.log as string[]) ?? []);
        setLastMove((payload.lastMove as Move | null) ?? null);
        setHint(null);
        setSelected(null);
        setTargets([]);
        setViewingIndex(null);
        setStatus(wasLive ? t.sRematch : t.sOpponentMoved);
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
  }, [gameStarted, mode, onlineRole, roomId, t]);

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
        theme?: unknown;
        timeoutSecs?: unknown;
        timeoutRule?: unknown;
      };

      if (parsed.mode) setMode(parsed.mode);
      if (parsed.difficulty) setDifficulty(parsed.difficulty);
      if (typeof parsed.muted === "boolean") setMuted(parsed.muted);
      if (typeof parsed.challengeMode === "boolean") setChallengeMode(parsed.challengeMode);
      if (parsed.timeoutSecs === 15 || parsed.timeoutSecs === 30 || parsed.timeoutSecs === 60) {
        setTimeoutSecs(parsed.timeoutSecs);
        setTurnTimeLeft(parsed.timeoutSecs);
      }
      if (parsed.timeoutRule === "warn" || parsed.timeoutRule === "forfeit") {
        setTimeoutRule(parsed.timeoutRule);
      }
      if (isThemeId(parsed.theme)) {
        setTheme(parsed.theme);
        applyTheme(parsed.theme);
      } else {
        applyTheme(getSavedTheme());
        setTheme(getSavedTheme());
      }
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
      theme,
      timeoutSecs,
      timeoutRule,
    };

    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [mode, difficulty, muted, challengeMode, theme, timeoutSecs, timeoutRule]);

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

  const handleCopyInviteLink = useCallback(async () => {
    let currentId = roomId;
    if (!currentId) {
      currentId = generateRoomId();
      setRoomId(currentId);
    }
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const pathname = typeof window !== "undefined" ? window.location.pathname : "/";
    const inviteUrl = `${origin}${pathname}?mode=${mode}&room=${currentId}&role=tiger`;

    const result = await shareOrCopy({
      title: "Aadu Puli Aatam — join my match",
      text: t.sInviteOnline,
      url: inviteUrl,
    });
    if (result === "shared") {
      setStatus(t.sInviteShared);
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    setStatus(
      result === "copied" ? (mode === "online" ? t.sInviteOnline : t.sInviteLocal) : t.replayFailed,
    );
  }, [mode, roomId, t]);

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
    mode === "goat-vs-ai" ? "tiger" : mode === "tiger-vs-ai" ? "goat" : null;

  const isAiTurn = !state.winner && aiSide !== null && aiSide === state.turn;
  const isRemoteTurn = mode === "online" && state.turn !== onlineRole;
  const turnMoves = legalMoves(state);
  const captureMoves = turnMoves.filter((move) => move.kind === "capture");

  const coachInsight = state.winner
    ? t.coachDone
    : captureMoves.length > 0
      ? (captureMoves.length === 1 ? t.coachCapture : t.coachCapturePlural).replace(
          "{n}",
          String(captureMoves.length),
        )
      : state.turn === "goat" && state.goatsToPlace > 0
        ? challengeMode && state.goatsToPlace === 15
          ? t.coachOpening
          : t.coachHerd
        : state.turn === "tiger" && turnMoves.length <= 2
          ? t.coachDanger
          : state.goatsCaptured >= 3
            ? t.coachPressure
            : t.coachDefault;

  const suggestedMove = useMemo(
    () => (!state.winner && !isAiTurn ? chooseMove(state, state.turn, difficulty) : null),
    // state is derived from history; history.length + turn + placement + captures cover it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      history.length,
      state.turn,
      state.goatsToPlace,
      state.goatsCaptured,
      state.winner,
      isAiTurn,
      difficulty,
    ],
  );
  const suggestedMoveText = suggestedMove ? describeMove(suggestedMove, state.turn, t) : "—";
  const summary = {
    winnerLabel: state.winner === "tiger" ? t.tigerWins : t.goatWins,
    totalMoves: log.length,
    goatsCaptured: state.goatsCaptured,
    session: sessionCount,
    challenge: challengeMode ? t.challengeRule : t.controlsTitle,
  };
  const histMoves = useMemo(() => movesFromHistory(history), [history]);
  const boardState = viewingIndex == null ? state : (history[viewingIndex] ?? state);
  const boardLastMove = viewingIndex == null ? lastMove : (histMoves[viewingIndex - 1] ?? null);
  const viewingTotal = history.length - 1;

  useEffect(() => {
    if (!gameStarted || state.winner) return;
    setTurnTimeLeft(timeoutSecs);
  }, [state.turn, state.winner, history.length, gameStarted, timeoutSecs]);

  const warnedRef = useRef(false);
  useEffect(() => {
    warnedRef.current = false;
  }, [state.turn, history.length]);

  useEffect(() => {
    if (!gameStarted || state.winner || thinking || isAiTurn || isRemoteTurn) return;
    const interval = setInterval(() => {
      // Pure updater — side effects (warn/forfeit) live in the zero-effect below.
      setTurnTimeLeft((value) => (value <= 0 ? 0 : value - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [state.turn, state.winner, thinking, isAiTurn, isRemoteTurn, gameStarted]);

  // Fires exactly once when the clock hits zero.
  useEffect(() => {
    if (!gameStarted || state.winner || thinking || isAiTurn || isRemoteTurn) return;
    if (turnTimeLeft !== 0 || warnedRef.current) return;
    warnedRef.current = true;
    if (timeoutRule === "forfeit") {
      forfeit(state.turn, state);
    } else {
      setStatus(state.turn === "goat" ? t.sTimeLowGoat : t.sTimeLowTiger);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnTimeLeft, gameStarted, state.winner, thinking, isAiTurn, isRemoteTurn, timeoutRule, t]);

  const recordWin = useCallback(
    (winner: Side, fullHistory: GameState[], forfeit?: boolean) => {
      const humanWon = humanSide ? winner === humanSide : true;
      playSound(humanWon ? "win" : "lose", muted);
      buzz(humanWon ? [50, 50, 120] : [80]);
      setMatchStats((prev) => {
        const updated = {
          games: prev.games + 1,
          goatWins: prev.goatWins + (winner === "goat" ? 1 : 0),
          tigerWins: prev.tigerWins + (winner === "tiger" ? 1 : 0),
          currentStreak: winner === "goat" ? prev.currentStreak + 1 : 0,
        };
        if (typeof window !== "undefined") {
          window.localStorage.setItem("aadu-puli-aatam-stats", JSON.stringify(updated));
        }
        return updated;
      });
      const finalState = fullHistory[fullHistory.length - 1];
      setRecords((prev) => {
        const next = [
          ...prev,
          {
            d: Date.now(),
            w: winner,
            m: fullHistory.length - 1,
            c: finalState.goatsCaptured,
            mode,
          },
        ];
        saveRecords(next);
        return next.slice(-120);
      });
      if (forfeit) {
        setStatus(winner === "tiger" ? t.sForfeitTigerWin : t.sForfeitGoatWin);
      } else {
        setStatus(winner === "tiger" ? t.sTigerWin : t.sGoatWin);
      }
    },
    [humanSide, muted, mode, t],
  );

  const forfeit = useCallback(
    (side: Side, state: GameState) => {
      if (state.winner) return;
      const winner: Side = side === "goat" ? "tiger" : "goat";
      const next: GameState = { ...state, cells: [...state.cells], winner };
      setHistory((h) => [...h, next]);
      setLog((l) => [...l, side === "goat" ? t.forfeitLogGoat : t.forfeitLogTiger]);
      setLastMove(null);
      setHint(null);
      setSelected(null);
      setTargets([]);
      playSound("lose", muted);
      recordWin(winner, [...historyRef.current, next], true);
    },
    [muted, recordWin, t],
  );

  const commit = useCallback(
    (next: GameState, move: Move, side: Side) => {
      setHistory((h) => [...h, next]);
      setLog((l) => [...l, describeMove(move, side, t)]);
      setLastMove(move);
      setHint(null);
      setSelected(null);
      setTargets([]);
      setViewingIndex(null);
      playSound(
        move.kind === "capture" ? "capture" : move.kind === "place" ? "place" : "move",
        muted,
      );
      if (move.kind === "capture") buzz([30, 40, 30]);
      else buzz(10);
      if (next.winner) {
        recordWin(next.winner, [...historyRef.current, next]);
      } else if (move.kind === "capture") {
        setStatus(t.sCaptured.replace("{node}", LABELS[move.over]));
      } else {
        setStatus(next.turn === "goat" ? t.sGoatsMove : t.sTigersMove);
      }
    },
    [recordWin, muted, t],
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
    setViewingIndex(null);
    setHint(null);
    const side = state.turn;
    const all = legalMoves(state);

    if (side === "goat" && state.goatsToPlace > 0) {
      if (challengeMode && state.goatsToPlace === 15 && !challengeOpeningNodes.has(i)) {
        playSound("invalid", muted);
        buzz(25);
        setStatus(t.sChallengeFirst);
        return;
      }
      const place = all.find((m) => m.kind === "place" && m.to === i);
      if (!place) {
        playSound("invalid", muted);
        buzz(25);
        setStatus(t.sOccupied);
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
        buzz(25);
        setStatus(t.sNoDest);
      } else {
        playSound("select", muted);
        setStatus(t.sChooseDest);
      }
      return;
    }

    setSelected(null);
    setTargets([]);
    playSound("invalid", muted);
    buzz(25);
    setStatus(t.sSelectOwn);
  };

  const newGame = useCallback(() => {
    setSessionCount((count) => count + 1);
    setHistory([createGame()]);
    setLog([]);
    setLastMove(null);
    setHint(null);
    setSelected(null);
    setTargets([]);
    setViewingIndex(null);
    setStatus(t.sNewGame);
    setTurnTimeLeft(timeoutSecs);
    setGameStarted(true);
  }, [t, timeoutSecs]);

  const toggleChallenge = useCallback(() => {
    setChallengeMode((value) => !value);
  }, []);

  const goToMainMenu = useCallback(() => {
    setHistory([createGame()]);
    setLog([]);
    setLastMove(null);
    setHint(null);
    setSelected(null);
    setTargets([]);
    setViewingIndex(null);
    setStatus(t.sPlaceFirst);
    setTurnTimeLeft(timeoutSecs);
    setGameStarted(false);
  }, [t, timeoutSecs]);

  const startMatch = (nextMode?: GameMode) => {
    if (nextMode) {
      setMode(nextMode);
      if (nextMode === "hotseat") {
        const id = generateRoomId();
        setRoomId(id);
        setStatus(t.sLocalReady.replace("{room}", id));
      } else if (nextMode === "online") {
        const id = generateRoomId();
        setRoomId(id);
        setOnlineRole("goat");
        setStatus(t.sOnlineCreated.replace("{room}", id));
      } else {
        setStatus(nextMode === "goat-vs-ai" ? t.sGoatsAI : t.sTigersAI);
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
    setViewingIndex(null);
    setTurnTimeLeft(timeoutSecs);
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
    setViewingIndex(null);
    setStatus(t.sUndone);
  }, [aiSide, history.length, t]);

  const showHint = useCallback(() => {
    if (state.winner || thinking || isAiTurn || isRemoteTurn) return;
    const suggested = chooseMove(state, state.turn, difficulty);
    if (!suggested) {
      setStatus(t.sNoLegal);
      return;
    }
    setHint(suggested);
    setSelected(null);
    setTargets([]);
    setStatus(t.sHint.replace("{move}", describeMove(suggested, state.turn, t)));
  }, [difficulty, isAiTurn, isRemoteTurn, state, thinking, t]);

  const stepReplay = useCallback((delta: number) => {
    setViewingIndex((v) => {
      const total = historyRef.current.length;
      const cur = v ?? total - 1;
      const next = Math.min(total - 1, Math.max(0, cur + delta));
      return next === total - 1 ? null : next;
    });
    setSelected(null);
    setTargets([]);
    setHint(null);
  }, []);

  const exitReplay = useCallback(() => {
    setViewingIndex(null);
  }, []);

  const handleCopyReplay = useCallback(async () => {
    const code = encodeHistory(historyRef.current);
    if (!code || typeof window === "undefined") return;
    const url = `${window.location.origin}${window.location.pathname}?replay=${code}`;
    const result = await shareOrCopy({
      title: "Aadu Puli Aatam replay",
      text: t.replayLoaded,
      url,
    });
    if (result === "shared") setStatus(t.replayShared);
    else if (result === "copied") {
      setReplayCopied(true);
      setTimeout(() => setReplayCopied(false), 2500);
      setStatus(t.replayCopied);
    } else if (result === "failed") setStatus(t.replayFailed);
  }, [t]);

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
      if (event.key === "ArrowLeft") stepReplay(-1);
      if (event.key === "ArrowRight") stepReplay(1);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showHint, undo, newGame, stepReplay]);

  const handleModeChange = useCallback(
    (m: GameMode) => {
      setMode(m);
      if (m === "online") {
        if (typeof navigator !== "undefined" && !navigator.onLine) {
          setStatus(t.sOfflineSwitch);
          setMode("hotseat");
          setRoomId(generateRoomId());
        } else {
          setRoomId(generateRoomId());
          setOnlineRole("goat");
        }
      }
      newGame();
    },
    [newGame, t],
  );

  return (
    <main className="min-h-screen bg-background font-sans text-stone-100 antialiased selection:bg-[var(--a-chip)] pb-16">
      <PwaBadges />
      {/* Top Glassmorphic Navigation Header Bar */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-stone-950/80 px-4 py-3 backdrop-blur-xl lg:px-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          {/* Logo & Subtitle */}
          <div className="flex items-center gap-3">
            <div className="t-icon-tile flex h-10 w-10 animate-float items-center justify-center rounded-2xl text-xl">
              🐯
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="t-text-gradient text-lg font-black tracking-tight">
                  Aadu Puli Aatam
                </h1>
                <span className="t-chip hidden rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest sm:inline-block">
                  ஆடு புலி ஆட்டம்
                </span>
              </div>
              <p className="text-[11px] font-semibold text-stone-400">{t.tagline}</p>
            </div>
          </div>

          {/* Quick Header Actions & Modals */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => changeLang(lang === "ta" ? "en" : "ta")}
              className="flex items-center rounded-xl border border-stone-800 bg-stone-900/90 px-2.5 py-1.5 text-xs font-black text-stone-200 transition-all hover:bg-stone-800 active:scale-95"
              title={lang === "ta" ? "English" : "தமிழ்"}
            >
              {t.langToggle}
            </button>
            <button
              onClick={() => setShowRulesModal(true)}
              className="t-chip flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all hover:scale-105 hover:brightness-125 active:scale-95"
            >
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">{t.howToPlay}</span>
            </button>

            <button
              onClick={() => setMuted((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-800 bg-stone-900/90 text-stone-300 transition-all hover:bg-stone-800 hover:text-white"
              title={muted ? t.unmuteAudio : t.muteAudio}
            >
              {muted ? (
                <VolumeX className="h-4 w-4 text-rose-400" />
              ) : (
                <Volume2 className="h-4 w-4 text-emerald-400" />
              )}
            </button>

            {gameStarted ? (
              <button
                onClick={goToMainMenu}
                className="flex items-center gap-1.5 rounded-xl border border-stone-800 bg-stone-900/90 px-3 py-1.5 text-xs font-bold text-stone-300 transition-all hover:bg-stone-800 hover:text-white active:scale-95"
              >
                <span>{t.mainMenu}</span>
              </button>
            ) : (
              <button
                onClick={() => setGameStarted(true)}
                className="t-btn-primary flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-black uppercase tracking-wider transition-transform hover:scale-105 active:scale-95"
              >
                <span>{t.playGame}</span>
              </button>
            )}
          </div>
        </div>
        <div className="t-hairline mx-auto mt-2.5 h-px max-w-7xl opacity-70" />
      </header>

      {/* Rules & How-To-Play Dialog Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/85 p-4 backdrop-blur-md">
          <div className="t-board-frame t-overlay-card overlay-pop relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-gradient-to-b from-stone-900 via-stone-950 to-stone-950 p-6 sm:p-8">
            <button
              onClick={() => setShowRulesModal(false)}
              className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-stone-900 text-stone-400 transition-colors hover:bg-stone-800 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="t-chip inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-[10px] font-bold uppercase tracking-[0.25em]">
              <HelpCircle className="h-3.5 w-3.5" />
              {t.guideKicker}
            </div>

            <h2 className="mt-3 text-2xl font-black text-stone-100 sm:text-3xl">{t.guideTitle}</h2>
            <p className="mt-2 text-xs text-stone-400 sm:text-sm">{t.guideDesc}</p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {/* Goats Rules */}
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <div className="flex items-center gap-2 font-black text-emerald-400">
                  <Shield className="h-5 w-5" />
                  <span>{t.goatsTitle}</span>
                </div>
                <ul className="mt-3 space-y-2 text-xs text-stone-300">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-emerald-400">•</span>
                    <span>{t.goatR1}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-emerald-400">•</span>
                    <span>{t.goatR2}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-emerald-400">•</span>
                    <span>{t.goatR3}</span>
                  </li>
                </ul>
              </div>

              {/* Tigers Rules */}
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                <div className="flex items-center gap-2 font-black text-amber-400">
                  <Swords className="h-5 w-5" />
                  <span>{t.tigerTitle}</span>
                </div>
                <ul className="mt-3 space-y-2 text-xs text-stone-300">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-amber-400">•</span>
                    <span>{t.tigerR1}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-amber-400">•</span>
                    <span>{t.tigerR2}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-amber-400">•</span>
                    <span>{t.tigerR3}</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Controls & Shortcuts */}
            <div className="mt-6 rounded-2xl border border-white/10 bg-stone-950/80 p-4">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-stone-300">
                <Keyboard className="h-4 w-4 t-accent-text" />
                <span>{t.hotkeys}</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-stone-400 sm:grid-cols-4">
                <div className="rounded-xl bg-stone-900 p-2 text-center">
                  <kbd className="t-accent-text rounded bg-stone-800 px-1.5 py-0.5 font-mono text-[10px] font-bold">
                    H
                  </kbd>{" "}
                  {t.kHint}
                </div>
                <div className="rounded-xl bg-stone-900 p-2 text-center">
                  <kbd className="t-accent-text rounded bg-stone-800 px-1.5 py-0.5 font-mono text-[10px] font-bold">
                    U
                  </kbd>{" "}
                  {t.kUndo}
                </div>
                <div className="rounded-xl bg-stone-900 p-2 text-center">
                  <kbd className="t-accent-text rounded bg-stone-800 px-1.5 py-0.5 font-mono text-[10px] font-bold">
                    N
                  </kbd>{" "}
                  {t.kNew}
                </div>
                <div className="rounded-xl bg-stone-900 p-2 text-center">
                  <kbd className="t-accent-text rounded bg-stone-800 px-1.5 py-0.5 font-mono text-[10px] font-bold">
                    Esc
                  </kbd>{" "}
                  {t.kEsc}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowRulesModal(false)}
              className="t-btn-primary mt-6 flex w-full items-center justify-center rounded-2xl py-3 text-xs font-black uppercase tracking-wider transition-all hover:brightness-110"
            >
              {t.gotIt}
            </button>
          </div>
        </div>
      )}

      {/* Initial Match Setup Overlay */}
      {!gameStarted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-stone-950/85 px-4 py-6 backdrop-blur-md">
          <div className="t-board-frame t-overlay-card overlay-pop w-full max-w-2xl rounded-3xl bg-gradient-to-b from-stone-900 via-stone-950 to-stone-950 p-6 text-center ring-1 ring-white/10 sm:p-8">
            <div className="t-chip inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-[10px] font-bold uppercase tracking-[0.32em]">
              <Sparkles className="h-3.5 w-3.5" />
              {t.setupKicker}
            </div>
            <h2 className="t-text-gradient mt-5 text-4xl font-black tracking-tight sm:text-5xl">
              Aadu Puli Aatam
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-xs leading-relaxed text-stone-300 sm:text-sm">
              {t.setupDesc}
            </p>

            <div className="mx-auto mt-6 flex max-w-md flex-col items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setChallengeMode((value) => !value)}
                aria-pressed={challengeMode}
                className={`inline-flex items-center gap-2.5 rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] transition-all ${
                  challengeMode
                    ? "t-chip shadow-md"
                    : "border-stone-800 bg-stone-900/80 text-stone-400 hover:border-white/20"
                }`}
              >
                <Flame className="h-3.5 w-3.5" />
                <span>{t.challengeMode}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold ${challengeMode ? "bg-stone-950/60 t-accent-text" : "bg-stone-950 text-stone-400"}`}
                >
                  {challengeMode ? t.on : t.off}
                </span>
              </button>
              <div className="w-full max-w-md text-left">
                <ThemePicker value={theme} onChange={changeTheme} />
              </div>
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
                  {t.modeGoat}
                </div>
                <div className="mt-2 font-bold text-stone-100">{t.modeGoatSub}</div>
                <div className="mt-1 text-[11px] text-stone-400">{t.modeGoatNote}</div>
              </button>

              <button
                onClick={() => startMatch("tiger-vs-ai")}
                className={`rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 ${
                  mode === "tiger-vs-ai"
                    ? "t-mode-active"
                    : "border-white/5 bg-stone-950/60 hover:border-white/20"
                }`}
              >
                <div className="t-accent-text text-[10px] font-black uppercase tracking-[0.2em]">
                  {t.modeTiger}
                </div>
                <div className="mt-2 font-bold text-stone-100">{t.modeTigerSub}</div>
                <div className="mt-1 text-[11px] text-stone-400">{t.modeTigerNote}</div>
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
                  {t.modeLocal}
                </div>
                <div className="mt-2 font-bold text-stone-100">{t.modeLocalSub}</div>
                <div className="mt-1 text-[11px] text-stone-400">{t.modeLocalNote}</div>
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
                  {t.modeOnline}
                </div>
                <div className="mt-2 font-bold text-stone-100">{t.modeOnlineSub}</div>
                <div className="mt-1 text-[11px] text-stone-400">{t.modeOnlineNote}</div>
              </button>
            </div>

            <button
              onClick={() => startMatch(mode)}
              className="t-btn-primary mt-8 inline-flex items-center justify-center rounded-2xl px-8 py-3.5 text-xs font-black uppercase tracking-[0.22em] transition-transform hover:scale-[1.03] active:scale-95"
            >
              {t.startBattle}
            </button>
            <div>
              <button
                onClick={() => setShowTutorial(true)}
                className="mt-3 text-[11px] font-bold text-stone-400 underline-offset-4 hover:text-stone-200 hover:underline"
              >
                {t.takeTour}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Match Complete Victory Celebration Overlay */}
      {state.winner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 px-4 backdrop-blur-md">
          <div className="t-board-frame t-overlay-card overlay-pop relative w-full max-w-md overflow-hidden rounded-3xl bg-gradient-to-b from-stone-900 via-stone-950 to-stone-950 p-8 text-center ring-1 ring-white/10">
            <Confetti winner={state.winner} seed={summary.totalMoves} />
            <div className="t-chip inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-[10px] font-bold uppercase tracking-[0.28em]">
              <Trophy className="h-4 w-4 animate-bounce" />
              {t.victoryKicker}
            </div>

            <h3 className="t-text-gradient mt-5 text-3xl font-black">
              {state.winner === "tiger" ? t.tigerWins : t.goatWins}
            </h3>

            <p className="mt-3 text-xs leading-relaxed text-stone-300">
              {state.winner === "tiger" ? t.tigerWinsDesc : t.goatWinsDesc}
            </p>

            <div className="mt-6 grid grid-cols-3 gap-2.5 text-center text-xs">
              <div className="t-panel rounded-2xl bg-stone-950/60 p-3">
                <div className="t-accent-text text-[10px] font-bold uppercase tracking-wider">
                  {t.winner}
                </div>
                <div className="mt-1 text-base font-black text-stone-100">
                  {summary.winnerLabel}
                </div>
              </div>

              <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                  {t.moves}
                </div>
                <div className="mt-1 text-base font-black text-stone-100">{summary.totalMoves}</div>
              </div>

              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  {t.captures}
                </div>
                <div className="mt-1 text-base font-black text-stone-100">
                  {summary.goatsCaptured}
                </div>
              </div>
            </div>

            <div className="mt-7 flex gap-3">
              <button
                onClick={newGame}
                className="t-btn-primary flex-1 rounded-2xl py-3.5 text-xs font-black uppercase tracking-wider transition-transform hover:scale-[1.02] active:scale-95"
              >
                {t.playAgain}
              </button>
              <button
                onClick={goToMainMenu}
                className="flex-1 rounded-2xl border border-stone-800 bg-stone-900/90 py-3.5 text-xs font-black uppercase tracking-wider text-stone-200 transition-transform hover:scale-[1.02] active:scale-95"
              >
                {t.mainMenu}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Game Section */}
      <div className="mx-auto max-w-7xl px-4 pt-6 lg:px-8">
        <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="rise flex w-full flex-1 flex-col items-center justify-center">
            <GameBoard
              state={boardState}
              selected={viewingIndex == null ? selected : null}
              targets={viewingIndex == null ? targets : []}
              lastMove={boardLastMove}
              hint={viewingIndex == null ? hint : null}
              interactive={
                viewingIndex == null &&
                !state.winner &&
                !isAiTurn &&
                !isRemoteTurn &&
                !thinking &&
                gameStarted
              }
              turnTimeLeft={turnTimeLeft}
              turnTimeLimit={timeoutSecs}
              onNodeClick={handleNode}
            />
            {/* Tactical Hint — beside the board */}
            <div className="glass-card t-panel mt-3 flex w-full max-w-[620px] items-center gap-3 rounded-2xl p-3">
              <div className="t-icon-tile flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
                <Sparkles className="h-4 w-4 t-accent-text" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="t-panel-title text-[10px] font-black uppercase tracking-[0.2em]">
                  {t.tacRec}
                </div>
                <div className="truncate text-xs font-bold text-stone-200">
                  {thinking ? t.thinking : suggestedMoveText}
                </div>
              </div>
              <button
                onClick={showHint}
                disabled={!!state.winner || thinking || isAiTurn || viewingIndex != null}
                className="t-btn-primary shrink-0 rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-wider transition-all disabled:opacity-30 hover:scale-105 active:scale-95"
              >
                {t.hintBtn}
              </button>
            </div>
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
            legalMovesCount={turnMoves.length}
            coachInsight={coachInsight}
            turnTimeLeft={turnTimeLeft}
            turnTimeLimit={timeoutSecs}
            matchStats={matchStats}
            records={records}
            challengeMode={challengeMode}
            sessionCount={sessionCount}
            roomId={roomId}
            onlineRole={onlineRole}
            copied={copied}
            timeoutSecs={timeoutSecs}
            timeoutRule={timeoutRule}
            onTimeoutSecs={setTimeoutSecs}
            onTimeoutRule={setTimeoutRule}
            replayIndex={viewingIndex ?? viewingTotal}
            replayTotal={viewingTotal}
            replayActive={viewingIndex != null}
            replayCopied={replayCopied}
            onReplayStep={stepReplay}
            onReplayExit={exitReplay}
            onCopyReplay={handleCopyReplay}
            onCopyInviteLink={handleCopyInviteLink}
            onMode={handleModeChange}
            onToggleChallenge={toggleChallenge}
            theme={theme}
            onTheme={changeTheme}
            onDifficulty={setDifficulty}
            onToggleMute={() => setMuted((v) => !v)}
            onNewGame={newGame}
            onReset={newGame}
            onUndo={undo}
            onTour={() => setShowTutorial(true)}
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="mx-auto mt-10 max-w-7xl px-4 lg:px-8">
        <div className="t-hairline h-px w-full opacity-60" />
        <div className="flex flex-col items-center justify-between gap-2 py-5 text-[11px] font-medium text-stone-500 sm:flex-row">
          <span>
            <span className="t-accent-text font-black">Aadu Puli Aatam</span>
            {" · "}ஆடு புலி ஆட்டம் · {t.footerLeft}
          </span>
          <span>{t.footerRight}</span>
        </div>
      </footer>

      <Tutorial
        open={showTutorial}
        onClose={() => {
          setShowTutorial(false);
          try {
            window.localStorage.setItem(TOUR_KEY, "1");
          } catch {
            // ignore
          }
        }}
        onPractice={() => {
          setShowTutorial(false);
          try {
            window.localStorage.setItem(TOUR_KEY, "1");
          } catch {
            // ignore
          }
          setMode("goat-vs-ai");
          setDifficulty("easy");
          startMatch("goat-vs-ai");
        }}
      />
    </main>
  );
}

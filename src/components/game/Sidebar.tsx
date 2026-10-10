import { CAPTURES_TO_WIN, TOTAL_GOATS, type GameState } from "@/lib/game/engine";
import { TigerFaceMark } from "@/components/game/TigerFace";
import { GoatFaceMark } from "@/components/game/GoatFace";
import type { Difficulty } from "@/lib/game/ai";
import type { ThemeId } from "@/lib/theme";
import { ThemePicker } from "@/components/game/ThemePicker";
import { StatsCharts } from "@/components/game/StatsCharts";
import { useLang } from "@/lib/i18n";
import type { GameRecord } from "@/lib/stats";
import { useEffect, useState } from "react";
import {
  Trophy,
  RotateCcw,
  Undo2,
  Sparkles,
  Volume2,
  VolumeX,
  Gamepad2,
  BrainCircuit,
  Swords,
  ShieldAlert,
  History,
  Link as LinkIcon,
  Copy,
  Check,
  Users,
  Share2,
  Flame,
  Target,
  Zap,
  Timer,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Film,
  BarChart3,
  GraduationCap,
} from "lucide-react";

export type GameMode = "goat-vs-ai" | "tiger-vs-ai" | "hotseat" | "online";
export type TimeoutSecs = 15 | 30 | 60;
export type TimeoutRule = "warn" | "forfeit";

type Props = {
  state: GameState;
  mode: GameMode;
  difficulty: Difficulty;
  muted: boolean;
  status: string;
  log: string[];
  thinking: boolean;
  canUndo: boolean;
  legalMovesCount?: number;
  coachInsight?: string;
  turnTimeLeft?: number;
  turnTimeLimit?: number;
  matchStats?: {
    games: number;
    goatWins: number;
    tigerWins: number;
    currentStreak: number;
  };
  challengeMode?: boolean;
  sessionCount?: number;
  roomId?: string | null;
  onlineRole?: "goat" | "tiger";
  copied?: boolean;
  onCopyInviteLink?: () => void;
  onMode: (m: GameMode) => void;
  onToggleChallenge?: () => void;
  theme: ThemeId;
  onTheme: (t: ThemeId) => void;
  onDifficulty: (d: Difficulty) => void;
  onToggleMute: () => void;
  onNewGame: () => void;
  onReset: () => void;
  onUndo: () => void;
  onTour: () => void;
  records: GameRecord[];
  timeoutSecs: TimeoutSecs;
  timeoutRule: TimeoutRule;
  onTimeoutSecs: (s: TimeoutSecs) => void;
  onTimeoutRule: (r: TimeoutRule) => void;
  replayIndex: number;
  replayTotal: number;
  replayActive: boolean;
  replayCopied: boolean;
  onReplayStep: (delta: number) => void;
  onReplayExit: () => void;
  onCopyReplay: () => void;
};

const modeMeta: { id: GameMode; icon: React.ReactNode }[] = [
  { id: "goat-vs-ai", icon: <BrainCircuit className="h-4 w-4 t-accent-text" /> },
  { id: "tiger-vs-ai", icon: <Swords className="h-4 w-4 text-emerald-400" /> },
  { id: "hotseat", icon: <Gamepad2 className="h-4 w-4 text-sky-400" /> },
  { id: "online", icon: <Share2 className="h-4 w-4 text-cyan-400" /> },
];

const levelIds: Difficulty[] = ["easy", "medium", "hard"];

function Panel({
  id,
  title,
  icon,
  children,
  badge,
  preview,
  defaultOpen = true,
}: {
  id: string;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  badge?: React.ReactNode;
  preview?: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const STORAGE_KEY = "aadu-puli-panels-collapsed-v2";
  const [open, setOpen] = useState<boolean>(() => {
    if (typeof window === "undefined" || typeof localStorage === "undefined") return defaultOpen;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultOpen;
      const collapsed = JSON.parse(raw) as string[];
      return Array.isArray(collapsed) ? !collapsed.includes(id) : defaultOpen;
    } catch {
      return defaultOpen;
    }
  });

  const persist = (next: boolean) => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const collapsed = raw ? (JSON.parse(raw) as string[]) : [];
      const set = new Set(Array.isArray(collapsed) ? collapsed : []);
      if (next) set.delete(id);
      else set.add(id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
    } catch {
      // ignore persistence errors
    }
  };

  const toggle = () => {
    setOpen((v) => {
      const next = !v;
      persist(next);
      return next;
    });
  };

  // Respond to sidebar quick-nav: open one panel / expand-or-collapse all.
  useEffect(() => {
    const openOne = (e: Event) => {
      const detail = (e as CustomEvent<{ id: string }>).detail;
      if (detail?.id !== id) return;
      setOpen(true);
      persist(true);
    };
    const setAll = (e: Event) => {
      const detail = (e as CustomEvent<{ open: boolean }>).detail;
      setOpen(!!detail?.open);
      persist(!!detail?.open);
    };
    window.addEventListener("aadu-panel:open", openOne);
    window.addEventListener("aadu-panels:set-all", setAll);
    return () => {
      window.removeEventListener("aadu-panel:open", openOne);
      window.removeEventListener("aadu-panels:set-all", setAll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <section
      id={`panel-${id}`}
      className={`glass-card t-panel group scroll-mt-24 rounded-3xl p-4 shadow-2xl transition-all duration-300 hover:border-white/20 hover:shadow-black/50 ${
        open ? "ring-1 ring-white/5" : "cursor-pointer"
      }`}
      onClick={open ? undefined : toggle}
    >
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-stone-950/60 transition-transform group-hover:scale-110">
            {icon}
          </span>
          <span className="min-w-0 flex-1">
            <h2 className="t-panel-title truncate text-xs font-black uppercase tracking-[0.2em]">
              {title}
            </h2>
            {!open && preview ? (
              <span className="mt-0.5 block truncate text-[11px] font-semibold normal-case tracking-normal text-stone-400">
                {preview}
              </span>
            ) : null}
          </span>
        </button>
        <div className="flex shrink-0 items-center gap-2">
          {badge}
          <button
            type="button"
            onClick={toggle}
            aria-expanded={open}
            aria-label={open ? `Collapse ${title}` : `Expand ${title}`}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-stone-400 transition-all hover:bg-stone-800 hover:text-white active:scale-90"
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-300 ${open ? "" : "-rotate-90"}`}
            />
          </button>
        </div>
      </div>
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          open ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">{children}</div>
      </div>
    </section>
  );
}

function jumpToPanel(id: string) {
  try {
    window.dispatchEvent(new CustomEvent("aadu-panel:open", { detail: { id } }));
  } catch {
    // ignore
  }
  requestAnimationFrame(() => {
    document.getElementById(`panel-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function setAllPanels(open: boolean) {
  try {
    window.dispatchEvent(new CustomEvent("aadu-panels:set-all", { detail: { open } }));
  } catch {
    // ignore
  }
}

function ConnectionDot() {
  const { t } = useLang();
  const [online, setOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
        online ? "bg-emerald-500/10 text-emerald-300" : "bg-rose-500/10 text-rose-300"
      }`}
      title={online ? t.online : t.offline}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${online ? "bg-emerald-400" : "bg-rose-400 animate-pulse"}`}
      />
      {online ? t.online : t.offline}
    </span>
  );
}

export function Sidebar(p: Props) {
  const { state } = p;
  const { t } = useLang();
  const modes = modeMeta.map((m) => {
    switch (m.id) {
      case "goat-vs-ai":
        return { ...m, label: `${t.modeGoat} vs AI`, sub: t.modeGoatSub };
      case "tiger-vs-ai":
        return { ...m, label: `${t.modeTiger} vs AI`, sub: t.modeTigerSub };
      case "hotseat":
        return { ...m, label: t.modeLocal, sub: t.modeLocalSub };
      case "online":
        return { ...m, label: t.modeOnline, sub: t.modeOnlineSub };
    }
  });
  const levels = levelIds.map((id) => ({
    id,
    label: id === "easy" ? t.easy : id === "medium" ? t.medium : t.hard,
    note: id === "easy" ? t.easyNote : id === "medium" ? t.mediumNote : t.hardNote,
  }));
  const goatsOnBoard = state.cells.filter((c) => c === "goat").length;
  const placementProgress = Math.round(((TOTAL_GOATS - state.goatsToPlace) / TOTAL_GOATS) * 100);
  const captureProgress = Math.round((state.goatsCaptured / CAPTURES_TO_WIN) * 100);
  const timerRatio =
    p.turnTimeLimit && p.turnTimeLeft !== undefined
      ? Math.max(0, (p.turnTimeLeft / p.turnTimeLimit) * 100)
      : 100;

  const timerColor =
    p.turnTimeLeft !== undefined && p.turnTimeLeft <= 8
      ? "from-rose-500 to-red-600"
      : p.turnTimeLeft !== undefined && p.turnTimeLeft <= 15
        ? "from-[var(--a1)] to-[var(--a2)]"
        : "from-emerald-500 to-teal-400";

  return (
    <aside className="rise rise-1 flex w-full flex-col gap-3 lg:sticky lg:top-[72px] lg:max-h-[calc(100vh-88px)] lg:max-w-sm lg:overflow-y-auto lg:overscroll-contain lg:pr-1 lg:pb-2">
      {/* Compact interactive navigator: jump to any panel + collapse all */}
      <nav
        aria-label={t.jumpTo}
        className="glass-card t-panel sticky top-0 z-10 flex items-center gap-1.5 rounded-2xl p-2 shadow-xl backdrop-blur-xl"
      >
        <div className="flex flex-1 items-center gap-1 overflow-x-auto">
          {[
            {
              id: "status",
              icon: <Trophy className="h-3.5 w-3.5" />,
              label: t.liveStatus,
              dot: !state.winner
                ? state.turn === "tiger"
                  ? "bg-amber-400"
                  : "bg-emerald-400"
                : undefined,
            },
            { id: "coach", icon: <Sparkles className="h-3.5 w-3.5" />, label: t.coachTitle },
            {
              id: "scoreboard",
              icon: <ShieldAlert className="h-3.5 w-3.5" />,
              label: t.scoreboard,
            },
            {
              id: "controls",
              icon: <BrainCircuit className="h-3.5 w-3.5" />,
              label: t.controlsTitle,
            },
            { id: "invite", icon: <Users className="h-3.5 w-3.5" />, label: t.inviteLocal },
            {
              id: "history",
              icon: <History className="h-3.5 w-3.5" />,
              label: t.history,
              count: p.log.length,
            },
          ].map((n) => (
            <button
              key={n.id}
              type="button"
              title={n.label}
              aria-label={n.label}
              onClick={() => jumpToPanel(n.id)}
              className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/5 bg-stone-950/60 text-stone-400 transition-all hover:scale-110 hover:border-white/20 hover:text-stone-100 active:scale-95"
            >
              {n.icon}
              {"dot" in n && n.dot ? (
                <span
                  className={`absolute right-1 top-1 h-1.5 w-1.5 rounded-full ${n.dot} animate-pulse`}
                />
              ) : null}
              {"count" in n && n.count ? (
                <span
                  key={n.count}
                  className="feed-enter absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--a1)] px-1 text-[9px] font-black text-stone-950"
                >
                  {n.count > 99 ? "99+" : n.count}
                </span>
              ) : null}
            </button>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-1 border-l border-white/10 pl-1.5">
          <button
            type="button"
            title={t.expandAll}
            onClick={() => setAllPanels(true)}
            className="rounded-lg px-2 py-1.5 text-[10px] font-black uppercase tracking-wider text-stone-400 transition-all hover:bg-stone-800 hover:text-white"
          >
            {t.expandAll}
          </button>
          <span className="text-stone-600">·</span>
          <button
            type="button"
            title={t.collapseAll}
            onClick={() => setAllPanels(false)}
            className="rounded-lg px-2 py-1.5 text-[10px] font-black uppercase tracking-wider text-stone-400 transition-all hover:bg-stone-800 hover:text-white"
          >
            {t.collapseAll}
          </button>
        </div>
      </nav>

      {/* Live Match Status Panel */}
      <Panel
        id="status"
        title={t.liveStatus}
        icon={
          <span className="relative flex">
            <Trophy className="h-4 w-4 t-accent-text" />
            {!state.winner && (
              <span
                className={`absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ring-2 ring-stone-950 ${
                  state.turn === "tiger"
                    ? "bg-amber-400 animate-pulse"
                    : "bg-emerald-400 animate-pulse"
                }`}
              />
            )}
          </span>
        }
        preview={
          state.winner
            ? state.winner === "tiger"
              ? t.tigerWins
              : t.goatWins
            : `${state.turn === "goat" ? t.goatTurn : t.tigerTurn} · ${p.turnTimeLeft ?? 0}s · ${p.legalMovesCount ?? 0} ${t.legalOptions}`
        }
        badge={
          <span className="rounded-full border border-white/10 bg-stone-950/70 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-stone-400">
            {t.session}
            {p.sessionCount ?? 1}
          </span>
        }
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-2xl font-black text-stone-100">
              {state.winner
                ? state.winner === "tiger"
                  ? t.tigerWins
                  : t.goatWins
                : state.turn === "goat"
                  ? t.goatsToMove
                  : t.tigersToMove}
            </span>
            <span className="text-[11px] font-medium text-stone-400">
              {state.goatsToPlace > 0
                ? t.placementPhase.replace("{n}", String(state.goatsToPlace))
                : t.movementPhase}
            </span>
          </div>

          <span
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-black tracking-wider uppercase shadow-xl transition-transform hover:scale-105 ${
              state.turn === "tiger"
                ? "bg-gradient-to-r from-amber-600 to-orange-600 text-amber-100 shadow-amber-950/50 ring-1 ring-amber-400/40"
                : "bg-gradient-to-r from-emerald-600 to-teal-600 text-emerald-100 shadow-emerald-950/50 ring-1 ring-emerald-400/40"
            }`}
          >
            {state.turn === "tiger" && <TigerFaceMark size={18} />}
            {state.turn === "goat" && <GoatFaceMark size={18} />}
            {state.turn === "tiger"
              ? t.tigerTurn.replace("🐯 ", "").replace("🐯", "")
              : t.goatTurn.replace("🐐 ", "").replace("🐐", "")}
          </span>
        </div>

        {/* Live Message & Thinking Bar */}
        <div className="mt-3 rounded-2xl border border-white/5 bg-stone-950/80 p-3 shadow-inner">
          {p.thinking ? (
            <div className="flex items-center gap-3 t-accent-text">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--a1)] opacity-75"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-[var(--a1)]"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-wider">{t.thinking}</span>
            </div>
          ) : (
            <p
              key={p.log.length}
              aria-live="polite"
              aria-atomic="true"
              className="status-flash text-xs font-semibold leading-relaxed text-stone-200"
            >
              {p.status}
            </p>
          )}
        </div>

        {/* Turn Timer Progress Bar */}
        <div className="mt-3 rounded-2xl border border-white/5 bg-stone-950/70 p-3">
          <div className="mb-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3 t-accent-text" />
              {t.turnCountdown}
            </span>
            <span
              className={
                p.turnTimeLeft !== undefined && p.turnTimeLeft <= 8
                  ? "text-rose-400 font-extrabold animate-pulse"
                  : "text-stone-200"
              }
            >
              {t.secondsLeft.replace("{n}", String(p.turnTimeLeft ?? 0))}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-stone-900 shadow-inner">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${timerColor} transition-all duration-500`}
              style={{ width: `${timerRatio}%` }}
            />
          </div>
        </div>

        {/* Quick Analytics Summary */}
        <div className="mt-3 rounded-2xl border border-white/5 bg-stone-950/70 p-2.5">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">
            {t.availMoves}
          </div>
          <div className="mt-1 flex items-baseline gap-2 text-lg font-black t-accent-text">
            <span>{p.legalMovesCount ?? 0}</span>
            <span className="text-[10px] font-normal text-stone-500">{t.legalOptions}</span>
          </div>
        </div>
      </Panel>

      {/* AI Tactical Coach Read */}
      <Panel
        id="coach"
        title={t.coachTitle}
        icon={<Sparkles className="h-4 w-4 text-emerald-400" />}
        preview={p.coachInsight}
      >
        <div
          key={p.coachInsight?.slice(0, 24)}
          className="status-flash rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs leading-relaxed text-emerald-100"
        >
          {p.coachInsight}
        </div>
      </Panel>

      {/* Battle Scoreboard Panel */}
      <Panel
        id="scoreboard"
        defaultOpen={false}
        title={t.scoreboard}
        icon={<ShieldAlert className="h-4 w-4 t-accent-text" />}
        preview={`🐐 ${TOTAL_GOATS - state.goatsToPlace}/${TOTAL_GOATS} · 🐯 ${state.goatsCaptured}/${CAPTURES_TO_WIN}`}
      >
        <div className="grid grid-cols-2 gap-3 text-xs">
          {/* Goats Placement Progress */}
          <div className="rounded-2xl border border-white/5 bg-stone-950/70 p-3">
            <div className="flex items-center justify-between font-bold text-stone-400">
              <span>{t.goatsPlaced}</span>
              <span className="text-emerald-400">
                {state.goatsToPlace} {t.leftWord}
              </span>
            </div>
            <div className="mt-1 text-2xl font-black text-stone-100">
              {TOTAL_GOATS - state.goatsToPlace}{" "}
              <span className="text-xs font-normal text-stone-500">/ {TOTAL_GOATS}</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-stone-900">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                style={{ width: `${placementProgress}%` }}
              />
            </div>
          </div>

          {/* Goats Capture Progress */}
          <div className="rounded-2xl border border-white/5 bg-stone-950/70 p-3">
            <div className="flex items-center justify-between font-bold text-stone-400">
              <span>{t.capturedTitle}</span>
              <span className="text-rose-400">
                {CAPTURES_TO_WIN - state.goatsCaptured} {t.toWin}
              </span>
            </div>
            <div className="mt-1 text-2xl font-black text-rose-400">
              {state.goatsCaptured}{" "}
              <span className="text-xs font-normal text-stone-500">/ {CAPTURES_TO_WIN}</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-stone-900">
              <div
                className="h-full rounded-full bg-gradient-to-r from-rose-500 to-red-600 transition-all duration-500"
                style={{ width: `${captureProgress}%` }}
              />
            </div>
          </div>

          {/* Active Goats Count */}
          <div className="rounded-2xl border border-white/5 bg-stone-950/70 p-2.5">
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400">
              {t.herdOnGrid}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-base font-black text-emerald-300">
              <GoatFaceMark size={20} />
              {goatsOnBoard} {t.goatsUnit}
            </div>
          </div>

          {/* Active Tigers Count */}
          <div className="rounded-2xl border border-white/5 bg-stone-950/70 p-2.5">
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400">
              {t.hunters}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-base font-black text-amber-300">
              <TigerFaceMark size={20} />
              {t.tigersUnit}
            </div>
          </div>
        </div>

        {/* Career & Session Score Records */}
        <div className="mt-3 rounded-2xl border border-white/5 bg-stone-950/70 p-3">
          <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">
            <span>{t.careerRecord}</span>
            <span className="t-accent-text">
              {t.totalGames.replace("{n}", String(p.matchStats?.games ?? 0))}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                {t.goatWinsCard}
              </div>
              <div className="mt-0.5 text-lg font-black text-stone-100">
                {p.matchStats?.goatWins ?? 0}
              </div>
            </div>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                {t.tigerWinsCard}
              </div>
              <div className="mt-0.5 text-lg font-black text-stone-100">
                {p.matchStats?.tigerWins ?? 0}
              </div>
            </div>
            <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                {t.streak}
              </div>
              <div className="mt-0.5 text-lg font-black text-stone-100">
                {p.matchStats?.currentStreak ?? 0}🔥
              </div>
            </div>
          </div>
        </div>
      </Panel>

      {/* Match Analytics Panel */}
      <Panel
        id="analytics"
        defaultOpen={false}
        title={t.analyticsTitle}
        icon={<BarChart3 className="h-4 w-4 t-accent-text" />}
        preview={t.totalGames.replace("{n}", String(p.matchStats?.games ?? 0))}
      >
        <StatsCharts records={p.records} />
      </Panel>

      {/* Game Mode & AI Setup Panel */}
      <Panel
        id="controls"
        defaultOpen={false}
        title={t.controlsTitle}
        icon={<BrainCircuit className="h-4 w-4 t-accent-text" />}
        preview={`${modes.find((m) => m.id === p.mode)?.label ?? p.mode} · ${levels.find((l) => l.id === p.difficulty)?.label ?? p.difficulty}`}
      >
        {/* Challenge Mode Banner */}
        <div className="t-chip mb-3 flex items-center justify-between rounded-2xl px-3.5 py-2">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 animate-bounce" />
            <span className="text-xs font-black uppercase tracking-wider">{t.challengeRule}</span>
          </div>
          <button
            type="button"
            onClick={() => p.onToggleChallenge?.()}
            aria-pressed={!!p.challengeMode}
            className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider transition-all ${
              p.challengeMode ? "t-btn-primary" : "bg-stone-800 text-stone-300 hover:bg-stone-700"
            }`}
          >
            {p.challengeMode ? t.on : t.off}
          </button>
        </div>

        {/* Mode Selector Cards */}
        <div className="grid grid-cols-2 gap-2">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => p.onMode(m.id)}
              className={`flex flex-col gap-1 rounded-2xl p-3 text-left transition-all hover:-translate-y-0.5 ${
                p.mode === m.id
                  ? "t-mode-active border text-stone-100"
                  : "border border-white/5 bg-stone-950/60 text-stone-400 hover:border-white/20 hover:text-stone-200"
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs">
                {m.icon}
                <span className={p.mode === m.id ? "t-accent-text" : ""}>{m.label}</span>
              </div>
              <span className="text-[10px] font-medium opacity-75">{m.sub}</span>
            </button>
          ))}
        </div>

        {/* AI Difficulty Selector */}
        <div className="mt-3">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">
            {t.aiDifficulty}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {levels.map((l) => (
              <button
                key={l.id}
                onClick={() => p.onDifficulty(l.id)}
                disabled={p.mode === "hotseat"}
                className={`rounded-xl py-2 px-1 text-center transition-all disabled:opacity-30 ${
                  p.difficulty === l.id
                    ? "t-btn-primary font-black"
                    : "bg-stone-950/70 border border-white/5 text-stone-400 hover:bg-stone-800 hover:text-stone-200"
                }`}
              >
                <div className="text-[10px] uppercase tracking-wider">{l.label}</div>
                <div className="text-[9px] opacity-80">{l.note}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Turn Clock + Timeout Rule */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div>
            <div className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">
              <Timer className="h-3 w-3 t-accent-text" />
              {t.clockLabel}
            </div>
            <div className="grid grid-cols-3 gap-1">
              {([15, 30, 60] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => p.onTimeoutSecs(s)}
                  className={`rounded-lg py-1.5 text-[11px] font-black transition-all ${
                    p.timeoutSecs === s
                      ? "t-btn-primary"
                      : "border border-white/5 bg-stone-950/70 text-stone-400 hover:text-stone-200"
                  }`}
                >
                  {t.secs.replace("{n}", String(s))}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">
              {t.timeoutLabel}
            </div>
            <div className="grid grid-cols-2 gap-1">
              {(["warn", "forfeit"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => p.onTimeoutRule(r)}
                  className={`rounded-lg py-1.5 text-[11px] font-black transition-all ${
                    p.timeoutRule === r
                      ? "t-btn-primary"
                      : "border border-white/5 bg-stone-950/70 text-stone-400 hover:text-stone-200"
                  }`}
                >
                  {r === "warn" ? t.warnOnly : t.forfeitGame}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* App Theme */}
        <div className="mt-3">
          <ThemePicker value={p.theme} onChange={p.onTheme} />
        </div>
      </Panel>

      {/* Multiplayer Room Sharing Link Panel */}
      <Panel
        id="invite"
        defaultOpen={false}
        title={p.mode === "online" ? t.inviteOnline : t.inviteLocal}
        icon={<Users className="h-4 w-4 text-sky-400" />}
        preview={`#${p.roomId || "MATCH"} · ${p.mode === "online" ? t.modeOnline : t.modeLocal}`}
        badge={<ConnectionDot />}
      >
        <div className="flex flex-col gap-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-stone-400">{t.matchCode}</span>
            <span className="font-mono text-sm font-black text-sky-400">
              #{p.roomId || "MATCH"}
            </span>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-stone-950/90 p-2.5">
            <LinkIcon className="h-4 w-4 shrink-0 text-stone-400" />
            <input
              type="text"
              readOnly
              value={
                typeof window !== "undefined"
                  ? `${window.location.origin}${window.location.pathname}?mode=${p.mode}&room=${p.roomId || "MATCH"}&role=tiger`
                  : `?mode=${p.mode}&room=${p.roomId || "MATCH"}&role=tiger`
              }
              className="w-full bg-transparent font-mono text-[11px] text-stone-300 outline-none select-all"
            />
          </div>

          <button
            onClick={p.onCopyInviteLink}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 font-bold transition-all shadow-lg ${
              p.copied
                ? "bg-emerald-500 text-stone-950 shadow-emerald-950/40"
                : "bg-gradient-to-r from-sky-600 to-blue-600 text-stone-100 hover:brightness-110 active:scale-95"
            }`}
          >
            {p.copied ? (
              <>
                <Check className="h-4 w-4" />
                <span>{t.copiedMsg}</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>{p.mode === "online" ? t.copyOnline : t.copyLocal}</span>
              </>
            )}
          </button>
        </div>
      </Panel>

      {/* Move History Feed Panel */}
      <Panel
        id="history"
        defaultOpen={false}
        title={t.history}
        icon={<History className="h-4 w-4 t-accent-text" />}
        preview={p.log.length > 0 ? p.log[p.log.length - 1] : t.noMoves}
        badge={
          p.log.length > 0 ? (
            <button
              key={p.log.length}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                jumpToPanel("history");
              }}
              title={t.history}
              className="feed-enter t-chip rounded-full px-2 py-0.5 text-[10px] font-black tabular-nums"
            >
              {p.log.length}
            </button>
          ) : undefined
        }
      >
        {/* Replay stepper */}
        {p.replayTotal > 0 && (
          <div className="mb-2.5 flex items-center gap-1.5 rounded-xl border border-white/10 bg-stone-950/70 p-1.5">
            <Film className="ml-1 h-4 w-4 shrink-0 t-accent-text" />
            <button
              onClick={() => p.onReplayStep(-1)}
              disabled={!p.replayActive && p.replayIndex <= 0}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-stone-200 transition-all disabled:opacity-30 hover:bg-stone-800"
              aria-label={t.replayPrev}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => p.onReplayStep(1)}
              disabled={!p.replayActive}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-stone-200 transition-all disabled:opacity-30 hover:bg-stone-800"
              aria-label={t.replayNext}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <span className="flex-1 text-center text-[11px] font-bold text-stone-300">
              {t.viewingMove
                .replace("{i}", String(p.replayActive ? p.replayIndex : p.replayTotal))
                .replace("{n}", String(p.replayTotal))}
            </span>
            {p.replayActive ? (
              <button
                onClick={p.onReplayExit}
                className="rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white transition-all hover:brightness-110"
              >
                {t.replayLive}
              </button>
            ) : (
              <button
                onClick={p.onCopyReplay}
                className="t-chip rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-wider transition-all hover:brightness-125"
              >
                {p.replayCopied ? <Check className="h-3.5 w-3.5" /> : t.copyReplay}
              </button>
            )}
          </div>
        )}
        <ol className="flex max-h-40 flex-col-reverse gap-1.5 overflow-y-auto pr-1 text-xs text-stone-300">
          {p.log.length === 0 && (
            <li className="py-3 text-center font-medium italic text-stone-500">{t.noMoves}</li>
          )}
          {p.log.map((entry, i) => {
            const isCapture =
              entry.includes("⏱") || entry.includes("Captured") || entry.includes("பிடித்தது");
            const isPlacement =
              !entry.includes("→") || entry.includes("placed") || entry.includes("வைத்தது");

            return (
              <li
                key={i}
                className={`feed-enter flex items-center justify-between rounded-xl border px-3 py-1.5 transition-all ${
                  isCapture
                    ? "border-rose-500/30 bg-rose-500/10 text-rose-200"
                    : isPlacement
                      ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-200"
                      : "border-white/5 bg-stone-950/60 text-stone-300 hover:bg-stone-900"
                }`}
              >
                <span className="font-mono text-[10px] font-bold opacity-60">
                  #{p.log.length - i}
                </span>
                <span className="font-medium">{entry}</span>
              </li>
            );
          })}
        </ol>
      </Panel>

      {/* Action Controls Toolbar — sticky so New/Undo are always reachable */}
      <div className="sticky bottom-0 z-10 grid grid-cols-2 gap-2.5 rounded-2xl bg-transparent pt-1 pb-1 backdrop-blur-sm">
        <button
          onClick={p.onNewGame}
          className="t-btn-primary flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-95"
        >
          <RotateCcw className="h-4 w-4" />
          <span>{t.newGame}</span>
        </button>

        <button
          onClick={p.onTour}
          className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-xs font-black uppercase tracking-wider text-emerald-950 shadow-xl shadow-emerald-950/40 transition-all hover:scale-[1.02] active:scale-95"
        >
          <GraduationCap className="h-4 w-4 text-emerald-100" />
          <span className="text-emerald-100">{t.tourKicker}</span>
        </button>

        <button
          onClick={p.onUndo}
          disabled={!p.canUndo}
          className="flex items-center justify-center gap-2 rounded-2xl border border-stone-800 bg-stone-900/90 px-4 py-3 text-xs font-bold tracking-wider text-stone-200 transition-all disabled:opacity-30 hover:bg-stone-800 active:scale-95"
        >
          <Undo2 className="h-4 w-4 t-accent-text" />
          <span>{t.undoBtn}</span>
        </button>

        <button
          onClick={p.onToggleMute}
          className="flex items-center justify-center gap-2 rounded-2xl border border-stone-800 bg-stone-900/90 px-4 py-3 text-xs font-bold tracking-wider text-stone-200 transition-all hover:bg-stone-800 active:scale-95"
        >
          {p.muted ? (
            <VolumeX className="h-4 w-4 text-rose-400" />
          ) : (
            <Volume2 className="h-4 w-4 text-emerald-400" />
          )}
          <span>{p.muted ? t.mutedWord : t.soundOn}</span>
        </button>
      </div>
    </aside>
  );
}

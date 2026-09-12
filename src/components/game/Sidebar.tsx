import { CAPTURES_TO_WIN, TOTAL_GOATS, type GameState } from "@/lib/game/engine";
import type { Difficulty } from "@/lib/game/ai";
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
} from "lucide-react";

export type GameMode = "goat-vs-ai" | "tiger-vs-ai" | "hotseat" | "online";

type Props = {
  state: GameState;
  mode: GameMode;
  difficulty: Difficulty;
  muted: boolean;
  status: string;
  log: string[];
  thinking: boolean;
  canUndo: boolean;
  canHint: boolean;
  legalMovesCount?: number;
  suggestedMove?: string;
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
  onDifficulty: (d: Difficulty) => void;
  onToggleMute: () => void;
  onNewGame: () => void;
  onReset: () => void;
  onUndo: () => void;
  onHint: () => void;
};

const modes: { id: GameMode; label: string; sub: string; icon: React.ReactNode }[] = [
  {
    id: "goat-vs-ai",
    label: "Goats vs AI Tigers",
    sub: "Defend with the herd",
    icon: <BrainCircuit className="h-4 w-4 text-amber-400" />,
  },
  {
    id: "tiger-vs-ai",
    label: "Tigers vs AI Goats",
    sub: "Hunt with 3 tigers",
    icon: <Swords className="h-4 w-4 text-emerald-400" />,
  },
  {
    id: "hotseat",
    label: "Local 2 Players",
    sub: "Pass & play hotseat",
    icon: <Gamepad2 className="h-4 w-4 text-sky-400" />,
  },
  {
    id: "online",
    label: "Online Room",
    sub: "Play across devices",
    icon: <Share2 className="h-4 w-4 text-cyan-400" />,
  },
];

const levels: { id: Difficulty; label: string; note: string }[] = [
  { id: "easy", label: "Easy", note: "Casual" },
  { id: "medium", label: "Medium", note: "Tactical" },
  { id: "hard", label: "Hard", note: "Expert" },
];

function Panel({
  title,
  icon,
  children,
  badge,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  badge?: React.ReactNode;
}) {
  return (
    <section className="glass-card rounded-3xl p-4 shadow-2xl transition-all duration-300 hover:border-amber-500/30">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-amber-400/90">{title}</h2>
        </div>
        {badge}
      </div>
      {children}
    </section>
  );
}

export function Sidebar(p: Props) {
  const { state } = p;
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
        ? "from-amber-500 to-orange-500"
        : "from-emerald-500 to-teal-400";

  return (
    <aside className="flex w-full flex-col gap-4.5 lg:max-w-sm">
      {/* Live Match Status Panel */}
      <Panel
        title="Live Match Status"
        icon={<Trophy className="h-4 w-4 text-amber-400" />}
        badge={
          <span className="rounded-full border border-white/10 bg-stone-950/70 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-stone-400">
            Session #{p.sessionCount ?? 1}
          </span>
        }
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-2xl font-black text-stone-100">
              {state.winner
                ? state.winner === "tiger"
                  ? "🐯 Tigers Win!"
                  : "🐐 Goats Win!"
                : state.turn === "goat"
                  ? "Goats to Move"
                  : "Tigers to Move"}
            </span>
            <span className="text-[11px] font-medium text-stone-400">
              {state.goatsToPlace > 0
                ? `Placement Phase (${state.goatsToPlace} goats left)`
                : "Movement Phase (Full Grid)"}
            </span>
          </div>

          <span
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-black tracking-wider uppercase shadow-xl transition-transform hover:scale-105 ${
              state.turn === "tiger"
                ? "bg-gradient-to-r from-amber-600 to-orange-600 text-amber-100 shadow-amber-950/50 ring-1 ring-amber-400/40"
                : "bg-gradient-to-r from-emerald-600 to-teal-600 text-emerald-100 shadow-emerald-950/50 ring-1 ring-emerald-400/40"
            }`}
          >
            {state.turn === "tiger" ? "🐯 Tiger Turn" : "🐐 Goat Turn"}
          </span>
        </div>

        {/* Live Message & Thinking Bar */}
        <div className="mt-3 rounded-2xl border border-white/5 bg-stone-950/80 p-3 shadow-inner">
          {p.thinking ? (
            <div className="flex items-center gap-3 text-amber-400">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-500"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-wider">
                AI Minimax Engine Calculating Move...
              </span>
            </div>
          ) : (
            <p
              aria-live="polite"
              aria-atomic="true"
              className="text-xs font-semibold leading-relaxed text-stone-200"
            >
              {p.status}
            </p>
          )}
        </div>

        {/* Turn Timer Progress Bar */}
        <div className="mt-3 rounded-2xl border border-white/5 bg-stone-950/70 p-3">
          <div className="mb-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-amber-400" />
              Turn Countdown
            </span>
            <span
              className={
                p.turnTimeLeft !== undefined && p.turnTimeLeft <= 8
                  ? "text-rose-400 font-extrabold animate-pulse"
                  : "text-stone-200"
              }
            >
              {p.turnTimeLeft ?? 0}s remaining
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
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-2xl border border-white/5 bg-stone-950/70 p-2.5">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">
              Available Moves
            </div>
            <div className="mt-1 flex items-baseline gap-1 text-lg font-black text-amber-300">
              <span>{p.legalMovesCount ?? 0}</span>
              <span className="text-[10px] font-normal text-stone-500">legal options</span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-stone-950/70 p-2.5">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">
              Tactical Recommendation
            </div>
            <div className="mt-1 line-clamp-1 text-xs font-black text-emerald-300">
              {p.suggestedMove || "Analyzing..."}
            </div>
          </div>
        </div>
      </Panel>

      {/* AI Tactical Coach Read */}
      <Panel title="AI Tactical Coach" icon={<Sparkles className="h-4 w-4 text-emerald-400" />}>
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs leading-relaxed text-emerald-100">
          {p.coachInsight || "Make a move to receive tactical insights."}
        </div>
      </Panel>

      {/* Battle Scoreboard Panel */}
      <Panel title="Battle Scoreboard" icon={<ShieldAlert className="h-4 w-4 text-amber-400" />}>
        <div className="grid grid-cols-2 gap-3 text-xs">
          {/* Goats Placement Progress */}
          <div className="rounded-2xl border border-white/5 bg-stone-950/70 p-3">
            <div className="flex items-center justify-between font-bold text-stone-400">
              <span>Goats Placed</span>
              <span className="text-emerald-400">{state.goatsToPlace} left</span>
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
              <span>Goats Captured</span>
              <span className="text-rose-400">{CAPTURES_TO_WIN - state.goatsCaptured} to win</span>
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
              Herd On Grid
            </div>
            <div className="mt-0.5 text-base font-black text-emerald-300">{goatsOnBoard} Goats</div>
          </div>

          {/* Active Tigers Count */}
          <div className="rounded-2xl border border-white/5 bg-stone-950/70 p-2.5">
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400">
              Prowling Hunters
            </div>
            <div className="mt-0.5 text-base font-black text-amber-300">3 Tigers</div>
          </div>
        </div>

        {/* Career & Session Score Records */}
        <div className="mt-3 rounded-2xl border border-white/5 bg-stone-950/70 p-3">
          <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">
            <span>Career Match Record</span>
            <span className="text-amber-400">{p.matchStats?.games ?? 0} total games</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Goat Wins
              </div>
              <div className="mt-0.5 text-lg font-black text-stone-100">
                {p.matchStats?.goatWins ?? 0}
              </div>
            </div>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                Tiger Wins
              </div>
              <div className="mt-0.5 text-lg font-black text-stone-100">
                {p.matchStats?.tigerWins ?? 0}
              </div>
            </div>
            <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                Streak
              </div>
              <div className="mt-0.5 text-lg font-black text-stone-100">
                {p.matchStats?.currentStreak ?? 0}🔥
              </div>
            </div>
          </div>
        </div>
      </Panel>

      {/* Game Mode & AI Setup Panel */}
      <Panel title="Game Controls & AI" icon={<BrainCircuit className="h-4 w-4 text-amber-400" />}>
        {/* Challenge Mode Banner */}
        <div className="mb-3 flex items-center justify-between rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/10 px-3.5 py-2">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-amber-400 animate-bounce" />
            <span className="text-xs font-black uppercase tracking-wider text-amber-200">
              Challenge Opening Rule
            </span>
          </div>
          <button
            type="button"
            onClick={() => p.onMode(p.mode)}
            className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider transition-all ${
              p.challengeMode
                ? "bg-amber-400 text-stone-950 shadow-md shadow-amber-950/40"
                : "bg-stone-800 text-stone-300"
            }`}
          >
            {p.challengeMode ? "ON" : "OFF"}
          </button>
        </div>

        {/* Mode Selector Cards */}
        <div className="grid grid-cols-2 gap-2">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => p.onMode(m.id)}
              className={`flex flex-col gap-1 rounded-2xl p-3 text-left transition-all ${
                p.mode === m.id
                  ? "border border-amber-400/60 bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-stone-100 shadow-lg ring-1 ring-amber-400/40"
                  : "border border-white/5 bg-stone-950/60 text-stone-400 hover:border-white/20 hover:text-stone-200"
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs">
                {m.icon}
                <span className={p.mode === m.id ? "text-amber-200" : ""}>{m.label}</span>
              </div>
              <span className="text-[10px] font-medium opacity-75">{m.sub}</span>
            </button>
          ))}
        </div>

        {/* AI Difficulty Selector */}
        <div className="mt-3">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">
            AI Minimax Difficulty
          </div>
          <div className="grid grid-cols-3 gap-2">
            {levels.map((l) => (
              <button
                key={l.id}
                onClick={() => p.onDifficulty(l.id)}
                disabled={p.mode === "hotseat"}
                className={`rounded-xl py-2 px-1 text-center transition-all disabled:opacity-30 ${
                  p.difficulty === l.id
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black shadow-md shadow-amber-950/50"
                    : "bg-stone-950/70 border border-white/5 text-stone-400 hover:bg-stone-800 hover:text-stone-200"
                }`}
              >
                <div className="text-[10px] uppercase tracking-wider">{l.label}</div>
                <div className="text-[9px] opacity-80">{l.note}</div>
              </button>
            ))}
          </div>
        </div>
      </Panel>

      {/* Multiplayer Room Sharing Link Panel */}
      <Panel
        title={p.mode === "online" ? "Online Invite Code" : "Local Hotseat Invite"}
        icon={<Users className="h-4 w-4 text-sky-400" />}
      >
        <div className="flex flex-col gap-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-stone-400">Match Code</span>
            <span className="font-mono text-sm font-black text-sky-400">#{p.roomId || "MATCH"}</span>
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
                <span>Invite Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>{p.mode === "online" ? "Copy Online Invite Link" : "Copy Room Link"}</span>
              </>
            )}
          </button>
        </div>
      </Panel>

      {/* Move History Feed Panel */}
      <Panel title="Move Feed History" icon={<History className="h-4 w-4 text-amber-400" />}>
        <ol className="flex max-h-40 flex-col-reverse gap-1.5 overflow-y-auto pr-1 text-xs text-stone-300">
          {p.log.length === 0 && (
            <li className="py-3 text-center font-medium italic text-stone-500">
              No moves recorded yet. Place the first goat!
            </li>
          )}
          {p.log.map((entry, i) => {
            const isCapture = entry.includes("captured");
            const isPlacement = entry.includes("placed");

            return (
              <li
                key={i}
                className={`flex items-center justify-between rounded-xl border px-3 py-1.5 transition-all ${
                  isCapture
                    ? "border-rose-500/30 bg-rose-500/10 text-rose-200"
                    : isPlacement
                      ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-200"
                      : "border-white/5 bg-stone-950/60 text-stone-300 hover:bg-stone-900"
                }`}
              >
                <span className="font-mono text-[10px] font-bold opacity-60">#{p.log.length - i}</span>
                <span className="font-medium">{entry}</span>
              </li>
            );
          })}
        </ol>
      </Panel>

      {/* Action Controls Toolbar */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={p.onNewGame}
          className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 text-xs font-black uppercase tracking-wider text-stone-950 shadow-xl shadow-amber-950/40 transition-all hover:scale-[1.02] active:scale-95"
        >
          <RotateCcw className="h-4 w-4" />
          <span>New Game</span>
        </button>

        <button
          onClick={p.onHint}
          disabled={!p.canHint}
          className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-xs font-black uppercase tracking-wider text-emerald-950 shadow-xl shadow-emerald-950/40 transition-all disabled:opacity-30 hover:scale-[1.02] active:scale-95"
        >
          <Sparkles className="h-4 w-4 text-emerald-100" />
          <span className="text-emerald-100">Tactical Hint</span>
        </button>

        <button
          onClick={p.onUndo}
          disabled={!p.canUndo}
          className="flex items-center justify-center gap-2 rounded-2xl border border-stone-800 bg-stone-900/90 px-4 py-3 text-xs font-bold tracking-wider text-stone-200 transition-all disabled:opacity-30 hover:bg-stone-800 active:scale-95"
        >
          <Undo2 className="h-4 w-4 text-amber-400" />
          <span>Undo</span>
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
          <span>{p.muted ? "Muted" : "Sound On"}</span>
        </button>
      </div>
    </aside>
  );
}

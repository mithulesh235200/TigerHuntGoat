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

const modes: { id: GameMode; label: string; icon: React.ReactNode }[] = [
  {
    id: "goat-vs-ai",
    label: "Goats vs AI Tigers",
    icon: <BrainCircuit className="h-4 w-4 text-amber-400" />,
  },
  {
    id: "tiger-vs-ai",
    label: "Tigers vs AI Goats",
    icon: <Swords className="h-4 w-4 text-emerald-400" />,
  },
  {
    id: "hotseat",
    label: "2 Players (Local)",
    icon: <Gamepad2 className="h-4 w-4 text-sky-400" />,
  },
  {
    id: "online",
    label: "Online Room",
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
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-stone-800/80 bg-stone-900/80 p-4 backdrop-blur-xl shadow-xl transition-all duration-200 hover:border-stone-700/80">
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <h2 className="text-xs font-bold uppercase tracking-widest text-amber-400/90">{title}</h2>
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
      ? "from-red-500 to-rose-500"
      : p.turnTimeLeft !== undefined && p.turnTimeLeft <= 15
        ? "from-amber-500 to-orange-500"
        : "from-emerald-500 to-teal-500";

  return (
    <aside className="flex w-full flex-col gap-4 lg:max-w-sm">
      {/* Game Status Banner */}
      <Panel title="Live Match Status" icon={<Trophy className="h-4 w-4 text-amber-400" />}>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xl font-black text-stone-100">
            {state.winner
              ? state.winner === "tiger"
                ? "🐯 Tigers Win!"
                : "🐐 Goats Win!"
              : state.turn === "goat"
                ? "Goats to Move"
                : "Tigers to Move"}
          </span>
          <span
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold tracking-wide uppercase shadow-lg ${
              state.turn === "tiger"
                ? "bg-gradient-to-r from-amber-600 to-orange-600 text-amber-100 shadow-amber-900/40 ring-1 ring-amber-400/30"
                : "bg-gradient-to-r from-emerald-600 to-teal-600 text-emerald-100 shadow-emerald-900/40 ring-1 ring-emerald-400/30"
            }`}
          >
            {state.turn === "tiger" ? "🐯 Tiger" : "🐐 Goat"}
          </span>
        </div>

        <div className="mt-3 rounded-xl bg-stone-950/70 p-3 ring-1 ring-white/5">
          {p.thinking ? (
            <div className="flex items-center gap-2.5 text-amber-400">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-500"></span>
              </span>
              <span className="text-sm font-semibold">AI is analyzing moves...</span>
            </div>
          ) : (
            <p
              aria-live="polite"
              aria-atomic="true"
              className="text-sm font-medium leading-relaxed text-stone-300"
            >
              {p.status}
            </p>
          )}
        </div>

        <div className="mt-3 rounded-xl bg-stone-950/60 p-3 ring-1 ring-white/5">
          <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">
            <span>Turn timer</span>
            <span
              className={
                p.turnTimeLeft !== undefined && p.turnTimeLeft <= 8
                  ? "text-red-300"
                  : "text-stone-200"
              }
            >
              {p.turnTimeLeft ?? 0}s
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-800">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${timerColor} transition-all duration-500`}
              style={{ width: `${timerRatio}%` }}
            />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-stone-300">
          <div className="rounded-xl bg-stone-950/60 px-2.5 py-2 ring-1 ring-white/5">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
              Legal moves
            </div>
            <div className="mt-1 text-lg font-black text-amber-300">{p.legalMovesCount ?? 0}</div>
          </div>

          <div className="rounded-xl bg-stone-950/60 px-2.5 py-2 ring-1 ring-white/5">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
              Best move
            </div>
            <div className="mt-1 line-clamp-2 text-[11px] font-semibold text-emerald-300">
              {p.suggestedMove || "—"}
            </div>
          </div>
        </div>
      </Panel>

      <Panel title="AI Coach" icon={<Sparkles className="h-4 w-4 text-emerald-400" />}>
        <p aria-live="polite" className="text-sm leading-relaxed text-stone-300">
          {p.coachInsight || "Make a move to receive a tactical read of the position."}
        </p>
      </Panel>

      {/* Match Progress Scoreboard */}
      <Panel title="Battle Statistics" icon={<ShieldAlert className="h-4 w-4 text-amber-400" />}>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {/* Goats to Place */}
          <div className="rounded-xl bg-stone-950/60 p-3 ring-1 ring-white/5">
            <div className="flex items-center justify-between text-xs font-semibold text-stone-400">
              <span>To Place</span>
              <span className="text-emerald-400">{state.goatsToPlace} remaining</span>
            </div>
            <div className="mt-1 text-2xl font-black text-stone-100">
              {TOTAL_GOATS - state.goatsToPlace}{" "}
              <span className="text-xs font-normal text-stone-500">/ {TOTAL_GOATS}</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-stone-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                style={{ width: `${placementProgress}%` }}
              />
            </div>
          </div>

          {/* Goats Captured */}
          <div className="rounded-xl bg-stone-950/60 p-3 ring-1 ring-white/5">
            <div className="flex items-center justify-between text-xs font-semibold text-stone-400">
              <span>Captured</span>
              <span className="text-rose-400">{CAPTURES_TO_WIN - state.goatsCaptured} to win</span>
            </div>
            <div className="mt-1 text-2xl font-black text-rose-400">
              {state.goatsCaptured}{" "}
              <span className="text-xs font-normal text-stone-500">/ {CAPTURES_TO_WIN}</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-stone-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-rose-500 to-red-600 transition-all duration-500"
                style={{ width: `${captureProgress}%` }}
              />
            </div>
          </div>

          {/* Active Goats on Board */}
          <div className="rounded-xl bg-stone-950/60 p-3 ring-1 ring-white/5">
            <dt className="text-xs font-semibold text-stone-400">On Board</dt>
            <dd className="mt-0.5 text-xl font-bold text-emerald-300">{goatsOnBoard} Goats</dd>
          </div>

          {/* Match Phase */}
          <div className="rounded-xl bg-stone-950/60 p-3 ring-1 ring-white/5">
            <dt className="text-xs font-semibold text-stone-400">Phase</dt>
            <dd className="mt-0.5 text-xl font-bold text-amber-300">
              {state.goatsToPlace > 0 ? "Placement" : "Movement"}
            </dd>
          </div>
        </div>

        <div className="mt-3 rounded-xl bg-stone-950/60 p-3 ring-1 ring-white/5">
          <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.22em] text-stone-400">
            <span>Match record</span>
            <span className="text-amber-300">{p.matchStats?.games ?? 0} games</span>
          </div>
          <div className="mb-2 flex items-center justify-between rounded-lg border border-sky-500/20 bg-sky-500/5 px-2 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-sky-200">
            <span>Session</span>
            <span>#{p.sessionCount ?? 1}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
            <div className="rounded-lg bg-stone-950/60 px-2 py-2 ring-1 ring-white/5">
              <div className="text-stone-500">Goats</div>
              <div className="mt-1 text-base font-black text-emerald-300">
                {p.matchStats?.goatWins ?? 0}
              </div>
            </div>
            <div className="rounded-lg bg-stone-950/60 px-2 py-2 ring-1 ring-white/5">
              <div className="text-stone-500">Tigers</div>
              <div className="mt-1 text-base font-black text-amber-300">
                {p.matchStats?.tigerWins ?? 0}
              </div>
            </div>
            <div className="rounded-lg bg-stone-950/60 px-2 py-2 ring-1 ring-white/5">
              <div className="text-stone-500">Streak</div>
              <div className="mt-1 text-base font-black text-sky-300">
                {p.matchStats?.currentStreak ?? 0}
              </div>
            </div>
          </div>
        </div>
      </Panel>

      {/* Game Mode & AI Difficulty Controls */}
      <Panel title="Game Setup" icon={<BrainCircuit className="h-4 w-4 text-amber-400" />}>
        <div className="mb-3 flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200">
          <span>Challenge</span>
          <button
            type="button"
            onClick={() => p.onMode(p.mode)}
            className={`rounded-full px-2.5 py-1 text-[9px] font-black ${
              p.challengeMode ? "bg-amber-400 text-stone-950" : "bg-stone-800 text-stone-200"
            }`}
          >
            {p.challengeMode ? "ON" : "OFF"}
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => p.onMode(m.id)}
              className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-xs font-bold tracking-wide transition-all ${
                p.mode === m.id
                  ? "bg-gradient-to-r from-amber-600 to-amber-700 text-stone-950 shadow-md shadow-amber-900/30 ring-1 ring-amber-400/50"
                  : "bg-stone-950/60 text-stone-300 ring-1 ring-white/5 hover:bg-stone-800/60 hover:text-stone-100"
              }`}
            >
              <div className="flex items-center gap-2.5">
                {m.icon}
                <span>{m.label}</span>
              </div>
              {p.mode === m.id && <span className="h-2 w-2 rounded-full bg-stone-950" />}
            </button>
          ))}
        </div>

        {/* AI Difficulty Pills */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          {levels.map((l) => (
            <button
              key={l.id}
              onClick={() => p.onDifficulty(l.id)}
              disabled={p.mode === "hotseat"}
              className={`rounded-xl px-1 py-2 text-center transition-all disabled:opacity-30 ${
                p.difficulty === l.id
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 shadow-md shadow-amber-900/30"
                  : "bg-stone-950/60 text-stone-400 ring-1 ring-white/5 hover:bg-stone-800/60 hover:text-stone-200"
              }`}
            >
              <div className="text-[10px] font-black uppercase tracking-[0.18em]">{l.label}</div>
              <div className="mt-0.5 text-[9px] font-semibold opacity-80">{l.note}</div>
            </button>
          ))}
        </div>
      </Panel>

      {/* Multiplayer room link */}
      <Panel
        title={p.mode === "online" ? "Online Room Invite" : "Local Hotseat Link"}
        icon={<Users className="h-4 w-4 text-sky-400" />}
      >
        <div className="flex flex-col gap-2.5">
          <p className="text-xs leading-relaxed text-stone-400">
            {p.mode === "online"
              ? `You are playing as ${p.onlineRole === "tiger" ? "Tigers" : "Goats"}. Send the link to your opponent.`
              : "Use this link to reopen the same two-player setup on this device."}
          </p>
          <div className="flex items-center justify-between text-xs font-semibold text-stone-400">
            <span>Match Room Code</span>
            <span className="font-mono text-xs font-extrabold text-sky-400">
              #{p.roomId || "MATCH"}
            </span>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-stone-950/80 p-2 ring-1 ring-white/10">
            <LinkIcon className="h-4 w-4 shrink-0 text-stone-400" />
            <input
              type="text"
              readOnly
              value={
                typeof window !== "undefined"
                  ? `${window.location.origin}${window.location.pathname}?mode=${p.mode}&room=${p.roomId || "MATCH"}&role=tiger`
                  : `?mode=${p.mode}&room=${p.roomId || "MATCH"}&role=tiger`
              }
              className="w-full bg-transparent font-mono text-xs text-stone-300 outline-none select-all"
            />
          </div>

          <button
            onClick={p.onCopyInviteLink}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all shadow-md ${
              p.copied
                ? "bg-emerald-500 text-stone-950 shadow-emerald-950/40"
                : "bg-gradient-to-r from-sky-600 to-blue-600 text-stone-100 shadow-sky-900/30 hover:brightness-110 active:scale-95"
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
                <span>{p.mode === "online" ? "Copy Online Invite" : "Copy Local Match Link"}</span>
              </>
            )}
          </button>

          <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] font-semibold text-stone-400">
            <div className="flex items-center gap-1.5 rounded-lg bg-stone-950/50 px-2 py-1 ring-1 ring-white/5">
              <span>🐐 P1: Goats</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-stone-950/50 px-2 py-1 ring-1 ring-white/5">
              <span>🐯 P2: Tigers</span>
            </div>
          </div>
        </div>
      </Panel>

      {/* Scrollable Move History Log */}
      <Panel title="Move Feed" icon={<History className="h-4 w-4 text-amber-400" />}>
        <ol className="flex max-h-44 flex-col-reverse gap-1.5 overflow-y-auto pr-1 text-xs text-stone-300 scrollbar-thin scrollbar-thumb-stone-700">
          {p.log.length === 0 && (
            <li className="py-2 text-center text-stone-500 italic">No moves recorded yet</li>
          )}
          {p.log.map((entry, i) => (
            <li
              key={i}
              className="flex items-center justify-between rounded-lg bg-stone-950/60 px-3 py-1.5 ring-1 ring-white/5 hover:bg-stone-800/50"
            >
              <span className="font-mono text-stone-500">#{p.log.length - i}</span>
              <span className="font-medium text-stone-200">{entry}</span>
            </li>
          ))}
        </ol>
      </Panel>

      {/* Action Controls Toolbar */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={p.onNewGame}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-xs font-bold tracking-wider text-stone-950 shadow-lg shadow-amber-900/30 transition-transform active:scale-95 hover:brightness-110"
        >
          <RotateCcw className="h-4 w-4" />
          <span>New Game</span>
        </button>

        <button
          onClick={p.onHint}
          disabled={!p.canHint}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-bold tracking-wider text-emerald-950 shadow-lg shadow-emerald-950/40 transition-transform active:scale-95 disabled:opacity-30 hover:brightness-110"
        >
          <Sparkles className="h-4 w-4 text-emerald-200" />
          <span className="text-emerald-100">Tactical Hint</span>
        </button>

        <button
          onClick={p.onUndo}
          disabled={!p.canUndo}
          className="flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-xs font-bold tracking-wider text-stone-200 ring-1 ring-stone-800 transition-all disabled:opacity-30 hover:bg-stone-800"
        >
          <Undo2 className="h-4 w-4 text-amber-400" />
          <span>Undo</span>
        </button>

        <button
          onClick={p.onToggleMute}
          className="flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-xs font-bold tracking-wider text-stone-200 ring-1 ring-stone-800 transition-all hover:bg-stone-800"
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

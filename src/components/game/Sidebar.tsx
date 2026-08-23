import { CAPTURES_TO_WIN, TOTAL_GOATS, type GameState } from "@/lib/game/engine";
import type { Difficulty } from "@/lib/game/ai";

export type GameMode = "goat-vs-ai" | "tiger-vs-ai" | "hotseat";

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
  onMode: (m: GameMode) => void;
  onDifficulty: (d: Difficulty) => void;
  onToggleMute: () => void;
  onNewGame: () => void;
  onReset: () => void;
  onUndo: () => void;
  onHint: () => void;
};

const modes: { id: GameMode; label: string }[] = [
  { id: "goat-vs-ai", label: "Play Goats vs AI Tigers" },
  { id: "tiger-vs-ai", label: "Play Tigers vs AI Goats" },
  { id: "hotseat", label: "Local Hotseat (2 players)" },
];

const levels: { id: Difficulty; label: string }[] = [
  { id: "easy", label: "Easy" },
  { id: "medium", label: "Medium" },
  { id: "hard", label: "Hard" },
];

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-card p-4 shadow-soft ring-1 ring-line/15">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function Sidebar(p: Props) {
  const { state } = p;
  const goatsOnBoard = state.cells.filter((c) => c === "goat").length;

  return (
    <aside className="flex w-full flex-col gap-4 lg:max-w-sm">
      <Panel title="Status">
        <div className="flex items-center justify-between gap-3">
          <span className="text-lg font-semibold text-foreground">
            {state.winner
              ? state.winner === "tiger"
                ? "Tigers win"
                : "Goats win"
              : state.turn === "goat"
                ? "Goats to play"
                : "Tigers to play"}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              state.turn === "tiger" ? "bg-tiger/20 text-tiger-ink" : "bg-goat/30 text-foreground"
            }`}
          >
            {state.turn === "tiger" ? "🐯 Tiger" : "🐐 Goat"}
          </span>
        </div>
        <p className="mt-2 min-h-10 text-sm text-muted-foreground">
          {p.thinking ? "AI is thinking…" : p.status}
        </p>
      </Panel>

      <Panel title="Score">
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-muted p-3">
            <dt className="text-muted-foreground">To place</dt>
            <dd className="text-xl font-bold">
              {state.goatsToPlace} / {TOTAL_GOATS}
            </dd>
          </div>
          <div className="rounded-xl bg-muted p-3">
            <dt className="text-muted-foreground">Captured</dt>
            <dd className="text-xl font-bold text-danger">
              {state.goatsCaptured} / {CAPTURES_TO_WIN}
            </dd>
          </div>
          <div className="rounded-xl bg-muted p-3">
            <dt className="text-muted-foreground">Goats on board</dt>
            <dd className="text-xl font-bold">{goatsOnBoard}</dd>
          </div>
          <div className="rounded-xl bg-muted p-3">
            <dt className="text-muted-foreground">Phase</dt>
            <dd className="text-xl font-bold">{state.goatsToPlace > 0 ? "Placement" : "Movement"}</dd>
          </div>
        </dl>
      </Panel>

      <Panel title="Game mode">
        <div className="flex flex-col gap-2">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => p.onMode(m.id)}
              className={`rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors ${
                p.mode === m.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground hover:bg-accent"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {levels.map((l) => (
            <button
              key={l.id}
              onClick={() => p.onDifficulty(l.id)}
              disabled={p.mode === "hotseat"}
              className={`rounded-xl px-2 py-2 text-sm font-medium transition-colors disabled:opacity-40 ${
                p.difficulty === l.id
                  ? "bg-tiger text-tiger-foreground"
                  : "bg-muted text-foreground hover:bg-accent"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </Panel>

      <Panel title="Move history">
        <ol className="flex max-h-52 flex-col-reverse gap-1 overflow-y-auto text-sm text-muted-foreground">
          {p.log.length === 0 && <li>No moves yet.</li>}
          {p.log.map((entry, i) => (
            <li key={i} className="rounded-md px-2 py-1 odd:bg-muted/60">
              {p.log.length - i}. {entry}
            </li>
          ))}
        </ol>
      </Panel>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={p.onNewGame}
          className="rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          New Game
        </button>
        <button
          onClick={p.onReset}
          className="rounded-xl bg-muted px-3 py-2 text-sm font-semibold transition-colors hover:bg-accent"
        >
          Reset Board
        </button>
        <button
          onClick={p.onUndo}
          disabled={!p.canUndo}
          className="rounded-xl bg-muted px-3 py-2 text-sm font-semibold transition-colors hover:bg-accent disabled:opacity-40"
        >
          Undo Move
        </button>
        <button
          onClick={p.onHint}
          disabled={!p.canHint}
          className="rounded-xl bg-highlight/15 px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-highlight/25 disabled:opacity-40"
        >
          ✨ Tactical Hint
        </button>
        <button
          onClick={p.onToggleMute}
          className="rounded-xl bg-muted px-3 py-2 text-sm font-semibold transition-colors hover:bg-accent"
        >
          {p.muted ? "🔇 Sound off" : "🔊 Sound on"}
        </button>
      </div>
    </aside>
  );
}

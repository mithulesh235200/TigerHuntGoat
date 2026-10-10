import { useMemo, useState } from "react";
import { X, ChevronLeft, ChevronRight, GraduationCap, Play, Eye } from "lucide-react";
import { GameBoard } from "@/components/game/GameBoard";
import { applyMove, createGame, type GameState } from "@/lib/game/engine";
import { chooseMove } from "@/lib/game/ai";
import { useLang } from "@/lib/i18n";

type Props = {
  open: boolean;
  onClose: () => void;
  onPractice: () => void;
};

const TURN_SECONDS = 30;

export function Tutorial({ open, onClose, onPractice }: Props) {
  const { t } = useLang();
  const [step, setStep] = useState(0);
  const [sandbox, setSandbox] = useState<GameState[]>([createGame()]);

  const steps = useMemo(
    () => [
      { title: t.tourStep1T, body: t.tourStep1B },
      { title: t.tourStep2T, body: t.tourStep2B },
      { title: t.tourStep3T, body: t.tourStep3B },
      { title: t.tourStep4T, body: t.tourStep4B },
      { title: t.tourStep5T, body: t.tourStep5B },
    ],
    [t],
  );

  if (!open) return null;

  const state = sandbox[sandbox.length - 1];

  const demo = () => {
    const move = chooseMove(state, state.turn, "easy");
    if (!move) return;
    setSandbox((s) => [...s, applyMove(s[s.length - 1], move)]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-stone-950/85 px-4 py-6 backdrop-blur-md">
      <div className="t-board-frame t-overlay-card w-full max-w-3xl rounded-3xl p-6 ring-1 ring-white/10 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="t-chip inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-[10px] font-bold uppercase tracking-[0.28em]">
            <GraduationCap className="h-3.5 w-3.5" />
            {t.tourKicker}
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-stone-900 text-stone-400 transition-colors hover:bg-stone-800 hover:text-white"
            aria-label={t.tourSkip}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <h2 className="t-text-gradient mt-4 text-2xl font-black sm:text-3xl">{t.tourTitle}</h2>

        <div className="mt-4 flex justify-center">
          <div className="w-full max-w-[420px]">
            <GameBoard
              state={state}
              selected={null}
              targets={[]}
              lastMove={null}
              hint={null}
              interactive={false}
              turnTimeLeft={TURN_SECONDS}
              turnTimeLimit={TURN_SECONDS}
              onNodeClick={() => {}}
            />
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-white/5 bg-stone-950/60 p-4">
          <div className="text-[10px] font-black uppercase tracking-[0.24em] t-accent-text">
            {t.tourKicker} {step + 1} / {steps.length}
          </div>
          <h3 className="mt-1 text-lg font-black text-stone-100">{steps[step].title}</h3>
          <p className="mt-1 text-xs leading-relaxed text-stone-300 sm:text-sm">
            {steps[step].body}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="flex items-center gap-1 rounded-xl border border-stone-800 bg-stone-900/90 px-3 py-2 text-xs font-bold text-stone-200 transition-all disabled:opacity-30 hover:bg-stone-800"
          >
            <ChevronLeft className="h-4 w-4" />
            {t.tourBack}
          </button>
          {step < steps.length - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="t-btn-primary flex items-center gap-1 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider transition-transform hover:scale-105 active:scale-95"
            >
              {t.tourNext}
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={onPractice}
              className="t-btn-primary flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider transition-transform hover:scale-105 active:scale-95"
            >
              <Play className="h-4 w-4" />
              {t.tourPractice}
            </button>
          )}
          <button
            onClick={demo}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-stone-950/70 px-3 py-2 text-xs font-bold text-stone-200 transition-all hover:border-white/25"
          >
            <Eye className="h-4 w-4 t-accent-text" />
            {t.tourDemo} ({sandbox.length - 1})
          </button>
          <button
            onClick={onClose}
            className="ml-auto text-[11px] font-bold text-stone-500 hover:text-stone-300"
          >
            {t.tourSkip}
          </button>
        </div>
      </div>
    </div>
  );
}

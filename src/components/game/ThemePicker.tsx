import { Palette } from "lucide-react";
import { THEMES, type ThemeId } from "@/lib/theme";
import { useLang } from "@/lib/i18n";

type Props = {
  value: ThemeId;
  onChange: (t: ThemeId) => void;
  compact?: boolean;
};

export function ThemePicker({ value, onChange, compact }: Props) {
  const { t } = useLang();
  return (
    <div className={compact ? "" : "rounded-2xl border border-white/5 bg-stone-950/70 p-3"}>
      <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">
        <Palette className="h-3.5 w-3.5 t-accent-text" />
        <span>{t.appTheme}</span>
      </div>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="App theme">
        {THEMES.map((t) => {
          const active = t.id === value;
          return (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={active}
              title={t.label}
              onClick={() => onChange(t.id)}
              className={`flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3 text-[11px] font-bold transition-all hover:scale-105 active:scale-95 ${
                active
                  ? "t-chip t-theme-ring"
                  : "border-white/10 bg-stone-900/80 text-stone-300 hover:border-white/25"
              }`}
            >
              <span
                className="flex h-5 w-9 overflow-hidden rounded-full"
                style={{ background: `linear-gradient(135deg, ${t.swatch[0]}, ${t.swatch[1]})` }}
              />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Customisable accent theme: persisted, SSR-safe, applied via data-theme on <html>.

export const THEMES = [
  { id: "ember", label: "Ember Amber", swatch: ["#f59e0b", "#ea580c"] },
  { id: "forest", label: "Forest Emerald", swatch: ["#10b981", "#047857"] },
  { id: "royal", label: "Royal Amethyst", swatch: ["#8b5cf6", "#6d28d9"] },
  { id: "ocean", label: "Ocean Sapphire", swatch: ["#06b6d4", "#0369a1"] },
  { id: "crimson", label: "Crimson Ruby", swatch: ["#f43f5e", "#be123c"] },
  { id: "ivory", label: "Ivory Day", swatch: ["#f5efe2", "#b45309"] },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

export const DEFAULT_THEME: ThemeId = "ember";
export const THEME_KEY = "aadu-puli-aatam-theme";

export function isThemeId(value: unknown): value is ThemeId {
  return THEMES.some((t) => t.id === value);
}

export function getSavedTheme(): ThemeId {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return DEFAULT_THEME;
  try {
    const raw = localStorage.getItem(THEME_KEY);
    if (raw && isThemeId(raw)) return raw;
    // Back-compat: theme stored inside the game settings JSON.
    const settings = localStorage.getItem("aadu-puli-aatam-settings");
    if (settings) {
      const parsed = JSON.parse(settings) as { theme?: unknown };
      if (parsed && isThemeId(parsed.theme)) return parsed.theme;
    }
  } catch {
    // Corrupt storage — fall through to default.
  }
  return DEFAULT_THEME;
}

export function applyTheme(id: ThemeId) {
  if (typeof document !== "undefined") {
    document.documentElement.dataset.theme = id;
  }
  try {
    localStorage.setItem(THEME_KEY, id);
  } catch {
    // Private mode etc. — theme still applies for this session.
  }
}

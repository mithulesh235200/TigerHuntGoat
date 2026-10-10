// Human-readable move log lines (bilingual via Strings).
import { LABELS } from "./game/board";
import type { Move, Side } from "./game/engine";
import type { Strings } from "./i18n";

export function describeMove(move: Move, side: Side, t: Strings): string {
  const who = side === "tiger" ? t.whoTiger : t.whoGoat;
  if (move.kind === "place")
    return t.logPlace.replace("{who}", who).replace("{node}", LABELS[move.to]);
  if (move.kind === "capture") {
    return t.logCapture
      .replace("{who}", who)
      .replace("{from}", LABELS[move.from])
      .replace("{to}", LABELS[move.to])
      .replace("{over}", LABELS[move.over]);
  }
  return t.logMove
    .replace("{who}", who)
    .replace("{from}", LABELS[move.from])
    .replace("{to}", LABELS[move.to]);
}

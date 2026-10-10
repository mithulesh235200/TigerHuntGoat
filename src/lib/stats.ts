// Per-game records for the analytics dashboard (localStorage, capped).
import type { Side } from "./game/engine";

export type GameRecord = {
  /** epoch ms */
  d: number;
  /** winner */
  w: Side;
  /** total moves */
  m: number;
  /** goats captured */
  c: number;
  /** game mode id */
  mode: string;
};

const RECORD_KEY = "aadu-puli-aatam-records";
const MAX_RECORDS = 120;

export function loadRecords(): GameRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECORD_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as GameRecord[];
    return Array.isArray(parsed)
      ? parsed.filter((r) => r && (r.w === "goat" || r.w === "tiger"))
      : [];
  } catch {
    return [];
  }
}

export function saveRecords(records: GameRecord[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RECORD_KEY, JSON.stringify(records.slice(-MAX_RECORDS)));
  } catch {
    // Storage full / private mode — stats just won't persist.
  }
}

// Small device-capability helpers: haptics + native share with clipboard fallback.

export function buzz(pattern: number | number[]) {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    // Haptics unsupported — ignore.
  }
}

export type ShareResult = "shared" | "copied" | "dismissed" | "failed";

export async function shareOrCopy(data: {
  title: string;
  text: string;
  url: string;
}): Promise<ShareResult> {
  if (typeof navigator !== "undefined" && "share" in navigator) {
    try {
      await navigator.share(data);
      return "shared";
    } catch (e) {
      // AbortError = user dismissed the sheet; anything else falls to clipboard.
      if (e instanceof DOMException && e.name === "AbortError") return "dismissed";
    }
  }
  try {
    await navigator.clipboard.writeText(data.url);
    return "copied";
  } catch {
    return "failed";
  }
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

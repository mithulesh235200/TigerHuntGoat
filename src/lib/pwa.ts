// PWA helpers: service-worker registration, install prompt, online status.
// All functions are SSR-safe (no-op on server).

export function registerServiceWorker() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  // Only register on secure contexts (https / localhost) — required for SW.
  if (!window.isSecureContext && window.location.hostname !== "localhost") return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Offline still works for the current session; SW just won't persist cache.
    });
  });
}

export type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};

export function onInstallPrompt(callback: (e: InstallPromptEvent) => void) {
  if (typeof window === "undefined") return () => {};
  const handler = (e: Event) => {
    e.preventDefault();
    callback(e as InstallPromptEvent);
  };
  window.addEventListener("beforeinstallprompt", handler);
  return () => window.removeEventListener("beforeinstallprompt", handler);
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

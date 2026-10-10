import { useEffect, useState } from "react";
import { WifiOff, Download } from "lucide-react";
import { onInstallPrompt, isStandalone, type InstallPromptEvent } from "@/lib/pwa";
import { useLang } from "@/lib/i18n";

export function PwaBadges() {
  const { t } = useLang();
  const [online, setOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine);
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(() =>
    typeof window === "undefined" ? false : isStandalone(),
  );

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    const off = onInstallPrompt(setPromptEvent);
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("appinstalled", onInstalled);
      off();
    };
  }, []);

  const install = async () => {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice.catch(() => ({ outcome: "dismissed" }));
    if (choice.outcome === "accepted") setPromptEvent(null);
  };

  if (online && (installed || !promptEvent)) return null;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-2 px-4 pt-3 lg:px-8">
      {!online && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-200"
        >
          <WifiOff className="h-3.5 w-3.5" />
          <span>{t.offlineMsg}</span>
        </div>
      )}
      {online && promptEvent && !installed && (
        <button
          onClick={install}
          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-stone-950 shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          <Download className="h-3.5 w-3.5" />
          <span>{t.installCta}</span>
        </button>
      )}
    </div>
  );
}

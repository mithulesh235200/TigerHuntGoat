import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useLang } from "@/lib/i18n";
import type { GameRecord } from "@/lib/stats";

const GOAT = "#10b981";
const TIGER = "#f59e0b";
const MUTED = "#78716c";

export function StatsCharts({ records }: { records: GameRecord[] }) {
  const { t, lang } = useLang();

  const pie = useMemo(() => {
    const goats = records.filter((r) => r.w === "goat").length;
    const tigers = records.length - goats;
    return [
      { name: lang === "ta" ? "ஆடு" : "Goats", value: goats, fill: GOAT },
      { name: lang === "ta" ? "புலி" : "Tigers", value: tigers, fill: TIGER },
    ];
  }, [records, lang]);

  const byMode = useMemo(() => {
    const order = ["goat-vs-ai", "tiger-vs-ai", "hotseat", "online"] as const;
    const short: Record<string, string> =
      lang === "ta"
        ? { "goat-vs-ai": "ஆடு", "tiger-vs-ai": "புலி", hotseat: "2P", online: "நேரலை" }
        : { "goat-vs-ai": "Goats", "tiger-vs-ai": "Tigers", hotseat: "2P", online: "Online" };
    return order.map((m, i) => ({
      name: short[m],
      games: records.filter((r) => r.mode === m).length,
      fill: [GOAT, TIGER, "#38bdf8", "#22d3ee"][i],
    }));
  }, [records, lang]);

  const recent = useMemo(
    () =>
      records.slice(-8).map((r, i) => ({
        name: `${i + 1}`,
        captures: r.c,
        fill: r.w === "goat" ? GOAT : TIGER,
      })),
    [records],
  );

  if (records.length === 0) {
    return <p className="py-3 text-center text-xs font-medium italic text-stone-500">{t.noData}</p>;
  }

  const tipStyle = {
    backgroundColor: "#1c1917",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 12,
    fontSize: 12,
  };

  return (
    <div className="flex flex-col gap-3 text-xs">
      <div>
        <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">
          {t.winRate}
        </div>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pie}
                dataKey="value"
                nameKey="name"
                innerRadius={38}
                outerRadius={58}
                paddingAngle={3}
              >
                {pie.map((p) => (
                  <Cell key={p.name} fill={p.fill} />
                ))}
              </Pie>
              <Tooltip contentStyle={tipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-4 text-[11px] font-bold text-stone-300">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: GOAT }} />
            {pie[0].name} · {pie[0].value}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: TIGER }} />
            {pie[1].name} · {pie[1].value}
          </span>
        </div>
      </div>

      <div>
        <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">
          {t.byMode}
        </div>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byMode} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis
                dataKey="name"
                tick={{ fill: MUTED, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: MUTED, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip contentStyle={tipStyle} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
              <Bar dataKey="games" radius={[6, 6, 0, 0]}>
                {byMode.map((b) => (
                  <Cell key={b.name} fill={b.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">
          {t.recentCaptures}
        </div>
        <div className="h-28">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={recent} margin={{ top: 4, right: 4, bottom: 0, left: -22 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis
                dataKey="name"
                tick={{ fill: MUTED, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: MUTED, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip contentStyle={tipStyle} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
              <Bar dataKey="captures" radius={[6, 6, 0, 0]}>
                {recent.map((b, i) => (
                  <Cell key={i} fill={b.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

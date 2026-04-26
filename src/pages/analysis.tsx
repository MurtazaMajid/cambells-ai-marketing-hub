import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api, type Segment, type Risk, type SpendingTier, type TimePreference, type FoodPreference } from "@/lib/api";
import { Topbar } from "@/components/layout/Topbar";
import { SegmentBadge, RiskBadge } from "@/components/ui-kit/Badges";
import { usePageMeta } from "@/hooks/use-page-meta";

const SEG_COLORS: Record<Segment, string> = {
  Lost: "var(--red)", New: "var(--blue)", Occasional: "var(--yellow)", Regular: "var(--green)",
};
const RISK_COLORS: Record<Risk, string> = { High: "var(--red)", Medium: "var(--yellow)", Low: "var(--green)" };

function Card({ title, subtitle, children, className = "" }: { title: string; subtitle?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`card-surface p-5 ${className}`}>
      <div className="mb-4">
        <div className="text-[13px] font-medium">{title}</div>
        {subtitle && <div className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

type Tab = "all" | "rfm" | "churn" | "revenue" | "behavioral" | "profiles";
const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "Overview" },
  { id: "rfm", label: "RFM" },
  { id: "churn", label: "Churn" },
  { id: "revenue", label: "Revenue" },
  { id: "behavioral", label: "Behavioral" },
  { id: "profiles", label: "Profiles" },
];

export default function AnalysisPage() {
  usePageMeta("Analysis · Campbell's AI Marketing Hub", "Deep RFM, churn, revenue and behavioral analysis dashboards.");
  const [tab, setTab] = useState<Tab>("all");
  const kpis = useQuery({ queryKey: ["analysis-kpis"], queryFn: api.kpis });
  const rfm = useQuery({ queryKey: ["analysis-rfm"], queryFn: api.rfm });
  const churn = useQuery({ queryKey: ["analysis-churn"], queryFn: api.churnDistribution });
  const monthly = useQuery({ queryKey: ["analysis-monthly"], queryFn: api.monthlyVisits });
  const revenue = useQuery({ queryKey: ["analysis-revenue"], queryFn: api.revenue });

  const show = (t: Tab) => tab === "all" || tab === t;

  return (
    <>
      <Topbar
        title="Analysis"
        subtitle="RFM · Churn · Revenue · Behavioral · Profiles"
        actions={<span className="text-[11px] text-muted-foreground">Live · refreshes on focus</span>}
      />
      <div className="flex-1 overflow-y-auto px-7 py-6 space-y-4">
        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <MiniKpi label="Customers" value={kpis.data?.total_customers.toLocaleString() ?? "—"} />
          <MiniKpi label="Total revenue" value={kpis.data ? `$${(kpis.data.total_revenue / 1000).toFixed(1)}k` : "—"} accent="var(--green)" />
          <MiniKpi label="Avg spend" value={kpis.data ? `$${kpis.data.avg_spend.toFixed(0)}` : "—"} />
          <MiniKpi label="Churn rate" value={kpis.data ? `${kpis.data.churn_rate_pct.toFixed(0)}%` : "—"} accent="var(--red)" />
          <MiniKpi label="High risk" value={kpis.data?.high_risk_count.toLocaleString() ?? "—"} accent="var(--red)" />
          <MiniKpi label="Urgent re-engage" value={kpis.data?.urgent_reachout.toLocaleString() ?? "—"} accent="var(--accent-orange)" />
        </div>

        {/* Tab nav */}
        <div className="flex gap-1 border-b border-border overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-[13px] border-b-2 transition whitespace-nowrap ${
                tab === t.id ? "border-orange text-orange font-medium" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* RFM scatter + churn histogram */}
        {(show("rfm") || show("churn")) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {show("rfm") && (
              <Card title="RFM scatter" subtitle="Recency × Monetary · colored by segment">
                {rfm.data ? <RfmScatter data={rfm.data} /> : <Skeleton h={320} />}
                <Legend items={(["Lost","New","Occasional","Regular"] as Segment[]).map((s) => ({ label: s, color: SEG_COLORS[s] }))} />
              </Card>
            )}
            {show("churn") && (
              <Card title="Churn probability distribution" subtitle={churn.data ? `Avg ${(churn.data.overall_avg_churn * 100).toFixed(1)}% across base` : "Histogram bucketed 10%"}>
                {churn.data ? <Histogram data={churn.data.histogram} /> : <Skeleton h={320} />}
              </Card>
            )}
          </div>
        )}

        {/* Churn-by-segment + revenue-by-segment */}
        {(show("churn") || show("revenue")) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {show("churn") && (
              <Card title="Avg churn probability by segment">
                {churn.data ? <SegmentBars data={churn.data.churn_by_segment} suffix="%" mul={100} /> : <Skeleton h={220} />}
              </Card>
            )}
            {show("revenue") && (
              <Card title="Revenue by segment" subtitle="Total monetary value contributed">
                {revenue.data ? (
                  <SegmentBars
                    data={Object.fromEntries(Object.entries(revenue.data.revenue_by_segment).map(([k, v]) => [k, v.total_revenue]))}
                    prefix="$"
                    fmt={(n) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toFixed(0)}
                  />
                ) : <Skeleton h={220} />}
              </Card>
            )}
          </div>
        )}

        {/* Monthly visits + spend distribution */}
        {(show("behavioral") || show("revenue")) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {show("behavioral") && (
              <Card title="Monthly visit volume" subtitle="Nov 2023 – Jan 2024 · engagement trend">
                {monthly.data ? <MonthlyBars data={monthly.data.monthly_totals} /> : <Skeleton h={260} />}
              </Card>
            )}
            {show("revenue") && (
              <Card title="Spend distribution" subtitle="Customer count per spend bucket">
                {revenue.data ? <Histogram data={revenue.data.spend_distribution} bar="var(--green)" /> : <Skeleton h={260} />}
              </Card>
            )}
          </div>
        )}

        {/* Cohort heatmap + top spenders */}
        {(show("churn") || show("revenue")) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {show("churn") && (
              <Card title="Cohort heatmap" subtitle="Segment × risk · customer counts">
                {churn.data ? <CohortHeatmap rows={churn.data.risk_by_segment} /> : <Skeleton h={260} />}
              </Card>
            )}
            {show("revenue") && (
              <Card title="Top spenders">
                {revenue.data ? (
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr>
                        {["Customer","Segment","Monetary","Visits","Risk"].map((h) => (
                          <th key={h} className="text-left py-1.5 px-2 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {revenue.data.top_spenders.map((s) => (
                        <tr key={s.id} className="hover:bg-white/[0.025]">
                          <td className="py-1.5 px-2 font-mono text-muted-foreground">#{s.id}</td>
                          <td className="py-1.5 px-2"><SegmentBadge value={s.segment} /></td>
                          <td className="py-1.5 px-2 font-medium">${s.monetary.toFixed(2)}</td>
                          <td className="py-1.5 px-2">{s.frequency}</td>
                          <td className="py-1.5 px-2"><RiskBadge value={s.risk_level} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <Skeleton h={260} />}
              </Card>
            )}
          </div>
        )}

        {/* Behavioral: discount usage + frequency */}
        {show("behavioral") && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card title="Discount usage" subtitle="Customers who redeemed offers">
              {revenue.data ? <DiscountSplit used={revenue.data.discount_users} not={revenue.data.non_discount_users} /> : <Skeleton h={180} />}
            </Card>
            <Card title="Visit frequency distribution">
              {monthly.data ? <Histogram data={monthly.data.frequency_distribution} bar="var(--blue)" /> : <Skeleton h={180} />}
            </Card>
          </div>
        )}

        {/* Profiles tab */}
        {show("profiles") && <ProfilesSection />}
      </div>
    </>
  );
}

function MiniKpi({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="card-surface px-4 py-3 relative overflow-hidden">
      {accent && <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: accent }} />}
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="text-[20px] font-semibold mt-1 leading-none">{value}</div>
    </div>
  );
}

function Skeleton({ h = 200 }: { h?: number }) {
  return <div className="animate-pulse bg-white/[0.04] rounded-md" style={{ height: h }} />;
}

function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap gap-3 mt-3">
      {items.map((it) => (
        <span key={it.label} className="text-[11px] text-muted-foreground flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: it.color }} />{it.label}
        </span>
      ))}
    </div>
  );
}

/* ── Charts (pure SVG) ─────────────────────────────────── */

function RfmScatter({ data }: { data: import("@/lib/api").RfmResponse }) {
  const W = 520, H = 280, pad = 32;
  const points = data!.scatter_data;
  const maxR = Math.max(...points.map((p) => p.recency), 1);
  const maxM = Math.max(...points.map((p) => p.monetary), 1);
  const x = (r: number) => pad + (r / maxR) * (W - pad * 2);
  const y = (m: number) => H - pad - (m / maxM) * (H - pad * 2);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[280px]">
      {/* axes */}
      <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="var(--border-strong)" />
      <line x1={pad} y1={pad} x2={pad} y2={H - pad} stroke="var(--border-strong)" />
      {[0.25, 0.5, 0.75].map((t) => (
        <line key={t} x1={pad} y1={pad + t * (H - pad * 2)} x2={W - pad} y2={pad + t * (H - pad * 2)} stroke="var(--border)" strokeDasharray="2 4" />
      ))}
      {points.map((p, i) => (
        <circle key={i} cx={x(p.recency)} cy={y(p.monetary)} r={3} fill={SEG_COLORS[p.segment] ?? "var(--muted)"} fillOpacity={0.7}>
          <title>#{p.id} · {p.segment} · R{p.recency}d · ${p.monetary.toFixed(0)}</title>
        </circle>
      ))}
      <text x={W / 2} y={H - 6} textAnchor="middle" fontSize="10" fill="var(--muted)">Recency (days) →</text>
      <text x={10} y={H / 2} fontSize="10" fill="var(--muted)" transform={`rotate(-90 10 ${H / 2})`} textAnchor="middle">Monetary ($) →</text>
    </svg>
  );
}

function Histogram({ data, bar = "var(--accent-orange)" }: { data: Record<string, number>; bar?: string }) {
  const entries = Object.entries(data);
  const max = Math.max(...entries.map(([, v]) => v), 1);
  const W = 520, H = 240, pad = 28;
  const bw = (W - pad * 2) / entries.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[240px]">
      {entries.map(([k, v], i) => {
        const h = (v / max) * (H - pad * 2);
        return (
          <g key={k}>
            <rect x={pad + i * bw + 2} y={H - pad - h} width={bw - 4} height={h} fill={bar} fillOpacity={0.8} rx={2}>
              <title>{k}: {v}</title>
            </rect>
            <text x={pad + i * bw + bw / 2} y={H - pad + 12} textAnchor="middle" fontSize="9" fill="var(--muted)">{k}</text>
            {v > 0 && <text x={pad + i * bw + bw / 2} y={H - pad - h - 4} textAnchor="middle" fontSize="9" fill="var(--foreground)">{v}</text>}
          </g>
        );
      })}
    </svg>
  );
}

function SegmentBars({ data, suffix = "", prefix = "", mul = 1, fmt }: { data: Record<string, number>; suffix?: string; prefix?: string; mul?: number; fmt?: (n: number) => string }) {
  const entries = Object.entries(data);
  const max = Math.max(...entries.map(([, v]) => v * mul), 1);
  return (
    <div className="space-y-2.5">
      {entries.map(([seg, v]) => {
        const val = v * mul;
        return (
          <div key={seg} className="flex items-center gap-3">
            <div className="w-[80px]"><SegmentBadge value={seg as Segment} /></div>
            <div className="flex-1 h-2.5 bg-white/[0.06] rounded">
              <div className="h-full rounded transition-all" style={{ width: `${(val / max) * 100}%`, background: SEG_COLORS[seg as Segment] ?? "var(--muted)" }} />
            </div>
            <div className="text-[12px] font-medium w-[70px] text-right">
              {prefix}{fmt ? fmt(val) : (mul === 100 ? val.toFixed(1) : val.toFixed(2))}{suffix}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MonthlyBars({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data);
  const max = Math.max(...entries.map(([, v]) => v), 1);
  const W = 520, H = 240, pad = 32;
  const bw = (W - pad * 2) / entries.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[240px]">
      {entries.map(([k, v], i) => {
        const h = (v / max) * (H - pad * 2);
        return (
          <g key={k}>
            <rect x={pad + i * bw + bw * 0.15} y={H - pad - h} width={bw * 0.7} height={h} rx={4}
              fill="var(--accent-orange)" fillOpacity={0.85}>
              <title>{k}: {v.toLocaleString()} visits</title>
            </rect>
            <text x={pad + i * bw + bw / 2} y={H - pad + 14} textAnchor="middle" fontSize="11" fill="var(--muted)">{k}</text>
            <text x={pad + i * bw + bw / 2} y={H - pad - h - 6} textAnchor="middle" fontSize="11" fill="var(--foreground)" fontWeight="500">{v.toLocaleString()}</text>
          </g>
        );
      })}
    </svg>
  );
}

function CohortHeatmap({ rows }: { rows: Array<{ segment: Segment; risk_level: Risk; count: number }> }) {
  const segs: Segment[] = ["Lost", "New", "Occasional", "Regular"];
  const risks: Risk[] = ["High", "Medium", "Low"];
  const lookup: Record<string, number> = {};
  let max = 1;
  rows.forEach((r) => { const k = `${r.segment}|${r.risk_level}`; lookup[k] = r.count; if (r.count > max) max = r.count; });
  return (
    <table className="w-full text-[12px] border-separate" style={{ borderSpacing: 4 }}>
      <thead>
        <tr>
          <th />
          {risks.map((r) => <th key={r} className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-2">{r}</th>)}
        </tr>
      </thead>
      <tbody>
        {segs.map((s) => (
          <tr key={s}>
            <td className="pr-2"><SegmentBadge value={s} /></td>
            {risks.map((r) => {
              const v = lookup[`${s}|${r}`] ?? 0;
              const intensity = v / max;
              const color = RISK_COLORS[r];
              return (
                <td key={r} className="text-center rounded-md" style={{
                  background: `color-mix(in oklab, ${color} ${Math.round(intensity * 70)}%, transparent)`,
                  padding: "14px 0",
                  border: "1px solid var(--border)",
                  fontWeight: 600,
                }}>
                  {v || "—"}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function DiscountSplit({ used, not }: { used: number; not: number }) {
  const total = used + not || 1;
  const pUsed = (used / total) * 100;
  return (
    <div>
      <div className="flex h-3 rounded overflow-hidden mb-3">
        <div style={{ width: `${pUsed}%`, background: "var(--accent-orange)" }} />
        <div style={{ width: `${100 - pUsed}%`, background: "var(--surface-2)" }} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="card-surface p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Used discount</div>
          <div className="text-[22px] font-semibold mt-1 text-orange">{used.toLocaleString()}</div>
          <div className="text-[11px] text-muted-foreground">{pUsed.toFixed(1)}% of base</div>
        </div>
        <div className="card-surface p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">No discount</div>
          <div className="text-[22px] font-semibold mt-1">{not.toLocaleString()}</div>
          <div className="text-[11px] text-muted-foreground">{(100 - pUsed).toFixed(1)}% of base</div>
        </div>
      </div>
    </div>
  );
}

/* ── Profiles section ─────────────────────────────────── */

const SPEND_COLORS: Record<SpendingTier, string> = {
  Economy: "var(--muted)",
  Standard: "var(--blue)",
  Premium: "var(--yellow)",
};
const TIME_EMOJI: Record<TimePreference, string> = { Morning: "☀️", "Mid-day": "🕛", Evening: "🌙" };
const FOOD_EMOJI: Record<FoodPreference, string> = { chicken: "🍗", beef: "🥩", fish: "🐟", veggie: "🥗", varied: "🍽️" };

function ProfilesSection() {
  // Try profiles endpoint first; fall back to aggregating /api/customers if it 5xx's
  const profiles = useQuery({
    queryKey: ["analysis-profiles"],
    queryFn: async () => {
      try {
        return await api.profiles();
      } catch {
        // Fallback: fetch all in one shot (backend allows page_size up to 2000)
        const res = await api.customers({ page: 1, page_size: 2000 });
        const all = res.customers;
        const acc = {
          spending_tier: {} as Record<string, number>,
          time_preference: {} as Record<string, number>,
          food_preference: {} as Record<string, number>,
          drink_vs_food: {} as Record<string, number>,
          flight_lovers: { yes: 0, no: 0 },
          total: all.length,
        };
        for (const c of all) {
          if (c.spending_tier) acc.spending_tier[c.spending_tier] = (acc.spending_tier[c.spending_tier] ?? 0) + 1;
          if (c.time_preference) acc.time_preference[c.time_preference] = (acc.time_preference[c.time_preference] ?? 0) + 1;
          if (c.food_preference) acc.food_preference[c.food_preference] = (acc.food_preference[c.food_preference] ?? 0) + 1;
          if (c.drink_vs_food) acc.drink_vs_food[c.drink_vs_food] = (acc.drink_vs_food[c.drink_vs_food] ?? 0) + 1;
          if (c.is_flight_lover) acc.flight_lovers.yes++; else acc.flight_lovers.no++;
        }
        return acc;
      }
    },
  });

  if (!profiles.data) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[0,1,2,3].map((i) => <Card key={i} title="Loading…"><Skeleton h={220} /></Card>)}
      </div>
    );
  }

  const p = profiles.data;
  const flightTotal = p.flight_lovers.yes + p.flight_lovers.no || 1;
  const flightPct = (p.flight_lovers.yes / flightTotal) * 100;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card title="Spending tier" subtitle="Customer mix by spending bracket">
        <DonutChart
          data={p.spending_tier}
          colorMap={(k) => SPEND_COLORS[k as SpendingTier] ?? "var(--muted)"}
        />
      </Card>

      <Card title="Time preference" subtitle="When customers prefer to visit">
        <EmojiBars data={p.time_preference} emojiMap={(k) => TIME_EMOJI[k as TimePreference] ?? "⏱️"} />
      </Card>

      <Card title="Food preference" subtitle="Cuisine affinity">
        <HorizontalBars data={p.food_preference} emojiMap={(k) => FOOD_EMOJI[k as FoodPreference] ?? "🍽️"} />
      </Card>

      <Card title="Flight lovers ✈️" subtitle="Customers who love drink flights">
        <div className="flex items-center gap-6">
          <div className="flex-1">
            <div className="text-[44px] font-semibold leading-none">{p.flight_lovers.yes.toLocaleString()}</div>
            <div className="text-[13px] text-orange mt-1">{flightPct.toFixed(1)}% of customers</div>
            <div className="text-[11px] text-muted-foreground mt-1">vs {p.flight_lovers.no.toLocaleString()} non-flight</div>
          </div>
          <MiniDonut yes={p.flight_lovers.yes} no={p.flight_lovers.no} />
        </div>
      </Card>
    </div>
  );
}

function DonutChart({ data, colorMap }: { data: Record<string, number>; colorMap: (k: string) => string }) {
  const entries = Object.entries(data).filter(([, v]) => v > 0);
  const total = entries.reduce((s, [, v]) => s + v, 0) || 1;
  const R = 70, C = 2 * Math.PI * R;
  let acc = 0;
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 200 200" className="w-[180px] h-[180px] flex-shrink-0">
        <g transform="translate(100,100) rotate(-90)">
          <circle r={R} fill="none" stroke="var(--surface-2)" strokeWidth={22} />
          {entries.map(([k, v]) => {
            const frac = v / total;
            const dash = frac * C;
            const off = -acc * C;
            acc += frac;
            return (
              <circle key={k} r={R} fill="none" stroke={colorMap(k)} strokeWidth={22}
                strokeDasharray={`${dash} ${C - dash}`} strokeDashoffset={off} />
            );
          })}
        </g>
        <text x="100" y="98" textAnchor="middle" fontSize="22" fontWeight="600" fill="var(--foreground)">{total.toLocaleString()}</text>
        <text x="100" y="116" textAnchor="middle" fontSize="10" fill="var(--muted)">total</text>
      </svg>
      <div className="space-y-1.5 flex-1">
        {entries.map(([k, v]) => (
          <div key={k} className="flex items-center gap-2 text-[12px]">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: colorMap(k) }} />
            <span className="flex-1">{k}</span>
            <span className="font-medium">{v.toLocaleString()}</span>
            <span className="text-muted-foreground w-10 text-right">{((v / total) * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmojiBars({ data, emojiMap }: { data: Record<string, number>; emojiMap: (k: string) => string }) {
  const entries = Object.entries(data);
  const max = Math.max(...entries.map(([, v]) => v), 1);
  return (
    <div className="space-y-3">
      {entries.map(([k, v]) => (
        <div key={k}>
          <div className="flex justify-between text-[12px] mb-1">
            <span>{emojiMap(k)} {k}</span>
            <span className="text-muted-foreground">{v.toLocaleString()}</span>
          </div>
          <div className="h-2.5 bg-white/[0.06] rounded">
            <div className="h-full rounded bg-orange transition-all" style={{ width: `${(v / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function HorizontalBars({ data, emojiMap }: { data: Record<string, number>; emojiMap: (k: string) => string }) {
  const entries = Object.entries(data).sort(([, a], [, b]) => b - a);
  const max = Math.max(...entries.map(([, v]) => v), 1);
  return (
    <div className="space-y-2">
      {entries.map(([k, v]) => (
        <div key={k} className="flex items-center gap-3 text-[12px]">
          <div className="w-[80px] capitalize flex items-center gap-1">{emojiMap(k)} {k}</div>
          <div className="flex-1 h-3.5 bg-white/[0.06] rounded relative">
            <div className="h-full rounded bg-gradient-to-r from-orange to-yellow transition-all" style={{ width: `${(v / max) * 100}%` }} />
          </div>
          <div className="w-12 text-right font-medium">{v.toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}

function MiniDonut({ yes, no }: { yes: number; no: number }) {
  const total = yes + no || 1;
  const R = 38, C = 2 * Math.PI * R;
  const dash = (yes / total) * C;
  return (
    <svg viewBox="0 0 100 100" className="w-[110px] h-[110px] flex-shrink-0">
      <g transform="translate(50,50) rotate(-90)">
        <circle r={R} fill="none" stroke="var(--surface-2)" strokeWidth={14} />
        <circle r={R} fill="none" stroke="var(--accent-orange)" strokeWidth={14}
          strokeDasharray={`${dash} ${C - dash}`} />
      </g>
      <text x="50" y="52" textAnchor="middle" fontSize="14" fontWeight="600" fill="var(--accent-orange)">✈️</text>
    </svg>
  );
}

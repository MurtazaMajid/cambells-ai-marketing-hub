import { useQuery } from "@tanstack/react-query";
import { api, type DashboardResponse, type Risk, type Segment } from "@/lib/api";
import { Topbar } from "@/components/layout/Topbar";
import { SegmentBadge, RiskBadge, ProbBar } from "@/components/ui-kit/Badges";
import { SegmentDonut } from "@/components/ui-kit/SegmentDonut";
import { ArrowDown, ArrowUp, Activity, MessageSquare, AlertTriangle, Sparkles } from "lucide-react";
import { usePageMeta } from "@/hooks/use-page-meta";

const SEG_COLORS: Record<Segment, string> = {
  Lost: "var(--red)", New: "var(--blue)", Occasional: "var(--yellow)", Regular: "var(--green)",
};

function KPI({ accent, label, value, delta, down }: { accent: "orange" | "red" | "green" | "blue"; label: string; value: string; delta: string; down?: boolean }) {
  const colorMap = { orange: "var(--accent-orange)", red: "var(--red)", green: "var(--green)", blue: "var(--blue)" };
  return (
    <div className="card-surface p-5 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: colorMap[accent] }} />
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">{label}</div>
      <div className="text-[28px] font-semibold leading-none mb-1.5">{value}</div>
      <div className={`text-[12px] flex items-center gap-1 ${down ? "text-red" : "text-green"}`}>
        {down ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />}
        {delta}
      </div>
    </div>
  );
}

function csvCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function exportAtRiskCsv(rows: DashboardResponse["top_at_risk"]) {
  const header = ["customer_id", "segment", "recency_days", "monetary", "churn_probability", "risk_level"];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push([
      csvCell(r.customer_id ?? r.id ?? ""),
      csvCell(r.segment),
      csvCell(Math.round(r.recency)),
      csvCell(r.monetary.toFixed(2)),
      csvCell(r.churn_probability.toFixed(4)),
      csvCell(r.risk_level),
    ].join(","));
  }
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const stamp = new Date().toISOString().slice(0, 10);
  const a = document.createElement("a");
  a.href = url;
  a.download = `at-risk-customers-${stamp}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function OverviewPage() {
  usePageMeta("Overview · Campbell's AI Marketing Hub", "KPI overview, customer segmentation and at-risk customers.");
  const { data, isLoading, error } = useQuery<DashboardResponse>({
    queryKey: ["dashboard"], queryFn: api.dashboard,
  });

  const canExport = !!data && data.top_at_risk.length > 0;

  return (
    <>
      <Topbar
        title="Overview Dashboard"
        subtitle="Marketing_data.csv · Nov 2023 – Feb 2024 · Live data from Supabase"
        actions={
          <>
            <button
              type="button"
              onClick={() => data && exportAtRiskCsv(data.top_at_risk)}
              disabled={!canExport}
              className="px-4 py-2 rounded-lg text-[13px] font-medium bg-white/[0.06] border border-border-strong hover:bg-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Export CSV
            </button>
            <a href="/generate" className="px-4 py-2 rounded-lg text-[13px] font-medium bg-orange text-primary-foreground hover:opacity-90 transition">Run Pipeline</a>
          </>
        }
      />
      <div className="flex-1 overflow-y-auto px-7 py-6">
        {error && <div className="card-surface p-4 text-red mb-4">Failed to load dashboard.</div>}
        {isLoading || !data ? <SkeletonKPIs /> : <Content data={data} />}
      </div>
    </>
  );
}

function SkeletonKPIs() {
  return (
    <div className="grid grid-cols-4 gap-3.5 mb-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="card-surface p-5 h-[110px] animate-pulse" />
      ))}
    </div>
  );
}

function Content({ data }: { data: DashboardResponse }) {
  const segs = (["Lost", "New", "Occasional", "Regular"] as Segment[]).map((s) => ({
    name: s, value: data.segment_counts[s] ?? 0, color: SEG_COLORS[s],
  }));
  const riskOrder: Risk[] = ["High", "Medium", "Low"];
  const riskColors: Record<Risk, string> = { High: "var(--red)", Medium: "var(--yellow)", Low: "var(--green)" };
  const maxRisk = Math.max(...riskOrder.map((r) => data.risk_counts[r] ?? 0), 1);
  const retained = Math.max(0, data.total_customers - (data.risk_counts.High ?? 0) - (data.risk_counts.Medium ?? 0));

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        <KPI accent="orange" label="Total Customers" value={data.total_customers.toLocaleString()} delta="Scored by ML pipeline" />
        <KPI accent="red" label="Churn Rate" value={`${Math.round(data.churn_rate_pct)}%`} delta={`${(data.risk_counts.High + data.risk_counts.Medium).toLocaleString()} customers at risk`} down />
        <KPI accent="green" label="Retained" value={retained.toLocaleString()} delta="Low-risk active base" />
        <KPI accent="blue" label="High Risk" value={(data.risk_counts.High ?? 0).toLocaleString()} delta="Need re-engagement now" down />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 mb-6">
        <div className="card-surface p-5">
          <div className="flex justify-between items-center mb-5">
            <div>
              <div className="text-[13px] font-medium">Customer segments</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">RFM clustering · KMeans k=4</div>
            </div>
          </div>
          <SegmentDonut segments={segs} total={data.total_customers} />
        </div>

        <div className="card-surface p-5">
          <div className="flex justify-between items-center mb-5">
            <div>
              <div className="text-[13px] font-medium">Risk level distribution</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">XGBoost two-tier · AUC 0.84</div>
            </div>
          </div>
          <div className="mt-2">
            {riskOrder.map((r) => {
              const v = data.risk_counts[r] ?? 0;
              return (
                <div key={r} className="flex items-center gap-3 mb-3.5">
                  <div className="text-[12px] text-muted-foreground w-[50px]">{r}</div>
                  <div className="flex-1 h-2 bg-white/[0.07] rounded">
                    <div className="h-full rounded transition-[width] duration-700" style={{ width: `${(v / maxRisk) * 100}%`, background: riskColors[r] }} />
                  </div>
                  <div className="text-[12px] font-medium w-10 text-right">{v.toLocaleString()}</div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 border-t border-border pt-4">
            <div className="text-[13px] font-medium mb-3">RFM by segment</div>
            <table className="w-full text-[12px]">
              <thead>
                <tr>
                  <th className="text-left py-1.5 px-2 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Segment</th>
                  <th className="text-left py-1.5 px-2 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Recency</th>
                  <th className="text-left py-1.5 px-2 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Frequency</th>
                  <th className="text-left py-1.5 px-2 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Monetary</th>
                </tr>
              </thead>
              <tbody>
                {(Object.keys(data.rfm_by_segment) as Segment[]).map((s) => {
                  const r = data.rfm_by_segment[s];
                  return (
                    <tr key={s}>
                      <td className="py-1.5 px-2"><SegmentBadge value={s} /></td>
                      <td className="py-1.5 px-2">{Math.round(r.recency)}d</td>
                      <td className="py-1.5 px-2">{Math.round(r.frequency)}</td>
                      <td className="py-1.5 px-2">${r.monetary.toFixed(0)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card-surface overflow-hidden mb-6">
        <div className="px-5 py-4 flex justify-between items-center border-b border-border">
          <div className="text-[13px] font-medium">Top at-risk customers</div>
          <div className="text-[12px] text-muted-foreground">Sorted by churn probability</div>
        </div>
        <table className="w-full">
          <thead>
            <tr>
              {["Customer", "Segment", "Recency", "Monetary", "Churn probability", "Risk"].map((h) => (
                <th key={h} className="text-left text-[11px] uppercase tracking-wider text-muted-foreground font-medium px-4 py-2.5 bg-white/[0.025] border-b border-border">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.top_at_risk.slice(0, 15).map((r, i) => (
              <tr key={i} className="hover:bg-white/[0.025]">
                <td className="px-4 py-3 border-b border-border last:border-b-0 font-mono text-[12px] text-muted-foreground">#{r.customer_id ?? r.id ?? i + 1}</td>
                <td className="px-4 py-3 border-b border-border last:border-b-0"><SegmentBadge value={r.segment} /></td>
                <td className="px-4 py-3 border-b border-border last:border-b-0 text-[13px]">{Math.round(r.recency)} days</td>
                <td className="px-4 py-3 border-b border-border last:border-b-0 text-[13px]">${r.monetary.toFixed(2)}</td>
                <td className="px-4 py-3 border-b border-border last:border-b-0"><ProbBar p={r.churn_probability} /></td>
                <td className="px-4 py-3 border-b border-border last:border-b-0"><RiskBadge value={r.risk_level} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ActivityFeed data={data} />
    </>
  );
}

function ActivityFeed({ data }: { data: DashboardResponse }) {
  const items = [
    { icon: AlertTriangle, color: "var(--red)", title: `${data.risk_counts.High?.toLocaleString() ?? 0} customers flagged High risk`, sub: "XGBoost re-scored full base · needs urgent re-engagement", time: "just now" },
    { icon: Sparkles, color: "var(--accent-orange)", title: "Pipeline ran successfully", sub: `Segmented ${data.total_customers.toLocaleString()} customers via KMeans k=4`, time: "2m ago" },
    { icon: MessageSquare, color: "var(--blue)", title: `${data.messages_sent ?? 0} re-engagement messages generated`, sub: "Groq LLaMA 3.3-70b · SMS, email, app push", time: "12m ago" },
    { icon: Activity, color: "var(--green)", title: `Churn rate at ${Math.round(data.churn_rate_pct)}%`, sub: `Data source · ${data.data_source}`, time: "1h ago" },
  ];
  return (
    <div className="card-surface p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[13px] font-medium">Recent activity</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Pipeline runs, scoring, and message generation</div>
        </div>
      </div>
      <div className="space-y-1">
        {items.map((it, i) => {
          const Icon = it.icon;
          return (
            <div key={i} className="flex items-start gap-3 px-2 py-2.5 rounded-lg hover:bg-white/[0.03]">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `color-mix(in oklab, ${it.color} 18%, transparent)`, color: it.color }}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] font-medium">{it.title}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{it.sub}</div>
              </div>
              <div className="text-[11px] text-muted-foreground flex-shrink-0">{it.time}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

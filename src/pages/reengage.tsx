import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Topbar } from "@/components/layout/Topbar";
import { api, sendReengagementBatch, type ReengagementResponse } from "@/lib/api";
import { RiskBadge, SegmentBadge } from "@/components/ui-kit/Badges";
import { Send, AlertTriangle, Mail, CheckCircle2, XCircle, Sparkles } from "lucide-react";
import { usePageMeta } from "@/hooks/use-page-meta";

export default function ReengagePage() {
  usePageMeta("Re-engage · Campbell's AI Marketing Hub", "Automated re-engagement messages for high-risk customers.");
  const [limit, setLimit] = useState(10);
  const [lastResult, setLastResult] = useState<ReengagementResponse | null>(null);

  const highRiskQ = useQuery({
    queryKey: ["customers", "High", 1, 50],
    queryFn: () => api.customers({ risk_level: "High", page: 1, page_size: 50 }),
  });

  const mutation = useMutation({
    mutationFn: (n: number) => sendReengagementBatch(n),
    onSuccess: (data) => setLastResult(data),
  });

  const highRiskList = highRiskQ.data?.customers ?? [];
  const totalHigh = highRiskQ.data?.total ?? 0;

  return (
    <>
      <Topbar
        title="Automated Re-engagement"
        subtitle="Send AI-personalized win-back emails to your highest-risk customers"
      />
      <div className="p-7 space-y-6 overflow-y-auto">
        {/* Hero */}
        <div className="card-surface p-6 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-orange" />
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-lg bg-orange/15 text-orange flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[16px] font-medium mb-1">Automated win-back campaign</div>
              <div className="text-[12.5px] text-muted-foreground leading-relaxed max-w-2xl">
                Pulls the top N high-risk customers from Supabase, generates a personalized SMS + email + app
                notification per customer using the full Section&nbsp;5 enriched profile, and sends the email through
                Resend. Each customer gets a 20% discount offer.
              </div>
            </div>
            <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
              <AlertTriangle className="w-3.5 h-3.5 text-yellow" />
              {totalHigh.toLocaleString()} high-risk in DB
            </div>
          </div>

          <div className="mt-6 flex items-end gap-4 flex-wrap">
            <div>
              <label className="block text-[11px] uppercase tracking-widest text-muted-foreground mb-1.5">
                Batch size
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={limit}
                onChange={(e) => setLimit(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
                className="bg-surface-2 border border-border-strong rounded-md px-3 py-2 text-[13px] w-28 outline-none focus:border-orange"
              />
            </div>
            <button
              type="button"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate(limit)}
              className="inline-flex items-center gap-2 bg-orange text-primary-foreground px-4 py-2 rounded-md text-[13px] font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              {mutation.isPending ? "Sending…" : `Send to top ${limit}`}
            </button>
            {mutation.isError && (
              <div className="text-[12px] text-red flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5" />
                {(mutation.error as Error)?.message ?? "Failed to send"}
              </div>
            )}
          </div>
        </div>

        {/* Last run summary */}
        {lastResult && (
          <div className="card-surface p-5">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-3">Last batch result</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
              <Stat label="Processed" value={lastResult.total_processed} />
              <Stat label="Emails sent" value={lastResult.emails_sent} accent="green" />
              <Stat label="Failed" value={lastResult.total_processed - lastResult.emails_sent} accent="red" />
              <Stat
                label="Success rate"
                value={
                  lastResult.total_processed
                    ? `${Math.round((lastResult.emails_sent / lastResult.total_processed) * 100)}%`
                    : "—"
                }
              />
            </div>
            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="text-left text-muted-foreground text-[11px] uppercase tracking-widest border-b border-border">
                    <th className="py-2 pr-3 font-medium">Customer</th>
                    <th className="py-2 pr-3 font-medium">Segment</th>
                    <th className="py-2 pr-3 font-medium">Email</th>
                    <th className="py-2 pr-3 font-medium">Subject</th>
                    <th className="py-2 pr-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lastResult.results.map((r) => (
                    <tr key={r.customer_id} className="border-b border-border/60 last:border-b-0">
                      <td className="py-2.5 pr-3 font-mono text-[12px]">{r.customer_id}</td>
                      <td className="py-2.5 pr-3"><SegmentBadge value={r.segment as any} /></td>
                      <td className="py-2.5 pr-3 text-muted-foreground">{r.email}</td>
                      <td className="py-2.5 pr-3 truncate max-w-[280px]">{r.email_subject}</td>
                      <td className="py-2.5 pr-3">
                        {r.email_sent ? (
                          <span className="inline-flex items-center gap-1 text-green text-[11.5px]">
                            <CheckCircle2 className="w-3.5 h-3.5" /> sent
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red text-[11.5px]">
                            <XCircle className="w-3.5 h-3.5" /> failed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Preview of who will receive */}
        <div className="card-surface p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[14.5px] font-medium">High-risk queue preview</div>
              <div className="text-[12px] text-muted-foreground">
                These customers are sorted by churn probability. The batch will pick the top {limit}.
              </div>
            </div>
            <Mail className="w-4 h-4 text-muted-foreground" />
          </div>
          {highRiskQ.isLoading ? (
            <div className="text-[12px] text-muted-foreground py-6">Loading…</div>
          ) : (
            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="text-left text-muted-foreground text-[11px] uppercase tracking-widest border-b border-border">
                    <th className="py-2 pr-3 font-medium">Customer</th>
                    <th className="py-2 pr-3 font-medium">Segment</th>
                    <th className="py-2 pr-3 font-medium">Risk</th>
                    <th className="py-2 pr-3 font-medium text-right">Churn %</th>
                    <th className="py-2 pr-3 font-medium text-right">Recency</th>
                    <th className="py-2 pr-3 font-medium text-right">Spend</th>
                  </tr>
                </thead>
                <tbody>
                  {highRiskList
                    .slice()
                    .sort((a, b) => (b.churn_probability ?? 0) - (a.churn_probability ?? 0))
                    .slice(0, Math.max(limit, 10))
                    .map((c) => (
                      <tr key={c.id} className="border-b border-border/60 last:border-b-0">
                        <td className="py-2.5 pr-3 font-mono text-[12px]">{c.id}</td>
                        <td className="py-2.5 pr-3"><SegmentBadge value={c.segment} /></td>
                        <td className="py-2.5 pr-3"><RiskBadge value={c.risk_level} /></td>
                        <td className="py-2.5 pr-3 text-right">
                          {Math.round((c.churn_probability ?? 0) * 100)}%
                        </td>
                        <td className="py-2.5 pr-3 text-right text-muted-foreground">
                          {Math.round(c.recency)}d
                        </td>
                        <td className="py-2.5 pr-3 text-right">${c.monetary.toFixed(0)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: "green" | "red";
}) {
  const color = accent === "green" ? "text-green" : accent === "red" ? "text-red" : "";
  return (
    <div>
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">{label}</div>
      <div className={`text-[22px] font-semibold leading-none ${color}`}>{value}</div>
    </div>
  );
}

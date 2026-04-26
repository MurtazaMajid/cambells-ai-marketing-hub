import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { Topbar } from "@/components/layout/Topbar";
import { usePageMeta } from "@/hooks/use-page-meta";

const STATIC_ASPECTS = [
  { name: "Food", count: 1751, pos: 0.48, neu: 0.35, neg: 0.17 },
  { name: "Staff", count: 1082, pos: 0.38, neu: 0.28, neg: 0.34 },
  { name: "Service", count: 515, pos: 0.30, neu: 0.22, neg: 0.48 },
  { name: "Place", count: 515, pos: 0.55, neu: 0.30, neg: 0.15 },
  { name: "Price", count: 259, pos: 0.22, neu: 0.28, neg: 0.50 },
  { name: "Ambience", count: 262, pos: 0.60, neu: 0.25, neg: 0.15 },
];

export default function SentimentPage() {
  usePageMeta("Sentiment · Campbell's AI Marketing Hub", "Aspect-based sentiment analysis (ABSA) on customer reviews.");
  const [review, setReview] = useState("The food was great but the service was incredibly slow.");
  const mut = useMutation({ mutationFn: () => api.sentiment(review) });

  return (
    <>
      <Topbar title="Sentiment Analysis" subtitle="Aspect-based pipeline (ABSA) · sklearn TF-IDF" />
      <div className="flex-1 overflow-y-auto px-7 py-6">
        <div className="mb-5">
          <div className="text-[14px] font-medium mb-1">Aspect-based sentiment analysis</div>
          <div className="text-[12px] text-muted-foreground">536 test reviews · 0.75 F1 aspect · 0.64 F1 sentiment</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-6">
          {STATIC_ASPECTS.map((a) => (
            <div key={a.name} className="card-surface p-4">
              <div className="flex justify-between items-center mb-1.5">
                <div className="text-[12px] font-medium">{a.name}</div>
                <div className="text-[11px] text-muted-foreground">{a.count.toLocaleString()} mentions</div>
              </div>
              <div className="flex gap-[3px] h-1.5 rounded overflow-hidden mt-1 mb-1.5">
                <div className="bg-green" style={{ flex: a.pos }} />
                <div className="bg-white/20" style={{ flex: a.neu }} />
                <div className="bg-red" style={{ flex: a.neg }} />
              </div>
              <div className="flex gap-3">
                <span className="text-[10px] text-muted-foreground flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green" />Pos {Math.round(a.pos * 100)}%</span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-white/20" />Neu {Math.round(a.neu * 100)}%</span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red" />Neg {Math.round(a.neg * 100)}%</span>
              </div>
            </div>
          ))}
        </div>

        <div className="card-surface p-5">
          <div className="text-[13px] font-medium mb-3">Try the live ABSA endpoint</div>
          <div className="flex gap-3">
            <input
              value={review}
              onChange={(e) => setReview(e.target.value)}
              className="flex-1 bg-surface-2 border border-border-strong rounded-lg px-3 py-2 text-[13px] outline-none focus:border-orange"
              placeholder="Paste a review…"
            />
            <button onClick={() => mut.mutate()} disabled={mut.isPending} className="px-4 py-2 rounded-lg text-[13px] font-medium bg-orange text-primary-foreground hover:opacity-90 disabled:opacity-50">
              {mut.isPending ? "Analyzing…" : "Analyze ↗"}
            </button>
          </div>
          {mut.error && <div className="text-red text-[12px] mt-3">Failed: {(mut.error as Error).message}</div>}
          {mut.data && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-surface-2 rounded-lg p-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Aspects</div>
                <div className="flex flex-wrap gap-1.5">
                  {mut.data.aspects.map((a, i) => <span key={i} className="badge-soft bg-blue/15 text-[oklch(0.75_0.11_247)]">{a}</span>)}
                </div>
              </div>
              <div className="bg-surface-2 rounded-lg p-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Sentiments</div>
                <div className="flex flex-wrap gap-1.5">
                  {mut.data.sentiments.map((s, i) => (
                    <span key={i} className={`badge-soft ${s === "pos" ? "bg-green/15 text-[oklch(0.78_0.13_165)]" : s === "neg" ? "bg-red/15 text-[oklch(0.72_0.16_25)]" : "bg-yellow/15 text-[oklch(0.85_0.12_85)]"}`}>{s}</span>
                  ))}
                </div>
              </div>
              <div className="bg-surface-2 rounded-lg p-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Triplets</div>
                <div className="space-y-1">
                  {mut.data.triplets.map((t, i) => (
                    <div key={i} className="text-[11px] text-muted-foreground"><span className="text-foreground">{t.aspect}</span> · "{t.opinion}" · <em>{t.sentiment}</em></div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

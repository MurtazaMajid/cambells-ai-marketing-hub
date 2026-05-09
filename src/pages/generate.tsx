import { useSearchParams } from "@/lib/router-shim";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { api, parseFavoriteItems, type Customer, type PipelineResponse } from "@/lib/api";
import { Topbar } from "@/components/layout/Topbar";
import { RiskBadge, SegmentBadge } from "@/components/ui-kit/Badges";
import { SpendingTierBadge, TimePreferenceBadge, FoodPreferenceBadge, FlightLoverBadge } from "@/components/ui-kit/ProfileBadges";
import { Check } from "lucide-react";
import { usePageMeta } from "@/hooks/use-page-meta";

const PIPELINE_STEPS = [
  { n: 1, title: "Segment", sub: "KMeans RFM", color: "var(--accent-orange)", bg: "rgba(232,103,58,0.1)", border: "rgba(232,103,58,0.3)" },
  { n: 2, title: "Churn score", sub: "XGBoost", color: "oklch(0.75 0.11 247)", bg: "color-mix(in oklab, var(--blue) 12%, transparent)", border: "color-mix(in oklab, var(--blue) 30%, transparent)" },
  { n: 3, title: "ABSA", sub: "TF-IDF + LR", color: "oklch(0.78 0.13 165)", bg: "color-mix(in oklab, var(--green) 12%, transparent)", border: "color-mix(in oklab, var(--green) 30%, transparent)" },
  { n: 4, title: "Message", sub: "Groq LLaMA", color: "oklch(0.85 0.12 85)", bg: "color-mix(in oklab, var(--yellow) 12%, transparent)", border: "color-mix(in oklab, var(--yellow) 30%, transparent)" },
  { n: 5, title: "Log", sub: "Supabase", color: "var(--foreground)", bg: "rgba(255,255,255,0.05)", border: "var(--border-strong)" },
];

export default function GeneratePage() {
  usePageMeta("Generate · Campbell's AI Marketing Hub", "Run the full AI pipeline: segment, churn score, ABSA and generate a personalized message.");
  const [searchParams] = useSearchParams();
  const presetId = searchParams.get("customer_id") ?? undefined;
  const [form, setForm] = useState({
    customer_id: presetId ?? "342.0",
    recency: 59,
    frequency: 3,
    monetary: 227.15,
    unique_items: 4,
    avg_order_val: 75.7,
    avg_tip: 8.5,
    discount_used: 0,
    visits_nov: 1,
    visits_dec: 0,
    visits_jan: 0,
    days_since_first: 90,
    favorite_items: ["Burrito", "Tequila Flight"] as string[],
    review: "",
    spending_tier: undefined as string | undefined,
    time_preference: undefined as string | undefined,
    food_preference: undefined as string | undefined,
    drink_vs_food: undefined as string | undefined,
    favorite_modifier: undefined as string | undefined,
    is_flight_lover: undefined as boolean | undefined,
  });
  const [loadedProfile, setLoadedProfile] = useState<Customer | null>(null);
  const [loadStatus, setLoadStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");

  const lookupId = useState("")[0]; // unused, just keeping types stable
  void lookupId;

  // Auto-fetch helper
  const fetchProfile = async (id: string) => {
    if (!id.trim()) return;
    setLoadStatus("loading");
    try {
      const c = await api.customerProfile(id.trim());
      const items = parseFavoriteItems(c.favorite_items);
      setForm((f) => ({
        ...f,
        customer_id: c.id,
        recency: c.recency,
        frequency: c.frequency,
        monetary: c.monetary,
        unique_items: c.unique_items ?? f.unique_items,
        avg_order_val: c.avg_order_val ?? f.avg_order_val,
        avg_tip: c.avg_tip ?? f.avg_tip,
        discount_used: c.discount_used ?? f.discount_used,
        visits_nov: c.visits_nov ?? f.visits_nov,
        visits_dec: c.visits_dec ?? f.visits_dec,
        visits_jan: c.visits_jan ?? f.visits_jan,
        days_since_first: c.days_since_first ?? f.days_since_first,
        favorite_items: items.length ? items : f.favorite_items,
        spending_tier: c.spending_tier ?? undefined,
        time_preference: c.time_preference ?? undefined,
        food_preference: c.food_preference ?? undefined,
        drink_vs_food: c.drink_vs_food ?? undefined,
        favorite_modifier: c.favorite_modifier ?? undefined,
        is_flight_lover: c.is_flight_lover ?? undefined,
      }));
      setLoadedProfile(c);
      setLoadStatus("ok");
    } catch {
      setLoadStatus("err");
      setLoadedProfile(null);
    }
  };

  // Auto-fill on mount when ?customer_id=… is in URL
  useEffect(() => {
    if (presetId) fetchProfile(presetId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetId]);

  const mut = useMutation({ mutationFn: () => api.fullPipeline(form) });

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <>
      <Topbar title="Generate Message" subtitle="POST /api/full-pipeline · End-to-end personalization" />
      <div className="flex-1 overflow-y-auto px-7 py-6">
        {/* Profile preview card */}
        {loadedProfile && <ProfilePreview c={loadedProfile} />}

        <div className="card-surface p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="text-[14px] font-medium">Generate personalized message via API</div>
            {loadStatus === "ok" && (
              <span className="inline-flex items-center gap-1 text-[11px] text-green bg-green/10 border border-green/30 px-2 py-1 rounded">
                <Check className="w-3 h-3" /> Profile loaded
              </span>
            )}
            {loadStatus === "loading" && <span className="text-[11px] text-muted-foreground">Loading profile…</span>}
            {loadStatus === "err" && <span className="text-[11px] text-red">Customer not found</span>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
            <Field
              label="Customer ID (Tab to autofill)"
              value={form.customer_id}
              onChange={(v) => update("customer_id", v)}
              onBlur={() => fetchProfile(form.customer_id)}
            />
            <Field label="Recency (days)" type="number" value={form.recency} onChange={(v) => update("recency", Number(v))} />
            <Field label="Frequency" type="number" value={form.frequency} onChange={(v) => update("frequency", Number(v))} />
            <Field label="Monetary ($)" type="number" value={form.monetary} onChange={(v) => update("monetary", Number(v))} />
            <Field label="Unique items" type="number" value={form.unique_items} onChange={(v) => update("unique_items", Number(v))} />
            <Field label="Avg order val" type="number" value={form.avg_order_val} onChange={(v) => update("avg_order_val", Number(v))} />
            <Field label="Avg tip" type="number" value={form.avg_tip} onChange={(v) => update("avg_tip", Number(v))} />
            <Field label="Discount used (0/1)" type="number" value={form.discount_used} onChange={(v) => update("discount_used", Number(v))} />
          </div>
          <div className="mb-4">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">Review (optional — triggers ABSA)</div>
            <textarea
              value={form.review}
              onChange={(e) => update("review", e.target.value)}
              rows={2}
              placeholder="Leave blank or paste a customer review to enrich messaging…"
              className="w-full bg-surface-2 border border-border-strong rounded-lg px-3 py-2 text-[13px] outline-none focus:border-orange"
            />
          </div>
          <button
            onClick={() => mut.mutate()}
            disabled={mut.isPending}
            className="px-5 py-2.5 rounded-lg text-[13px] font-medium bg-orange text-primary-foreground hover:opacity-90 transition disabled:opacity-50"
          >
            {mut.isPending ? "Running pipeline…" : "Generate ↗"}
          </button>
          {mut.error && <div className="text-red text-[12px] mt-3">Failed: {(mut.error as Error).message}</div>}
        </div>

        <div className="card-surface p-5 mb-4">
          <div className="text-[13px] text-muted-foreground mb-3">How the pipeline works</div>
          <div className="flex items-center gap-0 flex-wrap">
            {PIPELINE_STEPS.map((s, i) => (
              <div key={s.n} className="flex items-center">
                <div className="rounded-lg px-3.5 py-2.5 text-[12px] text-center border" style={{ background: s.bg, borderColor: s.border }}>
                  <div className="font-medium" style={{ color: s.color }}>{s.n}. {s.title}</div>
                  <div className="text-muted-foreground mt-0.5">{s.sub}</div>
                </div>
                {i < PIPELINE_STEPS.length - 1 && <div className="text-muted-foreground px-2">→</div>}
              </div>
            ))}
          </div>
        </div>

        {mut.data && <PipelineResult result={mut.data} />}
      </div>
    </>
  );
}

function ProfilePreview({ c }: { c: Customer }) {
  const items = parseFavoriteItems(c.favorite_items);
  return (
    <div className="card-surface p-5 mb-4 border-orange/40 bg-gradient-to-br from-orange/[0.05] to-transparent">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Loaded customer profile</div>
          <div className="font-mono text-[15px] mt-1">#{c.id}</div>
        </div>
        <div className="flex gap-1.5 flex-wrap justify-end">
          <SegmentBadge value={c.segment} />
          <RiskBadge value={c.risk_level} />
          {c.spending_tier && <SpendingTierBadge value={c.spending_tier} />}
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-3">
        {c.time_preference && <TimePreferenceBadge value={c.time_preference} />}
        {c.food_preference && <FoodPreferenceBadge value={c.food_preference} />}
        {c.is_flight_lover && <FlightLoverBadge />}
        {c.favorite_modifier && (
          <span className="text-[11px] bg-white/[0.06] border border-border-strong rounded px-2 py-0.5">
            mod: {c.favorite_modifier}
          </span>
        )}
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {items.map((it, i) => (
            <span key={i} className="text-[11px] bg-orange/10 border border-orange/30 text-orange rounded-full px-2.5 py-0.5">{it}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = "text", onBlur }: { label: string; value: string | number; onChange: (v: string) => void; type?: string; onBlur?: () => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className="bg-surface-2 border border-border-strong rounded-lg px-3 py-2 text-[13px] outline-none focus:border-orange"
      />
    </div>
  );
}

function PipelineResult({ result }: { result: PipelineResponse }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
      <div className="card-surface p-5">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3">Prediction</div>
        <div className="space-y-2.5">
          <Row label="Segment"><SegmentBadge value={result.segment} /></Row>
          <Row label="Risk"><RiskBadge value={result.risk_level} /></Row>
          <Row label="Churn prob"><span className="text-orange font-medium">{Math.round(result.churn_probability * 100)}%</span></Row>
          <Row label="Tier"><span className="text-[12px] text-muted-foreground">{result.tier}</span></Row>
          <Row label="Discount"><span className="text-orange font-semibold">{result.discount_offered}</span></Row>
        </div>
      </div>

      <div className="card-surface p-5 lg:col-span-2">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3">Generated messages</div>
        <div className="space-y-3">
          <div>
            <div className="text-[11px] text-muted-foreground mb-1">SMS</div>
            <div className="text-[13px] bg-surface-2 border border-border rounded-lg p-3">{result.messages.sms}</div>
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground mb-1">Email — {result.messages.email.subject}</div>
            <div className="text-[13px] bg-surface-2 border border-border rounded-lg p-3 whitespace-pre-wrap">{result.messages.email.body}</div>
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground mb-1">App notification</div>
            <div className="text-[13px] bg-surface-2 border border-border rounded-lg p-3">{result.messages.app_notification}</div>
          </div>
        </div>
      </div>

      {result.absa && (
        <div className="card-surface p-5 lg:col-span-3">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3">ABSA — Aspect-based sentiment</div>
          <div className="flex flex-wrap gap-2">
            {result.absa.triplets.map((t, i) => (
              <div key={i} className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-[12px]">
                <span className="font-medium capitalize">{t.aspect}</span>
                <span className="text-muted-foreground"> — "{t.opinion}" · </span>
                <span className={t.sentiment === "pos" ? "text-green" : t.sentiment === "neg" ? "text-red" : "text-yellow"}>{t.sentiment}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center text-[13px]">
      <div className="text-muted-foreground">{label}</div>
      <div>{children}</div>
    </div>
  );
}

// suppress unused warning
void useQuery;

import { useNavigate } from "@/lib/router-shim";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { api, parseFavoriteItems, type Customer, type Risk, type Segment } from "@/lib/api";
import { Topbar } from "@/components/layout/Topbar";
import { SegmentBadge, RiskBadge, ProbBar } from "@/components/ui-kit/Badges";
import { SpendingTierBadge, TimePreferenceBadge, FoodPreferenceBadge, DrinkVsFoodBadge, FlightLoverBadge } from "@/components/ui-kit/ProfileBadges";
import { Search, X, Sparkles, MessageCircle } from "lucide-react";
import { usePageMeta } from "@/hooks/use-page-meta";

const SEG_OPTIONS: ("all" | Segment)[] = ["all", "Lost", "New", "Occasional", "Regular"];
const RISK_OPTIONS: ("all" | Risk)[] = ["all", "High", "Medium", "Low"];

export default function CustomersPage() {
  usePageMeta("Customers · Campbell's AI Marketing Hub", "Browse, filter and segment all scored customers.");
  const [segment, setSegment] = useState<"all" | Segment>("all");
  const [risk, setRisk] = useState<"all" | Risk>("all");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["customers", segment, risk, page],
    queryFn: () => api.customers({
      segment: segment === "all" ? undefined : segment,
      risk_level: risk === "all" ? undefined : risk,
      page,
      page_size: 20,
    }),
  });

  const filtered = useMemo(() => {
    if (!data?.customers) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data.customers;
    return data.customers.filter((c) => c.id.toLowerCase().includes(q));
  }, [data, search]);

  return (
    <>
      <Topbar title="Customer Explorer" subtitle="Live scored customers · Search, filter, drill in" />
      <div className="flex-1 overflow-y-auto px-7 py-6">
        {/* Search + filters */}
        <div className="flex flex-col gap-3 mb-4">
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer ID…"
              className="w-full bg-surface-2 border border-border-strong rounded-lg pl-9 pr-3 py-2 text-[13px] outline-none focus:border-orange"
            />
          </div>
          <div className="flex gap-4 flex-wrap">
            <FilterGroup label="Segment" options={SEG_OPTIONS} value={segment} onChange={(v) => { setSegment(v); setPage(1); }} />
            <FilterGroup label="Risk" options={RISK_OPTIONS} value={risk} onChange={(v) => { setRisk(v); setPage(1); }} />
          </div>
        </div>

        <div className="card-surface overflow-hidden">
          <div className="px-5 py-4 flex justify-between items-center border-b border-border">
            <div className="text-[13px] font-medium">All customers</div>
            <div className="text-[12px] text-muted-foreground">
              {data ? `Showing ${filtered.length} of ${data.total.toLocaleString()} · Page ${data.page}/${data.total_pages}` : "Loading…"}
            </div>
          </div>
          <table className="w-full">
            <thead>
              <tr>
                {["Customer", "Segment", "Recency", "Frequency", "Monetary", "Churn Prob", "Risk"].map((h) => (
                  <th key={h} className="text-left text-[11px] uppercase tracking-wider text-muted-foreground font-medium px-4 py-2.5 bg-white/[0.025] border-b border-border">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">Loading…</td></tr>
              )}
              {filtered.map((c) => (
                <tr key={c.id} onClick={() => setSelected(c)} className="hover:bg-white/[0.04] cursor-pointer">
                  <td className="px-4 py-3 border-b border-border last:border-b-0 font-mono text-[12px] text-muted-foreground">#{c.id}</td>
                  <td className="px-4 py-3 border-b border-border last:border-b-0"><SegmentBadge value={c.segment} /></td>
                  <td className="px-4 py-3 border-b border-border last:border-b-0 text-[13px]">{Math.round(c.recency)}d</td>
                  <td className="px-4 py-3 border-b border-border last:border-b-0 text-[13px]">{c.frequency}</td>
                  <td className="px-4 py-3 border-b border-border last:border-b-0 text-[13px]">${c.monetary.toFixed(2)}</td>
                  <td className="px-4 py-3 border-b border-border last:border-b-0"><ProbBar p={c.churn_probability} /></td>
                  <td className="px-4 py-3 border-b border-border last:border-b-0"><RiskBadge value={c.risk_level} /></td>
                </tr>
              ))}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-muted-foreground text-[12px]">No matches.</td></tr>
              )}
            </tbody>
          </table>
          {data && data.total_pages > 1 && (
            <div className="px-5 py-3 flex justify-between items-center border-t border-border">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-md text-[12px] bg-white/[0.06] border border-border-strong hover:bg-white/10 disabled:opacity-40"
              >Prev</button>
              <span className="text-[12px] text-muted-foreground">Page {data.page} of {data.total_pages}</span>
              <button
                disabled={page >= data.total_pages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-md text-[12px] bg-white/[0.06] border border-border-strong hover:bg-white/10 disabled:opacity-40"
              >Next</button>
            </div>
          )}
        </div>
      </div>

      {/* Profile drawer */}
      {selected && <ProfileDrawer customer={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

function FilterGroup<T extends string>({ label, options, value, onChange }: { label: string; options: T[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      {options.map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className={`px-3 py-1.5 rounded-full text-[12px] font-medium border transition ${
            value === s
              ? "bg-orange text-primary-foreground border-orange"
              : "border-border-strong text-muted-foreground hover:text-foreground hover:border-orange"
          }`}
        >
          {s === "all" ? "All" : s}
        </button>
      ))}
    </div>
  );
}

function ProfileDrawer({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const navigate = useNavigate();
  const churnPct = Math.round(customer.churn_probability * 100);
  const discount = customer.discount_offered ?? (customer.risk_level === "High" ? "20%" : customer.risk_level === "Medium" ? "15%" : "10%");
  const favItems = parseFavoriteItems(customer.favorite_items);

  // Hydrate full profile from /api/customer-profile/{id} to ensure all fields present
  const { data: full } = useQuery({
    queryKey: ["customer-profile", customer.id],
    queryFn: () => api.customerProfile(customer.id),
  });
  const c = { ...customer, ...(full ?? {}) };
  const items = parseFavoriteItems(c.favorite_items) || favItems;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <aside className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-surface border-l border-border z-50 overflow-y-auto">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between sticky top-0 bg-surface z-10">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Customer profile</div>
            <div className="font-mono text-[15px] mt-0.5">#{c.id}</div>
            <div className="flex gap-2 mt-2">
              <SegmentBadge value={c.segment} />
              <RiskBadge value={c.risk_level} />
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-white/[0.06]"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* RFM stats */}
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Recency" value={`${Math.round(c.recency)}d`} />
            <Stat label="Frequency" value={String(c.frequency)} />
            <Stat label="Monetary" value={`$${c.monetary.toFixed(0)}`} />
          </div>

          {/* Churn probability */}
          <div className="card-surface p-4 bg-surface-2">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Churn probability</div>
            <div className="flex items-end justify-between">
              <div className="text-[32px] font-semibold leading-none">{churnPct}%</div>
              <div className="text-[12px] text-muted-foreground">{c.tier ?? "—"}</div>
            </div>
            <div className="h-1.5 bg-white/[0.07] rounded mt-3">
              <div className="h-full rounded transition-all" style={{ width: `${churnPct}%`, background: c.churn_probability > 0.7 ? "var(--red)" : c.churn_probability > 0.4 ? "var(--yellow)" : "var(--green)" }} />
            </div>
          </div>

          {/* Profile badges */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Profile</div>
            <div className="flex flex-wrap gap-1.5">
              {c.spending_tier && <SpendingTierBadge value={c.spending_tier} />}
              {c.time_preference && <TimePreferenceBadge value={c.time_preference} />}
              {c.food_preference && <FoodPreferenceBadge value={c.food_preference} />}
              {c.drink_vs_food && <DrinkVsFoodBadge value={c.drink_vs_food} />}
              {c.is_flight_lover && <FlightLoverBadge />}
              {!c.spending_tier && !c.time_preference && !c.food_preference && (
                <span className="text-[11px] text-muted-foreground">No profile data</span>
              )}
            </div>
            {c.favorite_modifier && (
              <div className="mt-3">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Favorite modifier</div>
                <span className="inline-block text-[12px] bg-white/[0.06] border border-border-strong rounded px-2 py-1">{c.favorite_modifier}</span>
              </div>
            )}
          </div>

          {/* Favorite items chips */}
          {items.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Favorite items</div>
              <div className="flex flex-wrap gap-1.5">
                {items.map((it, i) => (
                  <span key={i} className="text-[11px] bg-orange/10 border border-orange/30 text-orange rounded-full px-2.5 py-1">{it}</span>
                ))}
              </div>
            </div>
          )}

          {/* Discount card */}
          <div className="card-surface p-4 bg-orange/10 border-orange/30">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Suggested discount</div>
            <div className="text-[24px] font-semibold text-orange">{discount}</div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => navigate(`/generate?customer_id=${encodeURIComponent(c.id)}`)}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-[12.5px] font-medium bg-orange text-primary-foreground hover:opacity-90 transition"
            >
              <Sparkles className="w-3.5 h-3.5" /> Generate Message
            </button>
            <button
              onClick={() => navigate(`/messages?customer_id=${encodeURIComponent(c.id)}`)}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-[12.5px] font-medium bg-white/[0.06] border border-border-strong hover:bg-white/[0.1] transition"
            >
              <MessageCircle className="w-3.5 h-3.5" /> View Messages
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-surface p-3 bg-surface-2">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="text-[16px] font-semibold mt-1">{value}</div>
    </div>
  );
}

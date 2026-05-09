import { Link, useSearchParams } from "@/lib/router-shim";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Topbar } from "@/components/layout/Topbar";
import { RiskBadge, SegmentBadge } from "@/components/ui-kit/Badges";
import { MessageSquare, Mail, Bell, ChevronDown, ChevronUp, Copy, Check, X } from "lucide-react";
import { usePageMeta } from "@/hooks/use-page-meta";

type Channel = "sms" | "email" | "app";
const CHANNELS: { id: Channel; label: string; icon: typeof MessageSquare }[] = [
  { id: "sms", label: "SMS", icon: MessageSquare },
  { id: "email", label: "Email", icon: Mail },
  { id: "app", label: "App push", icon: Bell },
];

type MsgItem = NonNullable<Awaited<ReturnType<typeof api.messagesLog>>>["messages"][number];

function normalizeArr(v: string[] | string | undefined): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  try {
    const fixed = v.replace(/'/g, '"');
    const arr = JSON.parse(fixed);
    return Array.isArray(arr) ? arr.map(String) : [];
  } catch {
    return v.replace(/[[\]']/g, "").split(",").map((x) => x.trim()).filter(Boolean);
  }
}

export default function MessagesPage() {
  usePageMeta("Messages · Campbell's AI Marketing Hub", "AI-generated re-engagement messages personalized per customer.");
  const [searchParams] = useSearchParams();
  const customer_id = searchParams.get("customer_id") ?? undefined;
  const { data, isLoading, error } = useQuery({
    queryKey: ["messages-log"], queryFn: () => api.messagesLog({ limit: 30 }),
  });

  const filtered = useMemo(() => {
    if (!data?.messages) return [];
    if (!customer_id) return data.messages;
    return data.messages.filter((m) => String(m.customer_id) === customer_id);
  }, [data, customer_id]);

  return (
    <>
      <Topbar title="Message Log" subtitle="Groq LLaMA 3.3-70b · Personalized per customer profile" />
      <div className="flex-1 overflow-y-auto px-7 py-6">
        <div className="mb-4 flex justify-between items-center flex-wrap gap-3">
          <div>
            <div className="text-[14px] font-medium">Generated re-engagement messages</div>
            <div className="text-[12px] text-muted-foreground mt-0.5">
              {filtered.length} {customer_id ? "filtered" : "messages logged"}
              {customer_id && (
                <Link to="/messages" className="ml-2 inline-flex items-center gap-1 text-orange hover:underline">
                  <X className="w-3 h-3" /> clear filter for #{customer_id}
                </Link>
              )}
            </div>
          </div>
          <Link to="/generate" className="px-4 py-2 rounded-lg text-[13px] font-medium bg-orange text-primary-foreground hover:opacity-90 transition">
            + Generate new
          </Link>
        </div>

        {error && <div className="card-surface p-4 text-red">Failed to load messages.</div>}
        {isLoading && <div className="card-surface p-12 text-center text-muted-foreground">Loading…</div>}

        <div className="grid gap-3.5">
          {filtered.map((m) => (
            <MessageCard key={String(m.id)} m={m} />
          ))}
        </div>
      </div>
    </>
  );
}

function MessageCard({ m }: { m: MsgItem }) {
  const [channel, setChannel] = useState<Channel>("sms");
  const [showContext, setShowContext] = useState(false);
  const [copied, setCopied] = useState<"sms" | "email" | null>(null);
  const cid = String(m.customer_id ?? "");
  const initials = cid.replace(".0", "").slice(-2) || "??";

  const aspects = normalizeArr(m.aspects);
  const sentiments = normalizeArr(m.sentiments);
  const aspectPairs = aspects.map((a, i) => ({ aspect: a, sentiment: sentiments[i] ?? "neu" }));

  const copy = (text: string, tag: "sms" | "email") => {
    void navigator.clipboard?.writeText(text);
    setCopied(tag);
    setTimeout(() => setCopied(null), 1500);
  };

  const sentClass = (s: string) => {
    const x = s.toLowerCase();
    if (x.startsWith("pos")) return "bg-green/15 text-green border-green/30";
    if (x.startsWith("neg")) return "bg-red/15 text-red border-red/30";
    return "bg-white/[0.06] text-muted-foreground border-border-strong";
  };

  return (
    <div className="card-surface p-5">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-[10px] bg-orange/15 text-orange font-semibold flex items-center justify-center text-base flex-shrink-0">{initials}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className="text-[13px] font-medium">Customer #{cid}</span>
            <SegmentBadge value={m.segment} />
            <RiskBadge value={m.risk_level} />
            <span className="text-[11px] text-muted-foreground ml-auto">{new Date(m.created_at).toLocaleString()}</span>
          </div>

          {/* Channel tabs */}
          <div className="flex gap-1 border-b border-border mb-3">
            {CHANNELS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setChannel(id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-[12px] border-b-2 transition ${
                  channel === id
                    ? "border-orange text-orange font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
            <div className="ml-auto flex gap-1">
              <button
                onClick={() => copy(m.sms || "", "sms")}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground px-2 py-1 rounded"
              >
                {copied === "sms" ? <Check className="w-3 h-3 text-green" /> : <Copy className="w-3 h-3" />} SMS
              </button>
              <button
                onClick={() => copy(`${m.email_subject}\n\n${m.email_body}`, "email")}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground px-2 py-1 rounded"
              >
                {copied === "email" ? <Check className="w-3 h-3 text-green" /> : <Copy className="w-3 h-3" />} Email
              </button>
            </div>
          </div>

          {/* Channel content */}
          {channel === "sms" && (
            <div className="text-[12.5px] text-muted-foreground bg-white/[0.04] border border-border rounded-lg p-3 leading-relaxed whitespace-pre-wrap">
              {m.sms || "—"}
            </div>
          )}
          {channel === "email" && (
            <div className="bg-white/[0.04] border border-border rounded-lg p-3 space-y-2">
              <div className="text-[11px] text-muted-foreground">Subject</div>
              <div className="text-[13px] font-medium">{m.email_subject || "—"}</div>
              <div className="border-t border-border pt-2">
                <div className="text-[11px] text-muted-foreground mb-1">Body</div>
                <div className="text-[12.5px] text-muted-foreground leading-relaxed whitespace-pre-wrap">{m.email_body || "—"}</div>
              </div>
            </div>
          )}
          {channel === "app" && (
            <div className="text-[12.5px] text-muted-foreground bg-white/[0.04] border border-border rounded-lg p-3 leading-relaxed whitespace-pre-wrap">
              {m.app_notification || "—"}
            </div>
          )}

          {/* Context collapsible */}
          <button
            onClick={() => setShowContext((s) => !s)}
            className="mt-3 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
          >
            {showContext ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {showContext ? "Hide context" : "Why this message?"}
          </button>
          {showContext && (
            <div className="mt-2 bg-surface-2 border border-border rounded-lg p-3 space-y-2 text-[12px]">
              <div className="text-muted-foreground">
                Generated because customer is in segment <span className="text-foreground font-medium">{m.segment}</span> with{" "}
                <span className="text-foreground font-medium">{m.risk_level}</span> churn risk · qualified for{" "}
                <span className="text-orange font-semibold">{m.discount_offered}</span> discount.
              </div>
              {aspectPairs.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">Aspects from review</div>
                  <div className="flex flex-wrap gap-1.5">
                    {aspectPairs.map((p, i) => (
                      <span key={i} className={`text-[11px] px-2 py-0.5 rounded border capitalize ${sentClass(p.sentiment)}`}>
                        {p.aspect} · {p.sentiment}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="bg-orange/10 border border-orange/25 text-orange px-2.5 py-1 rounded-md text-[12px] font-semibold flex-shrink-0">{m.discount_offered}</div>
      </div>
    </div>
  );
}

import type { Risk, Segment } from "@/lib/api";

const segStyles: Record<Segment, string> = {
  Lost: "bg-red/15 text-[oklch(0.72_0.16_25)]",
  New: "bg-blue/15 text-[oklch(0.75_0.11_247)]",
  Occasional: "bg-yellow/15 text-[oklch(0.85_0.12_85)]",
  Regular: "bg-green/15 text-[oklch(0.78_0.13_165)]",
};
const riskStyles: Record<Risk, string> = {
  High: "bg-red/15 text-[oklch(0.72_0.16_25)]",
  Medium: "bg-yellow/15 text-[oklch(0.85_0.12_85)]",
  Low: "bg-green/15 text-[oklch(0.78_0.13_165)]",
};

export function SegmentBadge({ value }: { value: Segment }) {
  return <span className={`badge-soft ${segStyles[value] ?? segStyles.New}`}>{value}</span>;
}
export function RiskBadge({ value }: { value: Risk }) {
  return <span className={`badge-soft ${riskStyles[value] ?? riskStyles.Low}`}>{value}</span>;
}
export function ProbBar({ p }: { p: number }) {
  const pct = Math.round(p * 100);
  const col = p > 0.7 ? "var(--red)" : p > 0.4 ? "var(--yellow)" : "var(--green)";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-white/[0.07] rounded-sm max-w-[80px]">
        <div className="h-full rounded-sm" style={{ width: `${pct}%`, background: col }} />
      </div>
      <span className="text-[12px] text-muted-foreground">{pct}%</span>
    </div>
  );
}

interface DonutProps {
  segments: { name: string; value: number; color: string }[];
  total: number;
}

export function SegmentDonut({ segments, total }: DonutProps) {
  const r = 45;
  const C = 2 * Math.PI * r;
  const sum = segments.reduce((s, x) => s + x.value, 0) || 1;
  let offset = 0;
  return (
    <div className="flex items-center gap-6">
      <svg width="120" height="120" viewBox="0 0 120 120" className="flex-shrink-0">
        <circle cx="60" cy="60" r={r} fill="none" stroke="oklch(0.25 0.012 264)" strokeWidth="20" />
        {segments.map((s) => {
          const len = (s.value / sum) * C;
          const dasharray = `${len} ${C - len}`;
          const dashoffset = -offset;
          offset += len;
          return (
            <circle key={s.name} cx="60" cy="60" r={r} fill="none" stroke={s.color} strokeWidth="20"
              strokeDasharray={dasharray} strokeDashoffset={dashoffset} transform="rotate(-90 60 60)" />
          );
        })}
        <text x="60" y="57" textAnchor="middle" fill="var(--foreground)" fontSize="18" fontWeight="600" fontFamily="DM Sans">{total.toLocaleString()}</text>
        <text x="60" y="70" textAnchor="middle" fill="var(--muted)" fontSize="10" fontFamily="DM Sans">customers</text>
      </svg>
      <div className="flex-1">
        {segments.map((s) => {
          const pct = ((s.value / sum) * 100);
          return (
            <div key={s.name} className="flex items-center gap-2 py-1.5 border-b border-border last:border-b-0">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
              <div className="text-[13px] text-muted-foreground flex-1">{s.name}</div>
              <div className="text-[13px] font-medium">{s.value.toLocaleString()}</div>
              <div className="text-[11px] text-muted-foreground w-9 text-right">{pct < 1 ? pct.toFixed(1) : Math.round(pct)}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

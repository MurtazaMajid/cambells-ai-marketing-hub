interface TopbarProps {
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
}

export function Topbar({ title, subtitle, actions }: TopbarProps) {
  return (
    <div className="bg-surface border-b border-border px-7 py-3.5 flex items-center justify-between flex-shrink-0">
      <div>
        <div className="text-[15px] font-medium">{title}</div>
        <div className="text-[12px] text-muted-foreground mt-0.5">{subtitle}</div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-[11px] text-muted-foreground bg-surface-2 px-2.5 py-1 rounded-md font-mono">
          <span className="text-green mr-1">●</span>campbells-ai-and-marketing-hub-1.onrender.com
        </div>
        <div className="w-px h-5 bg-border-strong" />
        {actions}
      </div>
    </div>
  );
}

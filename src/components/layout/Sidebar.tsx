import { Link, useLocation } from "react-router-dom";
import { LayoutGrid, Users, Smile, MessageSquare, Sparkles, BarChart3 } from "lucide-react";

const nav = [
  { section: "Analytics", items: [
    { to: "/", label: "Overview", icon: LayoutGrid },
    { to: "/customers", label: "Customers", icon: Users, badge: "1539" },
    { to: "/analysis", label: "Analysis", icon: BarChart3 },
    { to: "/sentiment", label: "Sentiment", icon: Smile },
  ]},
  { section: "Marketing", items: [
    { to: "/messages", label: "Messages", icon: MessageSquare, badge: "10" },
    { to: "/generate", label: "Generate", icon: Sparkles },
  ]},
];

export function Sidebar() {
  const { pathname: path } = useLocation();
  return (
    <aside className="w-[220px] flex-shrink-0 bg-surface border-r border-border flex flex-col sticky top-0 h-screen">
      <div className="px-5 pt-6 pb-5 border-b border-border">
        <div className="w-9 h-9 bg-orange rounded-[10px] flex items-center justify-center text-lg mb-2.5">🍽</div>
        <div className="font-serif text-[17px] leading-tight">Campbell's</div>
        <div className="text-[11px] text-muted-foreground mt-0.5 tracking-widest uppercase">AI Marketing Hub</div>
      </div>
      <nav className="px-2.5 py-4 flex-1">
        {nav.map((sec) => (
          <div key={sec.section}>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground px-2.5 mt-4 mb-1.5">{sec.section}</div>
            {sec.items.map((it) => {
              const Icon = it.icon;
              const active = path === it.to;
              return (
                <Link key={it.to} to={it.to} className={`nav-link ${active ? "is-active" : ""}`}>
                  <Icon className="w-4 h-4 opacity-70" />
                  <span>{it.label}</span>
                  {it.badge && (
                    <span className="ml-auto bg-orange text-primary-foreground text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-tight">
                      {it.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-border">
        <span className="inline-block w-[7px] h-[7px] bg-green rounded-full mr-1.5 pulse-dot align-middle" />
        <span className="text-[12px] text-muted-foreground">API Live · Railway</span>
      </div>
    </aside>
  );
}

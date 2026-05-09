import { Link, useLocation } from "@tanstack/react-router";
import { CalendarDays, BookOpen, ShoppingBasket, Sparkles, Home } from "lucide-react";
import type { ReactNode } from "react";
import pandaLogo from "@/assets/panda-logo.png";

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/plan", label: "Plan", icon: CalendarDays },
  { to: "/library", label: "Library", icon: BookOpen },
  { to: "/grocery", label: "Grocery", icon: ShoppingBasket },
  { to: "/insights", label: "Insights", icon: Sparkles },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-20 backdrop-blur-md bg-background/80 border-b border-border/60">
        <div className="mx-auto max-w-2xl px-5 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img
              src={pandaLogo}
              alt="Panda's Kitchen logo"
              width={32}
              height={32}
              className="h-8 w-8 rounded-xl bg-secondary object-contain"
            />
            <span className="font-display text-xl tracking-tight">Panda's Kitchen</span>
          </Link>
          <span className="text-xs text-muted-foreground hidden sm:block">
            Family meals, planned with care
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-5 pt-4">{children}</main>
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-card/95 backdrop-blur border-t border-border">
        <div className="mx-auto max-w-2xl grid grid-cols-5">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center justify-center gap-1 py-3 text-[11px] font-medium transition-colors ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? "stroke-[2.4]" : ""}`} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

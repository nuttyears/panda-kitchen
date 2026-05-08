import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import {
  getMealName,
  getMealTags,
  mealSignature,
  planKey,
  startOfWeek,
  useHydrate,
  useStore,
} from "@/lib/store";
import { ChefHat, UtensilsCrossed, Repeat, Salad } from "lucide-react";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "Insights — tabletop" },
      { name: "description", content: "How the family ate this week — at a glance." },
      { property: "og:title", content: "Weekly insights — tabletop" },
      { property: "og:description", content: "Cook vs. takeout, balance, and repeats — calm reflection on the week." },
    ],
  }),
  component: InsightsPage,
});

function InsightsPage() {
  useHydrate();
  const plan = useStore((s) => s.plan);
  const dishes = useStore((s) => s.dishes);
  const restaurants = useStore((s) => s.restaurants);
  const weekStart = useMemo(() => startOfWeek(), []);

  const data = useMemo(() => {
    let cook = 0, takeout = 0, balanced = 0, total = 0;
    const sigCount = new Map<string, { count: number; label: string }>();
    for (let i = 0; i < 7; i++) {
      for (const slot of ["lunch", "dinner"]) {
        const m = plan[planKey(weekStart, i, slot)];
        if (!m) continue;
        total++;
        if (m.mode === "cook") cook++;
        else takeout++;
        const tags = getMealTags(m, dishes, restaurants);
        if (tags.has("protein") && tags.has("veggie") && tags.has("fruit")) balanced++;
        const sig = mealSignature(m);
        const label = getMealName(m, dishes, restaurants);
        const prev = sigCount.get(sig);
        sigCount.set(sig, { count: (prev?.count ?? 0) + 1, label });
      }
    }
    const repeats = Array.from(sigCount.values())
      .filter((v) => v.count > 1)
      .sort((a, b) => b.count - a.count);
    return { cook, takeout, balanced, total, repeats };
  }, [plan, dishes, restaurants, weekStart]);

  const cookPct = data.total ? (data.cook / data.total) * 100 : 0;
  const balancedPct = data.total ? Math.round((data.balanced / data.total) * 100) : 0;

  return (
    <AppShell>
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Insights</p>
        <h1 className="font-display text-4xl mt-1">How we ate</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Week of {weekStart.toLocaleDateString(undefined, { month: "long", day: "numeric" })}
        </p>
      </div>

      {data.total === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <Salad className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Plan some meals to see your weekly story here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="font-display text-xl">Cook vs. takeout</h2>
              <span className="text-sm text-muted-foreground">{data.total} meals</span>
            </div>
            <div className="h-3 w-full rounded-full bg-muted overflow-hidden flex">
              <div style={{ width: `${cookPct}%`, background: "var(--cook)" }} />
              <div style={{ width: `${100 - cookPct}%`, background: "var(--takeout)" }} />
            </div>
            <div className="flex justify-between mt-3 text-sm">
              <span className="flex items-center gap-1.5">
                <ChefHat className="h-3.5 w-3.5" style={{ color: "var(--cook)" }} />
                Cooked <strong className="font-display">{data.cook}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <UtensilsCrossed className="h-3.5 w-3.5" style={{ color: "var(--takeout)" }} />
                Takeout <strong className="font-display">{data.takeout}</strong>
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl">Balance</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Protein + veggie + fruit per meal
                </p>
              </div>
              <div className="font-display text-4xl" style={{ color: "var(--accent)" }}>
                {balancedPct}%
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Repeat className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-display text-xl">Repeats</h2>
            </div>
            {data.repeats.length === 0 ? (
              <p className="text-sm text-muted-foreground">Lovely variety this week.</p>
            ) : (
              <ul className="space-y-2">
                {data.repeats.map((r) => (
                  <li
                    key={r.label}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="truncate pr-2">{r.label}</span>
                    <span
                      className="tag-chip"
                      style={{
                        background: "color-mix(in oklab, var(--warn) 15%, transparent)",
                        color: "var(--warn)",
                      }}
                    >
                      {r.count}×
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center px-4 pt-2">
            Informational only — not medical or dietary advice.
          </p>
        </div>
      )}
    </AppShell>
  );
}

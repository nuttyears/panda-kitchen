import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { MealEditor } from "@/components/MealEditor";
import { TagChip } from "@/components/TagChip";
import {
  actions,
  addDays,
  getMealName,
  getMealTags,
  mealSignature,
  planKey,
  startOfWeek,
  useHydrate,
  useStore,
} from "@/lib/store";
import { ChefHat, UtensilsCrossed, Plus, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MacroTag, SlotKey } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "tabletop — Plan the week" },
      { name: "description", content: "Plan family dinners and school lunches without the weeknight scramble." },
      { property: "og:title", content: "tabletop — Family meal planning" },
      { property: "og:description", content: "Cook or takeout, kid-approved, balance-aware. One calm weekly plan." },
    ],
  }),
  component: PlannerPage,
});

const SLOTS: { key: SlotKey; label: string; Icon: typeof ChefHat }[] = [
  { key: "lunch", label: "School lunch", Icon: UtensilsCrossed },
  { key: "dinner", label: "Dinner", Icon: ChefHat },
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function PlannerPage() {
  useHydrate();
  const plan = useStore((s) => s.plan);
  const dishes = useStore((s) => s.dishes);
  const restaurants = useStore((s) => s.restaurants);
  const threshold = useStore((s) => s.repeatThreshold);

  const [weekOffset, setWeekOffset] = useState(0);
  const weekStart = useMemo(() => addDays(startOfWeek(), weekOffset * 7), [weekOffset]);
  const [editing, setEditing] = useState<{ key: string; day: string; slot: string } | null>(null);

  // repeat counts per signature within visible week
  const sigCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (let i = 0; i < 7; i++) {
      for (const slot of SLOTS) {
        const m = plan[planKey(weekStart, i, slot.key)];
        if (!m) continue;
        const sig = mealSignature(m);
        counts.set(sig, (counts.get(sig) ?? 0) + 1);
      }
    }
    return counts;
  }, [plan, weekStart]);

  const summary = useMemo(() => {
    let cook = 0, takeout = 0, balanced = 0, total = 0;
    for (let i = 0; i < 7; i++) {
      for (const slot of SLOTS) {
        const m = plan[planKey(weekStart, i, slot.key)];
        if (!m) continue;
        total++;
        if (m.mode === "cook") cook++;
        else takeout++;
        const tags = getMealTags(m, dishes, restaurants);
        if (tags.has("protein") && tags.has("veggie") && tags.has("fruit")) balanced++;
      }
    }
    return { cook, takeout, balanced, total };
  }, [plan, weekStart, dishes, restaurants]);

  const editingMeal = editing ? plan[editing.key] : undefined;

  return (
    <AppShell>
      <section className="mb-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">This week</p>
            <h1 className="font-display text-4xl mt-1 leading-none">
              {weekStart.toLocaleDateString(undefined, { month: "long", day: "numeric" })}
            </h1>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setWeekOffset((w) => w - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <button
              onClick={() => setWeekOffset(0)}
              className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-muted"
            >
              Today
            </button>
            <Button variant="ghost" size="icon" onClick={() => setWeekOffset((w) => w + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <SummaryStat label="Cooked" value={summary.cook} accent="var(--cook)" />
          <SummaryStat label="Takeout" value={summary.takeout} accent="var(--takeout)" />
          <SummaryStat
            label="Balanced"
            value={summary.total ? `${Math.round((summary.balanced / summary.total) * 100)}%` : "—"}
            accent="var(--accent)"
          />
        </div>
      </section>

      <div className="space-y-3">
        {Array.from({ length: 7 }).map((_, dayIdx) => {
          const date = addDays(weekStart, dayIdx);
          const isToday = new Date().toDateString() === date.toDateString();
          return (
            <article
              key={dayIdx}
              className={`rounded-2xl border bg-card overflow-hidden ${
                isToday ? "border-primary/60 shadow-[0_8px_30px_-12px_color-mix(in_oklab,var(--primary)_30%,transparent)]" : "border-border"
              }`}
            >
              <header className="flex items-center justify-between px-4 pt-3.5 pb-2">
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-2xl">{DAY_NAMES[date.getDay()]}</span>
                  <span className="text-sm text-muted-foreground">
                    {date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                  {isToday && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">today</span>
                  )}
                </div>
              </header>
              <div className="divide-y divide-border/60">
                {SLOTS.map((slot) => {
                  const key = planKey(weekStart, dayIdx, slot.key);
                  const meal = plan[key];
                  const tags = meal ? getMealTags(meal, dishes, restaurants) : new Set<string>();
                  const repeatCount = meal ? sigCounts.get(mealSignature(meal)) ?? 0 : 0;
                  const repeated = repeatCount >= threshold + 1;
                  const balanced =
                    meal && tags.has("protein") && tags.has("veggie") && tags.has("fruit");
                  return (
                    <button
                      key={slot.key}
                      onClick={() =>
                        setEditing({ key, day: DAY_NAMES[date.getDay()], slot: slot.label })
                      }
                      className="w-full text-left px-4 py-3 hover:bg-muted/40 transition group"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="mt-0.5 h-8 w-8 rounded-lg grid place-items-center shrink-0"
                          style={{
                            background: meal
                              ? meal.mode === "cook"
                                ? "color-mix(in oklab, var(--cook) 15%, transparent)"
                                : "color-mix(in oklab, var(--takeout) 15%, transparent)"
                              : "var(--muted)",
                            color: meal
                              ? meal.mode === "cook"
                                ? "var(--cook)"
                                : "var(--takeout)"
                              : "var(--muted-foreground)",
                          }}
                        >
                          {meal ? (
                            meal.mode === "cook" ? (
                              <ChefHat className="h-4 w-4" />
                            ) : (
                              <UtensilsCrossed className="h-4 w-4" />
                            )
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                              {slot.label}
                            </span>
                            {balanced && (
                              <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "var(--accent)" }} />
                            )}
                            {repeated && (
                              <span
                                className="inline-flex items-center gap-1 text-[10px] font-medium"
                                style={{ color: "var(--warn)" }}
                              >
                                <AlertTriangle className="h-3 w-3" /> repeats {repeatCount}×
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 text-[15px] font-medium leading-snug">
                            {meal ? getMealName(meal, dishes, restaurants) : (
                              <span className="text-muted-foreground font-normal">Tap to plan</span>
                            )}
                          </div>
                          {meal && (
                            <div className="mt-1.5 flex gap-1 flex-wrap">
                              {(["protein", "veggie", "fruit"] as MacroTag[]).map((t) => (
                                <TagChip key={t} tag={t} small muted={!tags.has(t)} />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-8 mb-2 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Repeat warning when a meal appears more than {threshold}×
        </p>
        <button
          onClick={() => actions.setThreshold(threshold === 2 ? 1 : 2)}
          className="text-xs underline-offset-4 hover:underline text-muted-foreground"
        >
          Tighten
        </button>
      </div>

      {editing && (
        <MealEditor
          open={!!editing}
          onOpenChange={(v) => !v && setEditing(null)}
          planKey={editing.key}
          dayLabel={editing.day}
          slotLabel={editing.slot}
          initial={editingMeal}
        />
      )}
    </AppShell>
  );
}

function SummaryStat({ label, value, accent }: { label: string; value: string | number; accent: string }) {
  return (
    <div
      className="rounded-xl border border-border/70 bg-card px-3 py-2.5"
      style={{ boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${accent} 8%, transparent)` }}
    >
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-display text-2xl mt-0.5" style={{ color: accent }}>
        {value}
      </div>
    </div>
  );
}

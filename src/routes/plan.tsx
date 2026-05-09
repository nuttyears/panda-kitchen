import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
import { ChefHat, UtensilsCrossed, Plus, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MacroTag, SlotKey } from "@/lib/types";

export const Route = createFileRoute("/plan")({
  head: () => ({
    meta: [
      { title: "Plan the week — Panda's Kitchen" },
      { name: "description", content: "Plan family dinners and school lunches without the weeknight scramble." },
      { property: "og:title", content: "Plan the week — Panda's Kitchen" },
      { property: "og:description", content: "Cook or takeout, kid-approved, balance-aware. One calm weekly plan." },
    ],
  }),
  component: PlannerPage,
});

const SLOT_META: Record<SlotKey, { label: string; Icon: typeof ChefHat }> = {
  dinner: { label: "Dinner", Icon: ChefHat },
  lunch: { label: "School lunch", Icon: UtensilsCrossed },
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_NAMES_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// School lunches are only needed Mon–Fri, and they are prepped the evening before.
// Returns the slots to render on a given dayIdx of the week (0=Sun..6=Sat),
// in cooking order: dinner first, then tomorrow's school lunch (if a school day).
function slotsForDay(dayIdx: number): Array<{
  key: SlotKey;
  label: string;
  Icon: typeof ChefHat;
  targetDayIdx: number; // dayIdx the meal is *for* (used for planKey)
}> {
  const slots: Array<{ key: SlotKey; label: string; Icon: typeof ChefHat; targetDayIdx: number }> = [
    { key: "dinner", label: "Dinner", Icon: ChefHat, targetDayIdx: dayIdx },
  ];
  // Tomorrow's school lunch — only if tomorrow is Mon–Fri (dayIdx 1..5)
  const tomorrow = dayIdx + 1;
  if (tomorrow >= 1 && tomorrow <= 5) {
    slots.push({
      key: "lunch",
      label: `${DAY_NAMES[tomorrow]} school lunch`,
      Icon: UtensilsCrossed,
      targetDayIdx: tomorrow,
    });
  }
  return slots;
}

function PlannerPage() {
  useHydrate();
  const plan = useStore((s) => s.plan);
  const dishes = useStore((s) => s.dishes);
  const restaurants = useStore((s) => s.restaurants);
  const threshold = useStore((s) => s.repeatThreshold);

  const [weekOffset, setWeekOffset] = useState(0);
  const weekStart = useMemo(() => addDays(startOfWeek(), weekOffset * 7), [weekOffset]);
  const [editing, setEditing] = useState<{ key: string; day: string; slot: string } | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // All planned-meal keys visible in the week (dinner Sun–Sat, lunch Mon–Fri)
  const visibleKeys = useMemo(() => {
    const keys: string[] = [];
    for (let i = 0; i < 7; i++) keys.push(planKey(weekStart, i, "dinner"));
    for (let i = 1; i <= 5; i++) keys.push(planKey(weekStart, i, "lunch"));
    return keys;
  }, [weekStart]);

  const sigCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const k of visibleKeys) {
      const m = plan[k];
      if (!m) continue;
      counts.set(mealSignature(m), (counts.get(mealSignature(m)) ?? 0) + 1);
    }
    return counts;
  }, [plan, visibleKeys]);

  const summary = useMemo(() => {
    let cook = 0, takeout = 0, balanced = 0, total = 0;
    for (const k of visibleKeys) {
      const m = plan[k];
      if (!m) continue;
      total++;
      if (m.mode === "cook") cook++;
      else takeout++;
      const tags = getMealTags(m, dishes, restaurants);
      if (tags.has("protein") && tags.has("veggie") && tags.has("fruit")) balanced++;
    }
    return { cook, takeout, balanced, total };
  }, [plan, visibleKeys, dishes, restaurants]);

  const editingMeal = editing ? plan[editing.key] : undefined;

  const todayDate = useMemo(() => new Date(), []);
  const todayWeekStart = useMemo(() => startOfWeek(todayDate), [todayDate]);
  const todayDayIdx = useMemo(() => {
    const d = new Date(todayDate);
    d.setHours(0, 0, 0, 0);
    return Math.round((d.getTime() - todayWeekStart.getTime()) / (1000 * 60 * 60 * 24));
  }, [todayDate, todayWeekStart]);
  const todayDinnerKey = planKey(todayWeekStart, todayDayIdx, "dinner");
  const todayDinnerMeal = plan[todayDinnerKey];
  const todayDinnerName = todayDinnerMeal
    ? getMealName(todayDinnerMeal, dishes, restaurants)
    : null;

  const jumpToToday = () => {
    setWeekOffset(0);
    requestAnimationFrame(() => {
      document.getElementById("day-today")?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };
  const planTodayDinner = () => {
    setWeekOffset(0);
    setEditing({
      key: todayDinnerKey,
      day: DAY_NAMES[todayDate.getDay()],
      slot: "Dinner",
    });
  };

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
              onClick={jumpToToday}
              className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-muted"
            >
              Today
            </button>
            <Button variant="ghost" size="icon" onClick={() => setWeekOffset((w) => w + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {mounted && (
          <button
            onClick={planTodayDinner}
            className="mt-4 w-full flex items-center justify-between gap-3 rounded-2xl bg-primary text-primary-foreground px-4 py-3.5 shadow-[0_8px_24px_-12px_color-mix(in_oklab,var(--primary)_60%,transparent)] hover:opacity-95 transition"
          >
            <span className="flex items-center gap-2.5">
              <CalendarCheck className="h-5 w-5" />
              <span className="text-left">
                <span className="block text-[10px] uppercase tracking-wider opacity-80">
                  {todayDate.toLocaleDateString(undefined, { weekday: "long" })} · today
                </span>
                <span className="font-display text-lg leading-tight">
                  {todayDinnerName ?? "Plan tonight's dinner"}
                </span>
              </span>
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-primary-foreground/15">
              {todayDinnerName ? "Edit" : "Plan"}
            </span>
          </button>
        )}

        <div className="mt-3 grid grid-cols-3 gap-2">
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
          const isToday = mounted && new Date().toDateString() === date.toDateString();
          return (
            <article
              key={dayIdx}
              id={isToday ? "day-today" : undefined}
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
                {slotsForDay(dayIdx).map((slot) => {
                  const key = planKey(weekStart, slot.targetDayIdx, slot.key);
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
                        setEditing({ key, day: DAY_NAMES_LONG[date.getDay()], slot: slot.label })
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

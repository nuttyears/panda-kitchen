import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { MealEditor } from "@/components/MealEditor";
import { TagChip } from "@/components/TagChip";
import {
  addDays,
  getMealName,
  getMealTags,
  planKey,
  startOfWeek,
  useHydrate,
  useStore,
} from "@/lib/store";
import {
  ChefHat,
  UtensilsCrossed,
  Plus,
  CalendarDays,
  BookOpen,
  ShoppingBasket,
  Sparkles,
  ArrowRight,
  Store,
} from "lucide-react";
import type { MacroTag, SlotKey } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Home — Panda's Kitchen" },
      { name: "description", content: "Today's menu at a glance, plus quick access to your library, grocery list, and insights." },
      { property: "og:title", content: "Home — Panda's Kitchen" },
      { property: "og:description", content: "Today's menu at a glance, plus quick access to your library, grocery list, and insights." },
    ],
  }),
  component: HomePage,
});

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Slots to prep tonight, in cooking order: tonight's dinner first,
// then tomorrow's school lunch (only if tomorrow is a school day, Mon–Fri).
function tonightSlots(todayDayOfWeek: number): Array<{
  key: SlotKey;
  label: string;
  Icon: typeof ChefHat;
  dayOffset: number; // 0 = today, 1 = tomorrow
}> {
  const slots: Array<{ key: SlotKey; label: string; Icon: typeof ChefHat; dayOffset: number }> = [
    { key: "dinner", label: "Tonight's dinner", Icon: ChefHat, dayOffset: 0 },
  ];
  const tomorrowDow = (todayDayOfWeek + 1) % 7;
  if (tomorrowDow >= 1 && tomorrowDow <= 5) {
    slots.push({
      key: "lunch",
      label: `${DAY_NAMES[tomorrowDow]}'s school lunch`,
      Icon: UtensilsCrossed,
      dayOffset: 1,
    });
  }
  return slots;
}

function HomePage() {
  useHydrate();
  // Defer date-dependent UI to client to avoid SSR/CSR hydration mismatches
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const plan = useStore((s) => s.plan);
  const dishes = useStore((s) => s.dishes);
  const restaurants = useStore((s) => s.restaurants);

  const [editing, setEditing] = useState<{ key: string; day: string; slot: string } | null>(null);

  const today = useMemo(() => new Date(), [mounted]);
  const weekStart = useMemo(() => startOfWeek(today), [today]);
  const dayIdx = useMemo(() => {
    const d = new Date(today);
    d.setHours(0, 0, 0, 0);
    return Math.round((d.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
  }, [today, weekStart]);

  const editingMeal = editing ? plan[editing.key] : undefined;

  const cookCount = dishes.length;
  const restaurantCount = restaurants.length;

  return (
    <AppShell>
      {/* Greeting */}
      <section className="mb-5 mt-1">
        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
          {mounted ? today.toLocaleDateString(undefined, { weekday: "long" }) : "\u00A0"}
        </p>
        <h1 className="font-display text-4xl mt-1 leading-none">Tonight's prep</h1>
        <p className="text-sm text-muted-foreground mt-1.5">
          {mounted
            ? today.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })
            : "\u00A0"}
        </p>
      </section>

      {/* Tonight's cooking: dinner first, then tomorrow's school lunch (if school day) */}
      <section className="space-y-3">
        {(mounted ? tonightSlots(today.getDay()) : []).map((slot) => {
          const targetDayIdx = dayIdx + slot.dayOffset;
          const key = planKey(weekStart, targetDayIdx, slot.key);
          const meal = plan[key];
          const tags = meal ? getMealTags(meal, dishes, restaurants) : new Set<string>();
          const targetDow = (today.getDay() + slot.dayOffset) % 7;
          return (
            <button
              key={slot.key}
              onClick={() =>
                setEditing({
                  key,
                  day: DAY_NAMES[targetDow],
                  slot: slot.key === "dinner" ? "Dinner" : "School lunch",
                })
              }
              className="w-full text-left rounded-2xl border border-border bg-card p-4 hover:border-primary/50 hover:shadow-[0_8px_30px_-12px_color-mix(in_oklab,var(--primary)_25%,transparent)] transition group"
            >
              <div className="flex items-start gap-3">
                <div
                  className="h-11 w-11 rounded-xl grid place-items-center shrink-0"
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
                    meal.mode === "cook" ? <ChefHat className="h-5 w-5" /> : <UtensilsCrossed className="h-5 w-5" />
                  ) : (
                    <Plus className="h-5 w-5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    {slot.label}
                  </div>
                  <div className="mt-0.5 font-display text-xl leading-snug">
                    {meal ? (
                      getMealName(meal, dishes, restaurants)
                    ) : (
                      <span className="text-muted-foreground font-sans text-base font-normal">
                        Not planned — tap to plan
                      </span>
                    )}
                  </div>
                  {meal && (
                    <div className="mt-2 flex gap-1 flex-wrap">
                      {(["protein", "veggie", "fruit"] as MacroTag[]).map((t) => (
                        <TagChip key={t} tag={t} small muted={!tags.has(t)} />
                      ))}
                    </div>
                  )}
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary transition mt-1" />
              </div>
            </button>
          );
        })}
      </section>

      {/* Quick actions */}
      <section className="mt-8">
        <h2 className="font-display text-lg mb-3">Jump to</h2>
        <div className="grid grid-cols-2 gap-3">
          <ShortcutCard
            to="/plan"
            label="Week plan"
            hint="See all 7 days"
            Icon={CalendarDays}
            tone="primary"
          />
          <ShortcutCard
            to="/grocery"
            label="Grocery list"
            hint="Auto from your plan"
            Icon={ShoppingBasket}
            tone="cook"
          />
          <ShortcutCard
            to="/insights"
            label="Insights"
            hint="Cook vs takeout, balance"
            Icon={Sparkles}
            tone="accent"
          />
          <ShortcutCard
            to="/library"
            label="Library"
            hint="Edit dishes & restaurants"
            Icon={BookOpen}
            tone="takeout"
          />
        </div>
      </section>

      {/* Library quick edit */}
      <section className="mt-8 mb-4">
        <div className="flex items-end justify-between mb-3">
          <h2 className="font-display text-lg">Your library</h2>
          <Link
            to="/library"
            className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
          >
            Manage all
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/library"
            className="rounded-2xl border border-border bg-card p-4 hover:border-primary/40 transition"
          >
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              <ChefHat className="h-3.5 w-3.5" />
              Home-cooked
            </div>
            <div className="mt-2 font-display text-3xl">{cookCount}</div>
            <div className="text-xs text-muted-foreground mt-0.5">dishes</div>
          </Link>
          <Link
            to="/library"
            className="rounded-2xl border border-border bg-card p-4 hover:border-primary/40 transition"
          >
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              <Store className="h-3.5 w-3.5" />
              Takeout
            </div>
            <div className="mt-2 font-display text-3xl">{restaurantCount}</div>
            <div className="text-xs text-muted-foreground mt-0.5">restaurants</div>
          </Link>
        </div>
      </section>

      {editing && mounted && (
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

function ShortcutCard({
  to,
  label,
  hint,
  Icon,
  tone,
}: {
  to: "/plan" | "/grocery" | "/insights" | "/library";
  label: string;
  hint: string;
  Icon: typeof CalendarDays;
  tone: "primary" | "accent" | "cook" | "takeout";
}) {
  const color = `var(--${tone})`;
  return (
    <Link
      to={to}
      className="rounded-2xl border border-border bg-card p-4 hover:border-primary/40 transition group"
    >
      <div
        className="h-9 w-9 rounded-xl grid place-items-center"
        style={{
          background: `color-mix(in oklab, ${color} 15%, transparent)`,
          color,
        }}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-3 font-display text-lg leading-tight">{label}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{hint}</div>
    </Link>
  );
}

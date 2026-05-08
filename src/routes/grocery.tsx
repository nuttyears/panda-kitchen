import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  actions,
  planKey,
  startOfWeek,
  useHydrate,
  useStore,
} from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/grocery")({
  head: () => ({
    meta: [
      { title: "Grocery — tabletop" },
      { name: "description", content: "An auto-built shopping list from this week's home-cooked meals." },
      { property: "og:title", content: "Grocery list — tabletop" },
      { property: "og:description", content: "Everything your planned meals need, in one tappable list." },
    ],
  }),
  component: GroceryPage,
});

function GroceryPage() {
  useHydrate();
  const plan = useStore((s) => s.plan);
  const dishes = useStore((s) => s.dishes);
  const checked = useStore((s) => s.groceryChecked);
  const manual = useStore((s) => s.groceryManual);

  const weekStart = useMemo(() => startOfWeek(), []);
  const [input, setInput] = useState("");

  const items = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 0; i < 7; i++) {
      for (const slot of ["lunch", "dinner"]) {
        const m = plan[planKey(weekStart, i, slot)];
        if (!m || m.mode !== "cook") continue;
        (m.dishIds ?? []).forEach((id) => {
          const d = dishes.find((x) => x.id === id);
          d?.ingredients.forEach((ing) => map.set(ing, (map.get(ing) ?? 0) + 1));
        });
      }
    }
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [plan, dishes, weekStart]);

  const totalChecked =
    items.filter((i) => checked[i.name]).length +
    manual.filter((m) => checked[m.name]).length;
  const total = items.length + manual.length;

  const addManual = () => {
    if (!input.trim()) return;
    actions.addGroceryManual(input.trim());
    setInput("");
  };

  return (
    <AppShell>
      <div className="mb-5">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Grocery</p>
        <h1 className="font-display text-4xl mt-1">This week's list</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {total === 0
            ? "Plan some cooked meals and ingredients show up here."
            : `${totalChecked} of ${total} picked up`}
        </p>
      </div>

      <div className="flex gap-2 mb-4">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addManual()}
          placeholder="Add an item (milk, paper towels...)"
        />
        <Button onClick={addManual} size="icon" aria-label="Add">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="rounded-2xl border border-border bg-card divide-y divide-border/60 overflow-hidden">
        {[...items.map((i) => ({ ...i, manual: false })), ...manual.map((m) => ({ name: m.name, count: 1, manual: true as const }))].map((i) => {
          const isChecked = !!checked[i.name];
          return (
            <button
              key={i.name + (i.manual ? "-m" : "")}
              onClick={() => actions.toggleGrocery(i.name)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/40"
            >
              <span
                className={`h-5 w-5 rounded-md border flex items-center justify-center transition ${
                  isChecked
                    ? "bg-accent border-accent text-accent-foreground"
                    : "border-border"
                }`}
              >
                {isChecked && <Check className="h-3.5 w-3.5" />}
              </span>
              <span
                className={`flex-1 ${isChecked ? "line-through text-muted-foreground" : ""}`}
              >
                {i.name}
              </span>
              {i.count > 1 && !i.manual && (
                <span className="text-xs text-muted-foreground">×{i.count}</span>
              )}
              {i.manual && (
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  added
                </span>
              )}
            </button>
          );
        })}
        {total === 0 && (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            Empty for now.
          </div>
        )}
      </div>

      {totalChecked > 0 && (
        <Button
          variant="ghost"
          className="w-full mt-3 text-muted-foreground"
          onClick={actions.clearGroceryChecked}
        >
          <Trash2 className="h-4 w-4 mr-2" /> Clear checked
        </Button>
      )}
    </AppShell>
  );
}

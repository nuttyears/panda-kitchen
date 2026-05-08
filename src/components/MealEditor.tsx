import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChefHat, UtensilsCrossed, Trash2 } from "lucide-react";
import { useStore, actions } from "@/lib/store";
import type { PlannedMeal, MacroTag } from "@/lib/types";
import { TagChip } from "./TagChip";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  planKey: string;
  dayLabel: string;
  slotLabel: string;
  initial: PlannedMeal | undefined;
}

export function MealEditor({ open, onOpenChange, planKey, dayLabel, slotLabel, initial }: Props) {
  const dishes = useStore((s) => s.dishes);
  const restaurants = useStore((s) => s.restaurants);

  const [mode, setMode] = useState<"cook" | "takeout">(initial?.mode ?? "cook");
  const [dishIds, setDishIds] = useState<string[]>(initial?.dishIds ?? []);
  const [restaurantId, setRestaurantId] = useState<string | undefined>(initial?.restaurantId);
  const [itemIds, setItemIds] = useState<string[]>(initial?.itemIds ?? []);
  const [notes, setNotes] = useState(initial?.notes ?? "");

  useEffect(() => {
    if (open) {
      setMode(initial?.mode ?? "cook");
      setDishIds(initial?.dishIds ?? []);
      setRestaurantId(initial?.restaurantId);
      setItemIds(initial?.itemIds ?? []);
      setNotes(initial?.notes ?? "");
    }
  }, [open, initial]);

  const tags = new Set<MacroTag>();
  if (mode === "cook") {
    dishIds.forEach((id) => dishes.find((d) => d.id === id)?.tags.forEach((t) => tags.add(t)));
  } else if (restaurantId) {
    const r = restaurants.find((x) => x.id === restaurantId);
    itemIds.forEach((id) => r?.items.find((i) => i.id === id)?.tags.forEach((t) => tags.add(t)));
  }

  const canSave =
    (mode === "cook" && dishIds.length > 0) ||
    (mode === "takeout" && restaurantId && itemIds.length > 0);

  const save = () => {
    const meal: PlannedMeal =
      mode === "cook"
        ? { mode, dishIds, notes }
        : { mode, restaurantId, itemIds, notes };
    actions.setMeal(planKey, meal);
    onOpenChange(false);
  };

  const remove = () => {
    actions.setMeal(planKey, null);
    onOpenChange(false);
  };

  const restaurant = restaurants.find((r) => r.id === restaurantId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {dayLabel} · <span className="text-muted-foreground font-normal">{slotLabel}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl">
          <button
            onClick={() => setMode("cook")}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition ${
              mode === "cook" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
            }`}
          >
            <ChefHat className="h-4 w-4" /> Cook
          </button>
          <button
            onClick={() => setMode("takeout")}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition ${
              mode === "takeout" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
            }`}
          >
            <UtensilsCrossed className="h-4 w-4" /> Takeout
          </button>
        </div>

        {mode === "cook" ? (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Pick dishes
            </p>
            <div className="space-y-1.5">
              {dishes.map((d) => {
                const selected = dishIds.includes(d.id);
                return (
                  <button
                    key={d.id}
                    onClick={() =>
                      setDishIds((prev) =>
                        prev.includes(d.id) ? prev.filter((x) => x !== d.id) : [...prev, d.id],
                      )
                    }
                    className={`w-full text-left px-3 py-2.5 rounded-lg border transition ${
                      selected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{d.name}</span>
                      <div className="flex gap-1">
                        {d.tags.map((t) => (
                          <TagChip key={t} tag={t} small />
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Restaurant
              </p>
              <div className="grid grid-cols-2 gap-2">
                {restaurants.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      setRestaurantId(r.id);
                      setItemIds([]);
                    }}
                    className={`px-3 py-2 rounded-lg border text-left transition ${
                      restaurantId === r.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="text-sm font-medium">{r.name}</div>
                    <div className="text-[11px] text-muted-foreground">{r.cuisine}</div>
                  </button>
                ))}
              </div>
            </div>
            {restaurant && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Items
                </p>
                <div className="space-y-1.5">
                  {restaurant.items.map((i) => {
                    const selected = itemIds.includes(i.id);
                    return (
                      <button
                        key={i.id}
                        onClick={() =>
                          setItemIds((prev) =>
                            prev.includes(i.id) ? prev.filter((x) => x !== i.id) : [...prev, i.id],
                          )
                        }
                        className={`w-full text-left px-3 py-2 rounded-lg border transition ${
                          selected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm">{i.name}</span>
                          <div className="flex gap-1">
                            {i.tags.map((t) => (
                              <TagChip key={t} tag={t} small />
                            ))}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
            Balance
          </p>
          <div className="flex gap-1.5 flex-wrap">
            {(["protein", "veggie", "fruit"] as MacroTag[]).map((t) => (
              <TagChip key={t} tag={t} muted={!tags.has(t)} />
            ))}
          </div>
        </div>

        <Textarea
          placeholder="Notes (extra side, swap for kids...)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="resize-none"
          rows={2}
        />

        <DialogFooter className="flex-row gap-2 sm:justify-between">
          {initial ? (
            <Button variant="ghost" size="sm" onClick={remove} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-1" /> Remove
            </Button>
          ) : (
            <span />
          )}
          <Button onClick={save} disabled={!canSave}>
            Save meal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

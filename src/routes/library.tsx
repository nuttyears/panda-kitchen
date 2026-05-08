import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { TagChip } from "@/components/TagChip";
import { actions, useHydrate, useStore } from "@/lib/store";
import type { MacroTag } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Star, Home } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "Library — tabletop" },
      { name: "description", content: "Approved dishes and favorite takeout, all in one place." },
      { property: "og:title", content: "Dish & takeout library — tabletop" },
      { property: "og:description", content: "Build the family menu of trusted dinners and lunches." },
    ],
  }),
  component: LibraryPage,
});

function LibraryPage() {
  useHydrate();
  const [tab, setTab] = useState<"dishes" | "takeout">("dishes");
  const dishes = useStore((s) => s.dishes);
  const restaurants = useStore((s) => s.restaurants);

  return (
    <AppShell>
      <div className="mb-5">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Library</p>
        <h1 className="font-display text-4xl mt-1">What we love to eat</h1>
      </div>

      <div className="flex gap-1 p-1 bg-muted rounded-xl mb-4">
        {(["dishes", "takeout"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition ${
              tab === t ? "bg-card shadow-sm" : "text-muted-foreground"
            }`}
          >
            {t === "dishes" ? "Cooked dishes" : "Takeout"}
          </button>
        ))}
      </div>

      {tab === "dishes" ? (
        <div className="space-y-2">
          {dishes.map((d) => (
            <div key={d.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium">{d.name}</h3>
                    {d.kidApproved && (
                      <span className="tag-chip" style={{ background: "color-mix(in oklab, var(--fruit) 15%, transparent)", color: "var(--fruit)" }}>
                        <Star className="h-2.5 w-2.5" /> kid
                      </span>
                    )}
                    {d.homeSafe && (
                      <span className="tag-chip" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>
                        <Home className="h-2.5 w-2.5" /> home
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 flex gap-1 flex-wrap">
                    {(["protein", "veggie", "fruit"] as MacroTag[]).map((t) => (
                      <TagChip key={t} tag={t} small muted={!d.tags.includes(t)} />
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground line-clamp-1">
                    {d.ingredients.join(" · ")}
                  </p>
                </div>
                <button
                  onClick={() => actions.removeDish(d.id)}
                  className="text-muted-foreground hover:text-destructive p-1"
                  aria-label="Remove dish"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          <AddDishButton />
        </div>
      ) : (
        <div className="space-y-3">
          {restaurants.map((r) => (
            <div key={r.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-baseline justify-between mb-2">
                <h3 className="font-display text-lg">{r.name}</h3>
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  {r.cuisine}
                </span>
              </div>
              <ul className="space-y-1.5">
                {r.items.map((i) => (
                  <li key={i.id} className="flex items-center justify-between text-sm">
                    <span>{i.name}</span>
                    <div className="flex gap-1">
                      {i.tags.map((t) => (
                        <TagChip key={t} tag={t} small />
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}

function AddDishButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [tags, setTags] = useState<Set<MacroTag>>(new Set());
  const [kidApproved, setKidApproved] = useState(false);

  const toggle = (t: MacroTag) => {
    const next = new Set(tags);
    next.has(t) ? next.delete(t) : next.add(t);
    setTags(next);
  };

  const save = () => {
    if (!name.trim()) return;
    actions.addDish({
      id: crypto.randomUUID(),
      name: name.trim(),
      ingredients: ingredients
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      tags: Array.from(tags),
      kidApproved,
      homeSafe: true,
    });
    setName("");
    setIngredients("");
    setTags(new Set());
    setKidApproved(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full mt-2" variant="outline">
          <Plus className="h-4 w-4 mr-2" /> Add dish
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">New dish</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Dish name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input
            placeholder="Ingredients, comma-separated"
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
          />
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Covers</p>
            <div className="flex gap-2">
              {(["protein", "veggie", "fruit"] as MacroTag[]).map((t) => (
                <button
                  key={t}
                  onClick={() => toggle(t)}
                  className={`px-3 py-1.5 rounded-full border text-xs capitalize ${
                    tags.has(t) ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={kidApproved}
              onChange={(e) => setKidApproved(e.target.checked)}
            />
            Kid-approved
          </label>
        </div>
        <DialogFooter>
          <Button onClick={save}>Save dish</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

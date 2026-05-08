import { useEffect, useSyncExternalStore } from "react";
import type { Dish, GroceryItem, Restaurant, WeekPlan } from "./types";
import { seedDishes, seedRestaurants } from "./seed";

interface AppState {
  dishes: Dish[];
  restaurants: Restaurant[];
  plan: WeekPlan;
  groceryManual: GroceryItem[];
  groceryChecked: Record<string, boolean>;
  repeatThreshold: number;
}

const STORAGE_KEY = "mealplan-v1";

const defaultState: AppState = {
  dishes: seedDishes,
  restaurants: seedRestaurants,
  plan: {},
  groceryManual: [],
  groceryChecked: {},
  repeatThreshold: 2,
};

let state: AppState = loadState();
const listeners = new Set<() => void>();

function loadState(): AppState {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    return { ...defaultState, ...JSON.parse(raw) };
  } catch {
    return defaultState;
  }
}

function persist() {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function setState(updater: (s: AppState) => AppState) {
  state = updater(state);
  persist();
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useStore<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(defaultState),
  );
}

// Hydrate on client (SSR safety)
export function useHydrate() {
  useEffect(() => {
    state = loadState();
    listeners.forEach((l) => l());
  }, []);
}

// ---------- Date helpers ----------
export function startOfWeek(d = new Date()): Date {
  const date = new Date(d);
  const day = date.getDay(); // 0=Sun
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - day);
  return date;
}

export function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function planKey(weekStart: Date, dayIdx: number, slot: string): string {
  return `${isoDay(weekStart)}|${dayIdx}|${slot}`;
}

// ---------- Mutations ----------
export const actions = {
  setMeal(key: string, meal: import("./types").PlannedMeal | null) {
    setState((s) => {
      const plan = { ...s.plan };
      if (meal === null) delete plan[key];
      else plan[key] = meal;
      return { ...s, plan };
    });
  },
  addDish(d: Dish) {
    setState((s) => ({ ...s, dishes: [...s.dishes, d] }));
  },
  removeDish(id: string) {
    setState((s) => ({ ...s, dishes: s.dishes.filter((d) => d.id !== id) }));
  },
  addRestaurant(r: Restaurant) {
    setState((s) => ({ ...s, restaurants: [...s.restaurants, r] }));
  },
  toggleGrocery(name: string) {
    setState((s) => ({
      ...s,
      groceryChecked: { ...s.groceryChecked, [name]: !s.groceryChecked[name] },
    }));
  },
  addGroceryManual(name: string) {
    setState((s) => ({
      ...s,
      groceryManual: [
        ...s.groceryManual,
        { id: crypto.randomUUID(), name, checked: false, fromAuto: false },
      ],
    }));
  },
  clearGroceryChecked() {
    setState((s) => ({ ...s, groceryChecked: {} }));
  },
  setThreshold(n: number) {
    setState((s) => ({ ...s, repeatThreshold: n }));
  },
};

// ---------- Selectors ----------
export function getMealName(
  meal: import("./types").PlannedMeal,
  dishes: Dish[],
  restaurants: Restaurant[],
): string {
  if (meal.mode === "cook") {
    return (meal.dishIds ?? [])
      .map((id) => dishes.find((d) => d.id === id)?.name)
      .filter(Boolean)
      .join(" + ") || "Pick a dish";
  }
  const r = restaurants.find((x) => x.id === meal.restaurantId);
  if (!r) return "Pick takeout";
  const items = (meal.itemIds ?? [])
    .map((id) => r.items.find((i) => i.id === id)?.name)
    .filter(Boolean)
    .join(", ");
  return items ? `${r.name} — ${items}` : r.name;
}

export function getMealTags(
  meal: import("./types").PlannedMeal,
  dishes: Dish[],
  restaurants: Restaurant[],
): Set<string> {
  const tags = new Set<string>();
  if (meal.mode === "cook") {
    (meal.dishIds ?? []).forEach((id) => {
      dishes.find((d) => d.id === id)?.tags.forEach((t) => tags.add(t));
    });
  } else {
    const r = restaurants.find((x) => x.id === meal.restaurantId);
    (meal.itemIds ?? []).forEach((id) => {
      r?.items.find((i) => i.id === id)?.tags.forEach((t) => tags.add(t));
    });
  }
  return tags;
}

export function mealSignature(meal: import("./types").PlannedMeal): string {
  if (meal.mode === "cook") return "cook:" + (meal.dishIds ?? []).slice().sort().join(",");
  return "to:" + meal.restaurantId + ":" + (meal.itemIds ?? []).slice().sort().join(",");
}

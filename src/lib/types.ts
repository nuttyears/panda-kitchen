export type MacroTag = "protein" | "veggie" | "fruit";

export interface Dish {
  id: string;
  name: string;
  tags: MacroTag[];
  ingredients: string[];
  kidApproved: boolean;
  homeSafe: boolean;
  prepTime?: number;
}

export interface RestaurantItem {
  id: string;
  name: string;
  tags: MacroTag[];
  kidApproved?: boolean;
}

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  items: RestaurantItem[];
}

export type SlotKey = "lunch" | "dinner";

export interface PlannedMeal {
  mode: "cook" | "takeout";
  dishIds?: string[];
  restaurantId?: string;
  itemIds?: string[];
  notes?: string;
}

// key: `${weekStartIso}|${dayIndex}|${slot}` -> PlannedMeal
export type WeekPlan = Record<string, PlannedMeal>;

export interface GroceryItem {
  id: string;
  name: string;
  checked: boolean;
  fromAuto: boolean;
}

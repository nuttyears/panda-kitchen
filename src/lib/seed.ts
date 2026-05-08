import type { Dish, Restaurant } from "./types";

export const seedDishes: Dish[] = [
  {
    id: "d1",
    name: "Sheet-pan lemon chicken",
    tags: ["protein", "veggie"],
    ingredients: ["chicken thighs", "lemon", "broccoli", "olive oil", "garlic"],
    kidApproved: true,
    homeSafe: true,
    prepTime: 35,
  },
  {
    id: "d2",
    name: "Taco bowl night",
    tags: ["protein", "veggie"],
    ingredients: ["ground beef", "rice", "black beans", "lettuce", "salsa", "cheddar"],
    kidApproved: true,
    homeSafe: true,
    prepTime: 25,
  },
  {
    id: "d3",
    name: "Pesto pasta + peas",
    tags: ["veggie"],
    ingredients: ["fusilli", "pesto", "frozen peas", "parmesan"],
    kidApproved: true,
    homeSafe: true,
    prepTime: 20,
  },
  {
    id: "d4",
    name: "Salmon teriyaki + rice",
    tags: ["protein", "veggie"],
    ingredients: ["salmon fillet", "soy sauce", "mirin", "rice", "bok choy"],
    kidApproved: false,
    homeSafe: true,
    prepTime: 30,
  },
  {
    id: "d5",
    name: "Turkey sandwich lunch",
    tags: ["protein", "veggie", "fruit"],
    ingredients: ["bread", "turkey", "cheese", "carrots", "grapes"],
    kidApproved: true,
    homeSafe: true,
    prepTime: 10,
  },
  {
    id: "d6",
    name: "Quesadilla + cucumbers",
    tags: ["protein", "veggie"],
    ingredients: ["tortilla", "cheese", "cucumber", "orange"],
    kidApproved: true,
    homeSafe: true,
    prepTime: 10,
  },
  {
    id: "d7",
    name: "Veggie stir-fry tofu",
    tags: ["protein", "veggie"],
    ingredients: ["tofu", "bell pepper", "snap peas", "soy sauce", "rice"],
    kidApproved: false,
    homeSafe: true,
    prepTime: 25,
  },
  {
    id: "d8",
    name: "Berry yogurt parfait",
    tags: ["fruit", "protein"],
    ingredients: ["greek yogurt", "blueberries", "granola", "honey"],
    kidApproved: true,
    homeSafe: true,
    prepTime: 5,
  },
];

export const seedRestaurants: Restaurant[] = [
  {
    id: "r1",
    name: "Bangkok Garden",
    cuisine: "Thai",
    items: [
      { id: "r1i1", name: "Chicken lettuce wraps", tags: ["protein", "veggie"], kidApproved: true },
      { id: "r1i2", name: "Pad see ew", tags: ["protein", "veggie"] },
      { id: "r1i3", name: "Mango sticky rice", tags: ["fruit"] },
    ],
  },
  {
    id: "r2",
    name: "Tony's Pizza",
    cuisine: "Italian",
    items: [
      { id: "r2i1", name: "Margherita pie", tags: ["veggie"], kidApproved: true },
      { id: "r2i2", name: "Caesar salad", tags: ["veggie", "protein"] },
    ],
  },
  {
    id: "r3",
    name: "Green Bowl",
    cuisine: "Healthy",
    items: [
      { id: "r3i1", name: "Harvest grain bowl", tags: ["protein", "veggie", "fruit"] },
      { id: "r3i2", name: "Citrus salmon plate", tags: ["protein", "veggie", "fruit"] },
    ],
  },
];

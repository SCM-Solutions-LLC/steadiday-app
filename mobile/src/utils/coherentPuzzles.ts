/**
 * Predefined Coherent Puzzles for Daily Life Logic
 *
 * CRITICAL: Each puzzle is a SINGLE coherent unit where:
 * - Tasks, rules, and clues are pre-matched
 * - Clues give REASONING, not answers
 * - Every task mentioned in rules exists in the puzzle
 * - Every task mentioned in clues exists in the puzzle
 *
 * This eliminates:
 * - "undefined undefined" errors
 * - Clue/task/rule mismatches
 * - Unsolvable puzzles
 * - Meaningless time references
 */

import type { RuleType } from "./puzzleGenerator";

// =============================================================================
// TYPES
// =============================================================================

export interface CoherentTask {
  id: string;
  title: string;
  emoji: string;
}

export interface CoherentRule {
  type: RuleType;
  taskId: string;
  taskId2?: string; // For "before" and "not_adjacent" rules
  description: string;
  explanation: string;
  action: string;
}

export interface CoherentPuzzle {
  id: string;
  difficulty: "beginner" | "easy" | "medium" | "hard" | "expert";
  ruleTypes: RuleType[]; // Rule types used in this puzzle

  // Character
  character: {
    name: string;
    emoji: string;
    tagline: string;
  };

  // Story
  title: string;
  intro: string; // Simple setup, NO meaningless time

  // Tasks - EXACTLY what user can place
  tasks: CoherentTask[];

  // Clue - ONLY mentions tasks above, gives REASONING not answer
  clue: string;

  // Rules - match what clue explains
  rules: CoherentRule[];

  // Success message
  successMessage: string;
}

// =============================================================================
// TASK ID CONSTANTS - Prevents typos and mismatches
// =============================================================================

export const TASK_IDS = {
  // Morning routine
  WAKE_UP: "wake_up",
  COFFEE: "coffee",
  BREAKFAST: "breakfast",
  SHOWER: "shower",
  DRESS: "dress",
  TEETH: "teeth",
  EMAIL: "email",
  NEWSPAPER: "newspaper",
  DISHES: "dishes",

  // Errands
  BANK: "bank",
  GROCERIES: "groceries",
  HARDWARE: "hardware",
  LIBRARY: "library",
  PHARMACY: "pharmacy",
  POST_OFFICE: "post_office",
  GAS_STATION: "gas_station",
  COFFEE_SHOP: "coffee_shop",
  FARMERS_MARKET: "farmers_market",
  TOY_STORE: "toy_store",
  BAKERY: "bakery",
  DRY_CLEANING: "dry_cleaning",

  // Hosting/Events
  CLEAN_HOUSE: "clean_house",
  SHOP: "shop",
  COOK: "cook",
  SET_TABLE: "set_table",
  FLOWERS: "flowers",
  GET_READY: "get_ready",
  MUSIC: "music",
  DESSERT: "dessert",

  // Weekend/Relaxation
  BRUNCH: "brunch",
  EXERCISE: "exercise",
  NAP: "nap",
  READING: "reading",
  CALL_FAMILY: "call_family",
  GARDEN: "garden",
  LAUNDRY: "laundry",
  WATER_PLANTS: "water_plants",
  PULL_WEEDS: "pull_weeds",
  TEA: "tea",
  WALK_DOG: "walk_dog",
} as const;

// =============================================================================
// BEGINNER PUZZLES (4 tasks, 1 rule) - INCREASED DIFFICULTY
// =============================================================================

const BEGINNER_PUZZLES: CoherentPuzzle[] = [
  // PUZZLE 1: Bob's Coffee (4 tasks)
  {
    id: "bob_coffee",
    difficulty: "beginner",
    ruleTypes: ["first"],
    character: {
      name: "Bob",
      emoji: "👴",
      tagline: "Retired teacher who loves routine",
    },
    title: "Bob's Morning",
    intro: "Bob just woke up and has a few things to do.",
    tasks: [
      { id: TASK_IDS.COFFEE, title: "Make coffee", emoji: "☕" },
      { id: TASK_IDS.NEWSPAPER, title: "Get newspaper", emoji: "📰" },
      { id: TASK_IDS.BREAKFAST, title: "Eat breakfast", emoji: "🍳" },
      { id: TASK_IDS.DISHES, title: "Wash dishes", emoji: "🍽️" },
    ],
    clue:
      "Bob is NOT a morning person. He stumbles around like a zombie until caffeine kicks in. His family knows not to talk to him before his first cup!",
    rules: [
      {
        type: "first",
        taskId: TASK_IDS.COFFEE,
        description: "☕ Coffee is first",
        explanation: "Bob cannot function without his morning coffee!",
        action: "Put Coffee in slot 1",
      },
    ],
    successMessage:
      "Perfect start! Bob's coffee gave him the energy for a great morning.",
  },

  // PUZZLE 2: Helen's Pharmacy (4 tasks)
  {
    id: "helen_pharmacy",
    difficulty: "beginner",
    ruleTypes: ["last"],
    character: {
      name: "Helen",
      emoji: "👩‍💼",
      tagline: "Busy office manager",
    },
    title: "Helen's Lunch Errands",
    intro: "Helen needs to run a few errands during her break.",
    tasks: [
      { id: TASK_IDS.HARDWARE, title: "Hardware store", emoji: "🔧" },
      { id: TASK_IDS.LIBRARY, title: "Library", emoji: "📚" },
      { id: TASK_IDS.DRY_CLEANING, title: "Dry cleaner", emoji: "👔" },
      { id: TASK_IDS.PHARMACY, title: "Pharmacy", emoji: "💊" },
    ],
    clue:
      "Helen's office is right next to the pharmacy. She can pop in there right before heading back to work - it is the closest stop to her office!",
    rules: [
      {
        type: "last",
        taskId: TASK_IDS.PHARMACY,
        description: "💊 Pharmacy is last",
        explanation: "It is closest to the office - stop there on the way back",
        action: "Put Pharmacy in slot 4",
      },
    ],
    successMessage:
      "Great planning! Helen finished her errands and got back to work on time.",
  },

  // PUZZLE 3: Margaret's Tea (4 tasks)
  {
    id: "margaret_tea",
    difficulty: "beginner",
    ruleTypes: ["last"],
    character: {
      name: "Margaret",
      emoji: "👵",
      tagline: "Active grandma who loves gardening",
    },
    title: "Margaret's Garden Morning",
    intro: "Margaret wants to spend time in her garden today.",
    tasks: [
      { id: TASK_IDS.WATER_PLANTS, title: "Water plants", emoji: "🌱" },
      { id: TASK_IDS.PULL_WEEDS, title: "Pull weeds", emoji: "🌿" },
      { id: TASK_IDS.FLOWERS, title: "Prune roses", emoji: "🌹" },
      { id: TASK_IDS.TEA, title: "Enjoy tea", emoji: "🍵" },
    ],
    clue:
      "Gardening is hard work! Margaret always rewards herself with a relaxing cup of tea after she has finished all the outdoor chores.",
    rules: [
      {
        type: "last",
        taskId: TASK_IDS.TEA,
        description: "🍵 Tea is last",
        explanation: "It is Margaret's reward after gardening",
        action: "Put Tea in slot 4",
      },
    ],
    successMessage:
      "Lovely! Margaret's garden looks beautiful and she is enjoying her well-deserved tea.",
  },

  // PUZZLE 4: Frank's Bank (4 tasks)
  {
    id: "frank_bank",
    difficulty: "beginner",
    ruleTypes: ["first"],
    character: {
      name: "Frank",
      emoji: "👴",
      tagline: "Retired engineer, loves his grandkids",
    },
    title: "Frank's Saturday Errands",
    intro: "Frank has some errands before the grandkids visit.",
    tasks: [
      { id: TASK_IDS.BANK, title: "Bank", emoji: "🏦" },
      { id: TASK_IDS.HARDWARE, title: "Hardware store", emoji: "🔧" },
      { id: TASK_IDS.FARMERS_MARKET, title: "Farmers market", emoji: "🥕" },
      { id: TASK_IDS.TOY_STORE, title: "Toy store", emoji: "🧸" },
    ],
    clue:
      "Frank wants to buy fresh vegetables at the farmers market, but they only accept cash. His wallet is completely empty right now!",
    rules: [
      {
        type: "first",
        taskId: TASK_IDS.BANK,
        description: "🏦 Bank is first",
        explanation: "Need cash for the farmers market!",
        action: "Put Bank in slot 1",
      },
    ],
    successMessage: "Smart planning! Frank had cash ready for his shopping.",
  },

  // PUZZLE 5: Linda's Groceries
  {
    id: "linda_groceries",
    difficulty: "beginner",
    ruleTypes: ["last"],
    character: {
      name: "Linda",
      emoji: "👩",
      tagline: "Frank's wife, organized planner",
    },
    title: "Linda's Shopping Trip",
    intro: "Linda has several stops to make today.",
    tasks: [
      { id: TASK_IDS.LIBRARY, title: "Library", emoji: "📚" },
      { id: TASK_IDS.POST_OFFICE, title: "Post office", emoji: "📮" },
      { id: TASK_IDS.GROCERIES, title: "Groceries", emoji: "🛒" },
    ],
    clue:
      "Linda is buying ice cream and frozen pizzas for movie night with the grandkids. It is a hot summer day - 90 degrees outside!",
    rules: [
      {
        type: "last",
        taskId: TASK_IDS.GROCERIES,
        description: "🛒 Groceries is last",
        explanation: "Frozen items will melt in the heat!",
        action: "Put Groceries in slot 3",
      },
    ],
    successMessage:
      "Perfect! Linda got home and the ice cream was still frozen.",
  },

  // PUZZLE 6: Bob's Wake Up
  {
    id: "bob_wake",
    difficulty: "beginner",
    ruleTypes: ["first"],
    character: {
      name: "Bob",
      emoji: "👴",
      tagline: "Retired teacher who loves routine",
    },
    title: "Bob's Start",
    intro: "Bob has his usual morning routine.",
    tasks: [
      { id: TASK_IDS.WAKE_UP, title: "Wake up", emoji: "⏰" },
      { id: TASK_IDS.SHOWER, title: "Shower", emoji: "🚿" },
      { id: TASK_IDS.DRESS, title: "Get dressed", emoji: "👔" },
    ],
    clue:
      "Bob is still in bed under the warm covers. Obviously, he cannot do anything else while he is asleep!",
    rules: [
      {
        type: "first",
        taskId: TASK_IDS.WAKE_UP,
        description: "⏰ Wake up is first",
        explanation: "Cannot do anything while sleeping!",
        action: "Put Wake up in slot 1",
      },
    ],
    successMessage: "Bob is up and ready for the day!",
  },
];

// =============================================================================
// EASY PUZZLES (3 tasks, 2 rules)
// =============================================================================

const EASY_PUZZLES: CoherentPuzzle[] = [
  // PUZZLE 1: Frank's Full Morning
  {
    id: "frank_full_errands",
    difficulty: "easy",
    ruleTypes: ["first", "last"],
    character: {
      name: "Frank",
      emoji: "👴",
      tagline: "Retired engineer, loves his grandkids",
    },
    title: "Frank's Busy Morning",
    intro: "Frank has a full morning of errands planned.",
    tasks: [
      { id: TASK_IDS.BANK, title: "Bank", emoji: "🏦" },
      { id: TASK_IDS.BAKERY, title: "Bakery", emoji: "🥐" },
      { id: TASK_IDS.GROCERIES, title: "Groceries", emoji: "🛒" },
    ],
    clue:
      "Frank needs cash for the bakery - they do not take cards. And he is buying ice cream at the grocery store, so that needs to be his last stop before heading home!",
    rules: [
      {
        type: "first",
        taskId: TASK_IDS.BANK,
        description: "🏦 Bank is first",
        explanation: "Need cash for the bakery",
        action: "Put Bank in slot 1",
      },
      {
        type: "last",
        taskId: TASK_IDS.GROCERIES,
        description: "🛒 Groceries is last",
        explanation: "Ice cream will melt!",
        action: "Put Groceries in slot 3",
      },
    ],
    successMessage:
      "All done! Frank had cash for the bakery and the ice cream stayed frozen.",
  },

  // PUZZLE 2: Bob's Morning Routine
  {
    id: "bob_morning_easy",
    difficulty: "easy",
    ruleTypes: ["first", "before"],
    character: {
      name: "Bob",
      emoji: "👴",
      tagline: "Retired teacher who loves routine",
    },
    title: "Bob's Morning Routine",
    intro: "Bob needs to get ready for a busy day.",
    tasks: [
      { id: TASK_IDS.WAKE_UP, title: "Wake up", emoji: "⏰" },
      { id: TASK_IDS.SHOWER, title: "Shower", emoji: "🚿" },
      { id: TASK_IDS.DRESS, title: "Get dressed", emoji: "👔" },
    ],
    clue:
      "Bob is still in bed! Nothing can happen until he gets up. Also, he needs to dry off from his shower before putting on his nice clothes.",
    rules: [
      {
        type: "first",
        taskId: TASK_IDS.WAKE_UP,
        description: "⏰ Wake up is first",
        explanation: "Cannot do anything while sleeping!",
        action: "Put Wake up in slot 1",
      },
      {
        type: "before",
        taskId: TASK_IDS.SHOWER,
        taskId2: TASK_IDS.DRESS,
        description: "🚿 Shower before 👔 Get dressed",
        explanation: "Need to dry off before putting on clothes",
        action: "Put Shower before Get dressed",
      },
    ],
    successMessage: "Great routine! Bob is clean, dressed, and ready to go!",
  },

  // PUZZLE 3: Margaret's Prep
  {
    id: "margaret_prep",
    difficulty: "easy",
    ruleTypes: ["before", "last"],
    character: {
      name: "Margaret",
      emoji: "👵",
      tagline: "Active grandma who loves gardening",
    },
    title: "Margaret's Book Club Prep",
    intro: "Margaret is hosting book club this afternoon!",
    tasks: [
      { id: TASK_IDS.SHOP, title: "Buy groceries", emoji: "🛒" },
      { id: TASK_IDS.SET_TABLE, title: "Set table", emoji: "🍽️" },
      { id: TASK_IDS.GET_READY, title: "Get ready", emoji: "✨" },
    ],
    clue:
      "Margaret will be carrying heavy bags and arranging dishes - messy work! She does not want to wrinkle or stain her nice dress before the guests arrive. But she needs the groceries before she can set the table with snacks!",
    rules: [
      {
        type: "before",
        taskId: TASK_IDS.SHOP,
        taskId2: TASK_IDS.SET_TABLE,
        description: "🛒 Shop before 🍽️ Set table",
        explanation: "Need the snacks before setting up!",
        action: "Put Shop before Set table",
      },
      {
        type: "last",
        taskId: TASK_IDS.GET_READY,
        description: "✨ Get ready is last",
        explanation: "Keep the nice outfit clean!",
        action: "Put Get ready in slot 3",
      },
    ],
    successMessage:
      "The book club was a hit! Margaret looked lovely and the snacks were delicious.",
  },

  // PUZZLE 4: Helen's Quick Trip
  {
    id: "helen_quick",
    difficulty: "easy",
    ruleTypes: ["before", "last"],
    character: {
      name: "Helen",
      emoji: "👩‍💼",
      tagline: "Busy office manager",
    },
    title: "Helen's Lunch Break",
    intro: "Helen has a short lunch break for errands.",
    tasks: [
      { id: TASK_IDS.PHARMACY, title: "Pharmacy", emoji: "💊" },
      { id: TASK_IDS.LIBRARY, title: "Library", emoji: "📚" },
      { id: TASK_IDS.GROCERIES, title: "Groceries", emoji: "🛒" },
    ],
    clue:
      "The pharmacy is inside the grocery store lobby, so Helen will naturally stop there first when she arrives at the store. She is also buying frozen yogurt - perfect for a hot day, but it needs to stay cold!",
    rules: [
      {
        type: "before",
        taskId: TASK_IDS.PHARMACY,
        taskId2: TASK_IDS.GROCERIES,
        description: "💊 Pharmacy before 🛒 Groceries",
        explanation: "Pharmacy is in the store lobby",
        action: "Put Pharmacy before Groceries",
      },
      {
        type: "last",
        taskId: TASK_IDS.GROCERIES,
        description: "🛒 Groceries is last",
        explanation: "Frozen yogurt will melt!",
        action: "Put Groceries in slot 3",
      },
    ],
    successMessage:
      "Helen got everything done and made it back to work with time to spare!",
  },
];

// =============================================================================
// MEDIUM PUZZLES (4 tasks, 2-3 rules)
// =============================================================================

const MEDIUM_PUZZLES: CoherentPuzzle[] = [
  // PUZZLE 1: Bob's Full Morning
  {
    id: "bob_full_morning",
    difficulty: "medium",
    ruleTypes: ["first", "before"],
    character: {
      name: "Bob",
      emoji: "👴",
      tagline: "Retired teacher who loves routine",
    },
    title: "Bob's Complete Morning",
    intro: "Bob has his usual morning routine to complete.",
    tasks: [
      { id: TASK_IDS.COFFEE, title: "Make coffee", emoji: "☕" },
      { id: TASK_IDS.SHOWER, title: "Take shower", emoji: "🚿" },
      { id: TASK_IDS.BREAKFAST, title: "Eat breakfast", emoji: "🍳" },
      { id: TASK_IDS.WALK_DOG, title: "Walk the dog", emoji: "🐕" },
    ],
    clue:
      "Bob is useless before caffeine - coffee is always first! His dog Max gets excited after breakfast (he knows scraps are coming!), so the walk comes after eating. And Bob likes to shower before his walk so he is fresh when he meets the neighbors.",
    rules: [
      {
        type: "first",
        taskId: TASK_IDS.COFFEE,
        description: "☕ Coffee is first",
        explanation: "Bob cannot function without it!",
        action: "Put Coffee in slot 1",
      },
      {
        type: "before",
        taskId: TASK_IDS.BREAKFAST,
        taskId2: TASK_IDS.WALK_DOG,
        description: "🍳 Breakfast before 🐕 Walk",
        explanation: "Max expects scraps after Bob eats!",
        action: "Put Breakfast before Walk the dog",
      },
      {
        type: "before",
        taskId: TASK_IDS.SHOWER,
        taskId2: TASK_IDS.WALK_DOG,
        description: "🚿 Shower before 🐕 Walk",
        explanation: "Bob wants to look fresh for neighbors",
        action: "Put Shower before Walk the dog",
      },
    ],
    successMessage:
      "Great routine! Bob started with coffee, got ready, had breakfast, and took Max for a nice walk.",
  },

  // PUZZLE 2: Margaret's Hosting
  {
    id: "margaret_hosting",
    difficulty: "medium",
    ruleTypes: ["first", "before", "last"],
    character: {
      name: "Margaret",
      emoji: "👵",
      tagline: "Active grandma who loves gardening",
    },
    title: "Margaret's Dinner Party",
    intro: "Margaret is hosting dinner for old friends!",
    tasks: [
      { id: TASK_IDS.CLEAN_HOUSE, title: "Clean house", emoji: "🧹" },
      { id: TASK_IDS.SHOP, title: "Buy groceries", emoji: "🛒" },
      { id: TASK_IDS.COOK, title: "Cook dinner", emoji: "👨‍🍳" },
      { id: TASK_IDS.GET_READY, title: "Get ready", emoji: "✨" },
    ],
    clue:
      "Margaret always starts by cleaning - guests should arrive to a tidy home! She needs ingredients before she can cook anything. And she is making a messy beef stew that splatters, so she will change into her nice outfit after all the cooking is done.",
    rules: [
      {
        type: "first",
        taskId: TASK_IDS.CLEAN_HOUSE,
        description: "🧹 Clean house is first",
        explanation: "Start with a clean home for guests",
        action: "Put Clean house in slot 1",
      },
      {
        type: "before",
        taskId: TASK_IDS.SHOP,
        taskId2: TASK_IDS.COOK,
        description: "🛒 Shop before 👨‍🍳 Cook",
        explanation: "Need ingredients before cooking!",
        action: "Put Shop before Cook",
      },
      {
        type: "last",
        taskId: TASK_IDS.GET_READY,
        description: "✨ Get ready is last",
        explanation: "Keep outfit clean from cooking splatter!",
        action: "Put Get ready in slot 4",
      },
    ],
    successMessage:
      "What a wonderful evening! The friends laughed and reminisced for hours!",
  },

  // PUZZLE 3: Frank & Linda Weekend
  {
    id: "frank_linda_weekend",
    difficulty: "medium",
    ruleTypes: ["first", "before", "last"],
    character: {
      name: "Frank & Linda",
      emoji: "👫",
      tagline: "Retired couple enjoying life",
    },
    title: "Productive Saturday",
    intro: "Frank and Linda have a productive day planned.",
    tasks: [
      { id: TASK_IDS.BRUNCH, title: "Brunch", emoji: "🥞" },
      { id: TASK_IDS.CLEAN_HOUSE, title: "Clean house", emoji: "🧹" },
      { id: TASK_IDS.GARDEN, title: "Gardening", emoji: "🌱" },
      { id: TASK_IDS.CALL_FAMILY, title: "Call family", emoji: "📞" },
    ],
    clue:
      "They always start the weekend with a nice brunch for energy! They clean indoors while it is still cool, then head outside to the garden. They end every Saturday with a family phone call to catch up with the grandkids.",
    rules: [
      {
        type: "first",
        taskId: TASK_IDS.BRUNCH,
        description: "🥞 Brunch is first",
        explanation: "Weekend fuel to start the day!",
        action: "Put Brunch in slot 1",
      },
      {
        type: "before",
        taskId: TASK_IDS.CLEAN_HOUSE,
        taskId2: TASK_IDS.GARDEN,
        description: "🧹 Clean before 🌱 Garden",
        explanation: "Indoor chores while it is cool",
        action: "Put Clean house before Gardening",
      },
      {
        type: "last",
        taskId: TASK_IDS.CALL_FAMILY,
        description: "📞 Call family is last",
        explanation: "End the day catching up with grandkids",
        action: "Put Call family in slot 4",
      },
    ],
    successMessage:
      "What a productive Saturday! Frank and Linda feel great about Sunday.",
  },
];

// =============================================================================
// HARD PUZZLES (4-5 tasks, 3-4 rules including not_adjacent)
// =============================================================================

const HARD_PUZZLES: CoherentPuzzle[] = [
  // PUZZLE 1: Helen's Busy Afternoon
  {
    id: "helen_busy_afternoon",
    difficulty: "hard",
    ruleTypes: ["first", "before", "not_adjacent", "last"],
    character: {
      name: "Helen",
      emoji: "👩‍💼",
      tagline: "Busy office manager",
    },
    title: "Helen's Busy Afternoon",
    intro: "Helen has lots of errands to run.",
    tasks: [
      { id: TASK_IDS.BANK, title: "Bank", emoji: "🏦" },
      { id: TASK_IDS.GAS_STATION, title: "Gas station", emoji: "⛽" },
      { id: TASK_IDS.COFFEE_SHOP, title: "Coffee shop", emoji: "☕" },
      { id: TASK_IDS.PHARMACY, title: "Pharmacy", emoji: "💊" },
      { id: TASK_IDS.GROCERIES, title: "Groceries", emoji: "🛒" },
    ],
    clue:
      "The bank closes early on Saturdays, so Helen goes there first! The pharmacy is at the grocery store entrance, so she stops there right before getting groceries. The gas station and coffee shop are on opposite sides of town - no point going back and forth! And groceries are last because of frozen items.",
    rules: [
      {
        type: "first",
        taskId: TASK_IDS.BANK,
        description: "🏦 Bank is first",
        explanation: "Bank closes early on Saturdays!",
        action: "Put Bank in slot 1",
      },
      {
        type: "before",
        taskId: TASK_IDS.PHARMACY,
        taskId2: TASK_IDS.GROCERIES,
        description: "💊 Pharmacy before 🛒 Groceries",
        explanation: "Pharmacy is at the grocery store entrance",
        action: "Put Pharmacy before Groceries",
      },
      {
        type: "not_adjacent",
        taskId: TASK_IDS.GAS_STATION,
        taskId2: TASK_IDS.COFFEE_SHOP,
        description: "⛽ Gas and ☕ Coffee not together",
        explanation: "They are on opposite sides of town!",
        action: "Put at least one task between them",
      },
      {
        type: "last",
        taskId: TASK_IDS.GROCERIES,
        description: "🛒 Groceries is last",
        explanation: "Frozen items need to go straight home",
        action: "Put Groceries in slot 5",
      },
    ],
    successMessage:
      "Helen got everything done and made it to her son's soccer practice on time!",
  },

  // PUZZLE 2: Bob's Active Day
  {
    id: "bob_active_day",
    difficulty: "hard",
    ruleTypes: ["first", "before", "not_adjacent", "last"],
    character: {
      name: "Bob",
      emoji: "👴",
      tagline: "Retired teacher who loves routine",
    },
    title: "Bob's Active Weekend",
    intro: "Bob has a full Saturday planned.",
    tasks: [
      { id: TASK_IDS.BRUNCH, title: "Brunch", emoji: "🥞" },
      { id: TASK_IDS.EXERCISE, title: "Exercise", emoji: "🏃" },
      { id: TASK_IDS.LAUNDRY, title: "Laundry", emoji: "🧺" },
      { id: TASK_IDS.NAP, title: "Afternoon nap", emoji: "😴" },
      { id: TASK_IDS.READING, title: "Reading", emoji: "📖" },
    ],
    clue:
      "Bob always starts weekends with brunch for energy! He exercises before his nap - you have to earn your rest! But he should not exercise right before napping - he needs time to cool down first. Reading is his perfect evening wind-down.",
    rules: [
      {
        type: "first",
        taskId: TASK_IDS.BRUNCH,
        description: "🥞 Brunch is first",
        explanation: "Weekend fuel to start the day!",
        action: "Put Brunch in slot 1",
      },
      {
        type: "before",
        taskId: TASK_IDS.EXERCISE,
        taskId2: TASK_IDS.NAP,
        description: "🏃 Exercise before 😴 Nap",
        explanation: "Earn your rest with activity first!",
        action: "Put Exercise before Nap",
      },
      {
        type: "not_adjacent",
        taskId: TASK_IDS.EXERCISE,
        taskId2: TASK_IDS.NAP,
        description: "🏃 Exercise and 😴 Nap not together",
        explanation: "Need time to cool down after exercise",
        action: "Put at least one task between them",
      },
      {
        type: "last",
        taskId: TASK_IDS.READING,
        description: "📖 Reading is last",
        explanation: "Perfect way to wind down the evening",
        action: "Put Reading in slot 5",
      },
    ],
    successMessage:
      "What a great Saturday! Bob feels relaxed and ready for Sunday.",
  },

  // PUZZLE 3: Margaret's Full Day
  {
    id: "margaret_full_day",
    difficulty: "hard",
    ruleTypes: ["first", "before", "not_adjacent", "last"],
    character: {
      name: "Margaret",
      emoji: "👵",
      tagline: "Active grandma who loves gardening",
    },
    title: "Margaret's Garden Party",
    intro: "Margaret is hosting a garden party!",
    tasks: [
      { id: TASK_IDS.CLEAN_HOUSE, title: "Clean house", emoji: "🧹" },
      { id: TASK_IDS.GARDEN, title: "Gardening", emoji: "🌱" },
      { id: TASK_IDS.SHOP, title: "Buy supplies", emoji: "🛒" },
      { id: TASK_IDS.COOK, title: "Cook food", emoji: "👨‍🍳" },
      { id: TASK_IDS.GET_READY, title: "Get ready", emoji: "✨" },
    ],
    clue:
      "Margaret always starts with cleaning - a tidy home for guests! She needs supplies before she can cook. Gardening is dirty work and cooking is messy - she should not do them back to back or she will track dirt into the kitchen! She gets dressed last to stay clean.",
    rules: [
      {
        type: "first",
        taskId: TASK_IDS.CLEAN_HOUSE,
        description: "🧹 Clean house is first",
        explanation: "Start with a tidy home",
        action: "Put Clean house in slot 1",
      },
      {
        type: "before",
        taskId: TASK_IDS.SHOP,
        taskId2: TASK_IDS.COOK,
        description: "🛒 Shop before 👨‍🍳 Cook",
        explanation: "Need ingredients before cooking",
        action: "Put Shop before Cook",
      },
      {
        type: "not_adjacent",
        taskId: TASK_IDS.GARDEN,
        taskId2: TASK_IDS.COOK,
        description: "🌱 Garden and 👨‍🍳 Cook not together",
        explanation: "Do not track dirt into the kitchen!",
        action: "Put at least one task between them",
      },
      {
        type: "last",
        taskId: TASK_IDS.GET_READY,
        description: "✨ Get ready is last",
        explanation: "Stay clean for the party!",
        action: "Put Get ready in slot 5",
      },
    ],
    successMessage:
      "The garden party was a wonderful success! Everyone loved Margaret's cooking.",
  },
];

// =============================================================================
// EXPERT PUZZLES (5-6 tasks, 4-5 rules)
// =============================================================================

const EXPERT_PUZZLES: CoherentPuzzle[] = [
  // PUZZLE 1: Frank & Linda's Big Day
  {
    id: "frank_linda_big_day",
    difficulty: "expert",
    ruleTypes: ["first", "before", "not_adjacent", "last"],
    character: {
      name: "Frank & Linda",
      emoji: "👫",
      tagline: "Retired couple enjoying life",
    },
    title: "Big Family Visit",
    intro: "The grandkids are coming for a whole week!",
    tasks: [
      { id: TASK_IDS.BANK, title: "Bank", emoji: "🏦" },
      { id: TASK_IDS.TOY_STORE, title: "Toy store", emoji: "🧸" },
      { id: TASK_IDS.BAKERY, title: "Bakery", emoji: "🥐" },
      { id: TASK_IDS.CLEAN_HOUSE, title: "Clean house", emoji: "🧹" },
      { id: TASK_IDS.GROCERIES, title: "Groceries", emoji: "🛒" },
      { id: TASK_IDS.COOK, title: "Cook dinner", emoji: "👨‍🍳" },
    ],
    clue:
      "Frank needs cash first - the toy store only takes cash for big purchases! The bakery cake needs to stay fresh, so get it before groceries but not right after bank (it is across town). They shop before cooking. Cleaning happens before guests arrive (obviously!). Groceries last because of ice cream!",
    rules: [
      {
        type: "first",
        taskId: TASK_IDS.BANK,
        description: "🏦 Bank is first",
        explanation: "Toy store only takes cash!",
        action: "Put Bank in slot 1",
      },
      {
        type: "before",
        taskId: TASK_IDS.TOY_STORE,
        taskId2: TASK_IDS.BAKERY,
        description: "🧸 Toys before 🥐 Bakery",
        explanation: "Big purchase first, then treat",
        action: "Put Toy store before Bakery",
      },
      {
        type: "not_adjacent",
        taskId: TASK_IDS.BANK,
        taskId2: TASK_IDS.BAKERY,
        description: "🏦 Bank and 🥐 Bakery not together",
        explanation: "They are across town from each other",
        action: "Put at least one task between them",
      },
      {
        type: "before",
        taskId: TASK_IDS.GROCERIES,
        taskId2: TASK_IDS.COOK,
        description: "🛒 Groceries before 👨‍🍳 Cook",
        explanation: "Need ingredients to cook!",
        action: "Put Groceries before Cook",
      },
      {
        type: "last",
        taskId: TASK_IDS.COOK,
        description: "👨‍🍳 Cook is last",
        explanation: "Fresh hot dinner for the grandkids!",
        action: "Put Cook in slot 6",
      },
    ],
    successMessage:
      "The grandkids arrived to a clean house, toys, cake, and a delicious dinner!",
  },
];

// =============================================================================
// ALL PUZZLES COMBINED
// =============================================================================

export const ALL_COHERENT_PUZZLES: CoherentPuzzle[] = [
  ...BEGINNER_PUZZLES,
  ...EASY_PUZZLES,
  ...MEDIUM_PUZZLES,
  ...HARD_PUZZLES,
  ...EXPERT_PUZZLES,
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get puzzles filtered by difficulty
 */
export function getPuzzlesByDifficulty(
  difficulty: CoherentPuzzle["difficulty"]
): CoherentPuzzle[] {
  return ALL_COHERENT_PUZZLES.filter((p) => p.difficulty === difficulty);
}

/**
 * Get puzzles that only use specific rule types
 */
export function getPuzzlesByRuleTypes(
  allowedTypes: RuleType[]
): CoherentPuzzle[] {
  return ALL_COHERENT_PUZZLES.filter((puzzle) =>
    puzzle.ruleTypes.every((type) => allowedTypes.includes(type))
  );
}

/**
 * Get a random puzzle matching criteria
 */
export function getRandomPuzzle(
  difficulty?: CoherentPuzzle["difficulty"],
  allowedRuleTypes?: RuleType[],
  seed?: number
): CoherentPuzzle {
  let candidates = [...ALL_COHERENT_PUZZLES];

  if (difficulty) {
    candidates = candidates.filter((p) => p.difficulty === difficulty);
  }

  if (allowedRuleTypes) {
    candidates = candidates.filter((puzzle) =>
      puzzle.ruleTypes.every((type) => allowedRuleTypes.includes(type))
    );
  }

  // Fallback to any puzzle if no matches
  if (candidates.length === 0) {
    candidates = [...ALL_COHERENT_PUZZLES];
  }

  // Use seed for deterministic selection
  const index = seed
    ? Math.abs(seed) % candidates.length
    : Math.floor(Math.random() * candidates.length);

  return candidates[index];
}

/**
 * Validate a coherent puzzle (for development/testing)
 */
export function validateCoherentPuzzle(puzzle: CoherentPuzzle): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const taskIds = new Set(puzzle.tasks.map((t) => t.id));

  // Check that all rules reference existing tasks
  for (const rule of puzzle.rules) {
    if (!taskIds.has(rule.taskId)) {
      errors.push(
        `Rule "${rule.description}" references non-existent task: ${rule.taskId}`
      );
    }
    if (rule.taskId2 && !taskIds.has(rule.taskId2)) {
      errors.push(
        `Rule "${rule.description}" references non-existent task: ${rule.taskId2}`
      );
    }
  }

  // Check that puzzle has at least 1 rule
  if (puzzle.rules.length === 0) {
    errors.push("Puzzle has 0 rules - impossible to solve logically!");
  }

  // Check clue does not directly state the answer
  const clueLower = puzzle.clue.toLowerCase();
  const answerPhrases = [
    "should be first",
    "should be last",
    "must be first",
    "must be last",
    "goes first",
    "goes last",
    "is first",
    "is last",
    "put .* first",
    "put .* last",
  ];

  for (const phrase of answerPhrases) {
    const regex = new RegExp(phrase);
    if (regex.test(clueLower)) {
      errors.push(`Clue may state answer directly with phrase: "${phrase}"`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate all puzzles in the database
 */
export function validateAllPuzzles(): {
  totalPuzzles: number;
  validPuzzles: number;
  invalidPuzzles: { id: string; errors: string[] }[];
} {
  const invalid: { id: string; errors: string[] }[] = [];

  for (const puzzle of ALL_COHERENT_PUZZLES) {
    const result = validateCoherentPuzzle(puzzle);
    if (!result.valid) {
      invalid.push({ id: puzzle.id, errors: result.errors });
    }
  }

  return {
    totalPuzzles: ALL_COHERENT_PUZZLES.length,
    validPuzzles: ALL_COHERENT_PUZZLES.length - invalid.length,
    invalidPuzzles: invalid,
  };
}

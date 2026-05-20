/**
 * Story-Based Puzzle Generator for Daily Life Logic
 *
 * Features:
 * - Named characters users can relate to (Bob, Margaret, Helen, Frank & Linda)
 * - Story scenarios that explain WHY tasks are ordered
 * - Clear ordering rules: FIRST, LAST, BEFORE, NOT_ADJACENT
 * - Progressive difficulty based on user level
 * - Bug fixes: Required tasks always included, proper error messages
 *
 * CRITICAL FIX: Now uses predefined coherent puzzles to ensure:
 * - Tasks, rules, and clues are always matched
 * - No "undefined undefined" errors
 * - No unsolvable puzzles
 * - Clues give reasoning, not answers
 */

import {
  type DifficultyConfig,
  getDifficultyConfigByPuzzlesCompleted,
} from "./difficultyConfig";
import {
  ALL_COHERENT_PUZZLES,
  type CoherentPuzzle,
  type CoherentRule,
  type CoherentTask,
  getPuzzlesByRuleTypes,
  validateCoherentPuzzle,
} from "./coherentPuzzles";
import { logger } from "./logger";

// =============================================================================
// TYPES
// =============================================================================

export interface PuzzleTask {
  id: string;
  title: string;
  emoji: string;
  story?: string; // Story context for this task
}

export type RuleType = "first" | "last" | "before" | "not_adjacent";

export interface PuzzleRule {
  type: RuleType;
  description: string; // Human-readable rule
  explanation: string; // WHY this rule exists (helps user reason)
  action?: string; // Clear action instruction (e.g., "Put Coffee in slot 1")
  involvedTasks: string[]; // Task IDs involved
}

export interface PuzzleStage {
  stageNumber: number;
  rules: PuzzleRule[]; // Rules active for this stage (cumulative)
  intro?: string; // Story intro for this stage
}

export interface Character {
  id: string;
  name: string;
  emoji: string;
  age: number;
  tagline: string;
}

export interface DailyPuzzle {
  id: string;
  date: string;
  title: string;
  subtitle: string;
  tasks: PuzzleTask[];
  rules: PuzzleRule[];
  totalStages: number;
  stages: PuzzleStage[];
  // Story elements
  character?: Character;
  scenario?: string;
  context?: string;
  storyClue?: string; // Logical clue that helps user DEDUCE the answer
  successMessage?: string;
}

export interface ValidationResult {
  isValid: boolean;
  failedRule?: PuzzleRule;
  message?: string;
}

// =============================================================================
// CHARACTERS - Relatable people users help plan for
// =============================================================================

const CHARACTERS: Record<string, Character> = {
  bob: {
    id: "bob",
    name: "Bob",
    emoji: "👴",
    age: 68,
    tagline: "Retired teacher who loves routine",
  },
  margaret: {
    id: "margaret",
    name: "Margaret",
    emoji: "👵",
    age: 72,
    tagline: "Active grandma who loves gardening",
  },
  helen: {
    id: "helen",
    name: "Helen",
    emoji: "👩‍💼",
    age: 58,
    tagline: "Busy office manager",
  },
  frank_linda: {
    id: "frank_linda",
    name: "Frank & Linda",
    emoji: "👫",
    age: 64,
    tagline: "Retired couple enjoying life",
  },
};

// =============================================================================
// TASK POOLS
// =============================================================================

const MORNING_TASKS: PuzzleTask[] = [
  { id: "wake", title: "Wake up", emoji: "🌅", story: "The alarm goes off" },
  { id: "shower", title: "Shower", emoji: "🚿", story: "A quick warm shower" },
  { id: "dress", title: "Get dressed", emoji: "👔", story: "Nice clothes for the day" },
  { id: "breakfast", title: "Breakfast", emoji: "🍳", story: "Toast and coffee, as always" },
  { id: "coffee", title: "Make coffee", emoji: "☕", story: "The morning essential" },
  { id: "email", title: "Check email", emoji: "📧", story: "See what came in overnight" },
  { id: "teeth", title: "Brush teeth", emoji: "🪥", story: "Fresh and clean" },
];

const ERRAND_TASKS: PuzzleTask[] = [
  { id: "bank", title: "Bank", emoji: "🏦", story: "Cash for the week" },
  { id: "groceries", title: "Groceries", emoji: "🛒", story: "Stock up the fridge" },
  { id: "hardware", title: "Hardware store", emoji: "🔧", story: "Fix-it supplies" },
  { id: "carwash", title: "Car wash", emoji: "🚗", story: "The car needs a good clean" },
  { id: "library", title: "Library", emoji: "📚", story: "Return some books" },
  { id: "pharmacy", title: "Pharmacy", emoji: "💊", story: "Prescription refill" },
  { id: "dryclean", title: "Dry cleaning", emoji: "👔", story: "Pick up the suit" },
  { id: "gas", title: "Gas station", emoji: "⛽", story: "Fill up the tank" },
  { id: "post", title: "Post office", emoji: "📮", story: "Mail a package" },
  { id: "coffee_shop", title: "Coffee shop", emoji: "☕", story: "A nice treat" },
];

const VISITOR_TASKS: PuzzleTask[] = [
  { id: "clean", title: "Clean house", emoji: "🧹", story: "Tidy up for company" },
  { id: "shop", title: "Buy groceries", emoji: "🛒", story: "Ingredients for dinner" },
  { id: "cook", title: "Cook meal", emoji: "👨‍🍳", story: "Prepare something delicious" },
  { id: "table", title: "Set table", emoji: "🍽️", story: "Make it look nice" },
  { id: "flowers", title: "Buy flowers", emoji: "💐", story: "Fresh from the garden center" },
  { id: "ready", title: "Get ready", emoji: "✨", story: "Look presentable" },
  { id: "music", title: "Put on music", emoji: "🎵", story: "Set the mood" },
  { id: "dessert", title: "Prepare dessert", emoji: "🍰", story: "Something sweet" },
];

const WEEKEND_TASKS: PuzzleTask[] = [
  { id: "brunch", title: "Brunch", emoji: "🥞", story: "Weekend treat" },
  { id: "exercise", title: "Exercise", emoji: "🏃", story: "Stay healthy" },
  { id: "laundry", title: "Laundry", emoji: "🧺", story: "Sheets and towels" },
  { id: "clean_house", title: "Clean house", emoji: "🧹", story: "Weekly chores" },
  { id: "garden", title: "Gardening", emoji: "🌱", story: "Tend to the plants" },
  { id: "call", title: "Call family", emoji: "📞", story: "Catch up with loved ones" },
  { id: "nap", title: "Afternoon nap", emoji: "😴", story: "A well-deserved rest" },
  { id: "reading", title: "Reading", emoji: "📖", story: "Get lost in a book" },
];

// =============================================================================
// STORY-BASED PUZZLE TEMPLATES
// =============================================================================

interface StoryTemplate {
  id: string;
  characterId: string;
  title: string;
  subtitle: string;
  scenario: string;
  context: string;
  storyClue: string; // Logical clue that helps user DEDUCE the answer
  taskPool: PuzzleTask[];
  taskCount: number;
  stageRules: PuzzleRule[][];
  stageIntros?: string[];
  successMessage: string;
}

const STORY_TEMPLATES: StoryTemplate[] = [
  // ===== BOB'S MORNING =====
  {
    id: "bob_morning",
    characterId: "bob",
    title: "Bob's Morning Routine",
    subtitle: "Help Bob get ready on time",
    scenario: "Bob has a doctor's appointment at 10 AM. Help him get ready!",
    context: "Bob likes to take his time in the morning, but today he needs to be efficient.",
    storyClue: "Obviously, nothing can happen until Bob wakes up! And he always showers before getting dressed so his clothes stay dry.",
    taskPool: MORNING_TASKS,
    taskCount: 4,
    stageRules: [
      [
        {
          type: "first",
          description: "🌅 Wake up is first",
          explanation: "Bob needs to wake up before anything else!",
          action: "Put Wake up in slot 1",
          involvedTasks: ["wake"],
        },
      ],
      [
        {
          type: "first",
          description: "🌅 Wake up is first",
          explanation: "Bob needs to wake up before anything else!",
          action: "Put Wake up in slot 1",
          involvedTasks: ["wake"],
        },
        {
          type: "before",
          description: "🚿 Shower before 👔 Get dressed",
          explanation: "Bob needs to dry off before putting on clothes",
          action: "Put Shower in an earlier slot than Get dressed",
          involvedTasks: ["shower", "dress"],
        },
      ],
      [
        {
          type: "first",
          description: "🌅 Wake up is first",
          explanation: "Bob needs to wake up before anything else!",
          action: "Put Wake up in slot 1",
          involvedTasks: ["wake"],
        },
        {
          type: "before",
          description: "🚿 Shower before 👔 Get dressed",
          explanation: "Bob needs to dry off before putting on clothes",
          action: "Put Shower in an earlier slot than Get dressed",
          involvedTasks: ["shower", "dress"],
        },
        {
          type: "last",
          description: "📧 Check email is last",
          explanation: "Bob checks email once he is fully ready",
          action: "Put Check email in the last slot",
          involvedTasks: ["email"],
        },
      ],
    ],
    stageIntros: [
      "Bob just woke up. Let's start planning his morning.",
      "Good start! Now Bob needs to shower and get dressed.",
      "Almost there! Bob will check email after he is ready.",
    ],
    successMessage: "Bob made it to his appointment with time to spare. Dr. Martinez was impressed!",
  },

  // ===== BOB'S MORNING (5 tasks) =====
  {
    id: "bob_morning_full",
    characterId: "bob",
    title: "Bob's Productive Morning",
    subtitle: "Get ready efficiently",
    scenario: "Bob wants a productive morning before meeting his grandkids at noon.",
    context: "His golden retriever Max is waiting for attention too!",
    storyClue: "Bob always wakes up first - nothing else can happen while sleeping! He eats breakfast before brushing teeth (so his teeth stay clean), and saves email for last so it does not distract him.",
    taskPool: MORNING_TASKS,
    taskCount: 5,
    stageRules: [
      [
        {
          type: "first",
          description: "🌅 Wake up is first",
          explanation: "Nothing happens while Bob is asleep!",
          action: "Put Wake up in slot 1",
          involvedTasks: ["wake"],
        },
      ],
      [
        {
          type: "first",
          description: "🌅 Wake up is first",
          explanation: "Nothing happens while Bob is asleep!",
          action: "Put Wake up in slot 1",
          involvedTasks: ["wake"],
        },
        {
          type: "before",
          description: "🍳 Breakfast before 🪥 Brush teeth",
          explanation: "Brush after eating to keep teeth clean",
          action: "Put Breakfast before Brush teeth",
          involvedTasks: ["breakfast", "teeth"],
        },
      ],
      [
        {
          type: "first",
          description: "🌅 Wake up is first",
          explanation: "Nothing happens while Bob is asleep!",
          action: "Put Wake up in slot 1",
          involvedTasks: ["wake"],
        },
        {
          type: "before",
          description: "🍳 Breakfast before 🪥 Brush teeth",
          explanation: "Brush after eating to keep teeth clean",
          action: "Put Breakfast before Brush teeth",
          involvedTasks: ["breakfast", "teeth"],
        },
        {
          type: "last",
          description: "📧 Check email last",
          explanation: "Emails can wait until Bob is ready",
          action: "Put Check email in the last slot",
          involvedTasks: ["email"],
        },
      ],
      [
        {
          type: "first",
          description: "🌅 Wake up is first",
          explanation: "Nothing happens while Bob is asleep!",
          action: "Put Wake up in slot 1",
          involvedTasks: ["wake"],
        },
        {
          type: "before",
          description: "🍳 Breakfast before 🪥 Brush teeth",
          explanation: "Brush after eating to keep teeth clean",
          action: "Put Breakfast before Brush teeth",
          involvedTasks: ["breakfast", "teeth"],
        },
        {
          type: "last",
          description: "📧 Check email last",
          explanation: "Emails can wait until Bob is ready",
          action: "Put Check email in the last slot",
          involvedTasks: ["email"],
        },
        {
          type: "before",
          description: "🚿 Shower before 👔 Get dressed",
          explanation: "Get clean and dry before dressing",
          action: "Put Shower before Get dressed",
          involvedTasks: ["shower", "dress"],
        },
      ],
    ],
    successMessage: "Wonderful morning! Bob is ready and excited to see his grandkids!",
  },

  // ===== MARGARET'S BOOK CLUB =====
  {
    id: "margaret_bookclub",
    characterId: "margaret",
    title: "Margaret's Book Club Day",
    subtitle: "Host the perfect gathering",
    scenario: "Margaret is hosting book club at 2 PM today!",
    context: "The ladies are coming to discuss their latest read. Margaret wants everything perfect.",
    storyClue: "Margaret needs to buy ingredients before she can cook anything. She will set the table after cooking so she knows which dishes to use. And she will get dressed last so she does not spill anything on her nice outfit!",
    taskPool: VISITOR_TASKS,
    taskCount: 4,
    stageRules: [
      [
        {
          type: "before",
          description: "🛒 Shop before 👨‍🍳 Cook",
          explanation: "Cannot cook without ingredients!",
          action: "Put Shop before Cook",
          involvedTasks: ["shop", "cook"],
        },
      ],
      [
        {
          type: "before",
          description: "🛒 Shop before 👨‍🍳 Cook",
          explanation: "Cannot cook without ingredients!",
          action: "Put Shop before Cook",
          involvedTasks: ["shop", "cook"],
        },
        {
          type: "before",
          description: "👨‍🍳 Cook before 🍽️ Set table",
          explanation: "Know what dishes you need after cooking",
          action: "Put Cook before Set table",
          involvedTasks: ["cook", "table"],
        },
      ],
      [
        {
          type: "before",
          description: "🛒 Shop before 👨‍🍳 Cook",
          explanation: "Cannot cook without ingredients!",
          action: "Put Shop before Cook",
          involvedTasks: ["shop", "cook"],
        },
        {
          type: "before",
          description: "👨‍🍳 Cook before 🍽️ Set table",
          explanation: "Know what dishes you need after cooking",
          action: "Put Cook before Set table",
          involvedTasks: ["cook", "table"],
        },
        {
          type: "last",
          description: "✨ Get ready is last",
          explanation: "Keep your nice outfit clean!",
          action: "Put Get ready in the last slot",
          involvedTasks: ["ready"],
        },
      ],
    ],
    successMessage: "The book club was a hit! Everyone loved Margaret's lemon squares!",
  },

  // ===== FRANK & LINDA'S ERRANDS =====
  {
    id: "frank_linda_errands",
    characterId: "frank_linda",
    title: "Frank & Linda's Errands",
    subtitle: "Run errands together",
    scenario: "Frank and Linda need to run several errands before their grandkids visit at 4 PM.",
    context: "Little Emma and Jack are coming for dinner. Linda wants to make their favorite mac and cheese!",
    storyClue: "Frank needs cash from the bank first because the farmers market only takes cash. They are buying ice cream for the grandkids, so groceries should be last so it does not melt in the car!",
    taskPool: ERRAND_TASKS,
    taskCount: 4,
    stageRules: [
      [
        {
          type: "first",
          description: "🏦 Bank is first",
          explanation: "Need cash for the farmers market",
          action: "Put Bank in slot 1",
          involvedTasks: ["bank"],
        },
      ],
      [
        {
          type: "first",
          description: "🏦 Bank is first",
          explanation: "Need cash for the farmers market",
          action: "Put Bank in slot 1",
          involvedTasks: ["bank"],
        },
        {
          type: "last",
          description: "🛒 Groceries is last",
          explanation: "Ice cream will melt otherwise!",
          action: "Put Groceries in the last slot",
          involvedTasks: ["groceries"],
        },
      ],
      [
        {
          type: "first",
          description: "🏦 Bank is first",
          explanation: "Need cash for the farmers market",
          action: "Put Bank in slot 1",
          involvedTasks: ["bank"],
        },
        {
          type: "last",
          description: "🛒 Groceries is last",
          explanation: "Ice cream will melt otherwise!",
          action: "Put Groceries in the last slot",
          involvedTasks: ["groceries"],
        },
        {
          type: "before",
          description: "💊 Pharmacy before 📚 Library",
          explanation: "Pharmacy closes at 5, library is open late",
          action: "Put Pharmacy before Library",
          involvedTasks: ["pharmacy", "library"],
        },
      ],
    ],
    successMessage: "All done! Frank and Linda got home just as Emma and Jack arrived!",
  },

  // ===== HELEN'S LUNCH BREAK =====
  {
    id: "helen_lunch",
    characterId: "helen",
    title: "Helen's Quick Errands",
    subtitle: "Make the most of lunch break",
    scenario: "Helen needs to run a few errands during her lunch break.",
    context: "She has just enough time if she plans her route carefully.",
    storyClue: "Helen is picking up special car cleaning supplies at the hardware store, then heading straight to the car wash to use them. She is buying frozen meals for the week, so groceries should be last so they stay cold!",
    taskPool: ERRAND_TASKS,
    taskCount: 3,
    stageRules: [
      [
        {
          type: "before",
          description: "🔧 Hardware before 🚗 Car wash",
          explanation: "Pick up cleaning supplies first to use at car wash",
          action: "Put Hardware store before Car wash",
          involvedTasks: ["hardware", "carwash"],
        },
      ],
      [
        {
          type: "before",
          description: "🔧 Hardware before 🚗 Car wash",
          explanation: "Pick up cleaning supplies first to use at car wash",
          action: "Put Hardware store before Car wash",
          involvedTasks: ["hardware", "carwash"],
        },
        {
          type: "last",
          description: "🛒 Groceries is last",
          explanation: "Frozen food needs to go straight to the fridge",
          action: "Put Groceries in the last slot",
          involvedTasks: ["groceries"],
        },
      ],
    ],
    successMessage: "Perfect timing! Helen got back to the office with 5 minutes to spare!",
  },

  // ===== WEEKEND RELAXATION =====
  {
    id: "bob_weekend",
    characterId: "bob",
    title: "Bob's Relaxing Saturday",
    subtitle: "Balance chores and fun",
    scenario: "It is Saturday and Bob has a relaxing day planned.",
    context: "Bob promised to video call his daughter Sarah at 3 PM.",
    storyClue: "Bob always starts his weekend with a nice brunch - it gives him energy for the day! He likes to exercise before taking a nap (you have to earn your rest!). He winds down with reading at the end of the day.",
    taskPool: WEEKEND_TASKS,
    taskCount: 4,
    stageRules: [
      [
        {
          type: "first",
          description: "🥞 Brunch is first",
          explanation: "Weekend fuel to start the day!",
          action: "Put Brunch in slot 1",
          involvedTasks: ["brunch"],
        },
      ],
      [
        {
          type: "first",
          description: "🥞 Brunch is first",
          explanation: "Weekend fuel to start the day!",
          action: "Put Brunch in slot 1",
          involvedTasks: ["brunch"],
        },
        {
          type: "before",
          description: "🏃 Exercise before 😴 Nap",
          explanation: "Earn your rest with some activity first!",
          action: "Put Exercise before Nap",
          involvedTasks: ["exercise", "nap"],
        },
      ],
      [
        {
          type: "first",
          description: "🥞 Brunch is first",
          explanation: "Weekend fuel to start the day!",
          action: "Put Brunch in slot 1",
          involvedTasks: ["brunch"],
        },
        {
          type: "before",
          description: "🏃 Exercise before 😴 Nap",
          explanation: "Earn your rest with some activity first!",
          action: "Put Exercise before Nap",
          involvedTasks: ["exercise", "nap"],
        },
        {
          type: "last",
          description: "📖 Reading is last",
          explanation: "Perfect way to wind down the evening",
          action: "Put Reading in the last slot",
          involvedTasks: ["reading"],
        },
      ],
    ],
    successMessage: "What a great Saturday! Bob feels relaxed and ready for the week ahead!",
  },

  // ===== MARGARET'S DINNER PARTY =====
  {
    id: "margaret_dinner",
    characterId: "margaret",
    title: "Margaret's Dinner Party",
    subtitle: "Impress your guests",
    scenario: "Margaret is hosting a dinner party for old friends!",
    context: "She has not seen them in years and wants everything to be special.",
    storyClue: "Margaret always cleans the house first - guests should arrive to a tidy home! She needs to buy ingredients before making dessert. She arranges flowers before putting on music to set the ambiance just right. And she gets dressed last so her outfit stays perfect!",
    taskPool: VISITOR_TASKS,
    taskCount: 5,
    stageRules: [
      [
        {
          type: "first",
          description: "🧹 Clean house first",
          explanation: "Start with a clean slate for guests",
          action: "Put Clean house in slot 1",
          involvedTasks: ["clean"],
        },
      ],
      [
        {
          type: "first",
          description: "🧹 Clean house first",
          explanation: "Start with a clean slate for guests",
          action: "Put Clean house in slot 1",
          involvedTasks: ["clean"],
        },
        {
          type: "before",
          description: "🛒 Shop before 🍰 Dessert",
          explanation: "Cannot make dessert without ingredients",
          action: "Put Shop before Dessert",
          involvedTasks: ["shop", "dessert"],
        },
      ],
      [
        {
          type: "first",
          description: "🧹 Clean house first",
          explanation: "Start with a clean slate for guests",
          action: "Put Clean house in slot 1",
          involvedTasks: ["clean"],
        },
        {
          type: "before",
          description: "🛒 Shop before 🍰 Dessert",
          explanation: "Cannot make dessert without ingredients",
          action: "Put Shop before Dessert",
          involvedTasks: ["shop", "dessert"],
        },
        {
          type: "before",
          description: "💐 Flowers before 🎵 Music",
          explanation: "Visual ambiance first, then audio",
          action: "Put Flowers before Music",
          involvedTasks: ["flowers", "music"],
        },
      ],
      [
        {
          type: "first",
          description: "🧹 Clean house first",
          explanation: "Start with a clean slate for guests",
          action: "Put Clean house in slot 1",
          involvedTasks: ["clean"],
        },
        {
          type: "before",
          description: "🛒 Shop before 🍰 Dessert",
          explanation: "Cannot make dessert without ingredients",
          action: "Put Shop before Dessert",
          involvedTasks: ["shop", "dessert"],
        },
        {
          type: "before",
          description: "💐 Flowers before 🎵 Music",
          explanation: "Visual ambiance first, then audio",
          action: "Put Flowers before Music",
          involvedTasks: ["flowers", "music"],
        },
        {
          type: "last",
          description: "✨ Get ready is last",
          explanation: "Look your best when guests arrive!",
          action: "Put Get ready in the last slot",
          involvedTasks: ["ready"],
        },
      ],
    ],
    successMessage: "What a wonderful evening! The friends laughed and reminisced for hours!",
  },

  // ===== BUSY ERRAND DAY =====
  {
    id: "helen_busy_day",
    characterId: "helen",
    title: "Helen's Busy Afternoon",
    subtitle: "Lots to do - plan carefully!",
    scenario: "Helen has a busy afternoon with several errands.",
    context: "She needs to get everything done before picking up her son from soccer practice.",
    storyClue: "The bank closes early on Saturdays, so Helen needs to go there first! The pharmacy is right next to the grocery store entrance, so she stops there first. The gas station and coffee shop are on opposite sides of town - no point going back and forth. And groceries are last because of frozen items!",
    taskPool: ERRAND_TASKS,
    taskCount: 5,
    stageRules: [
      [
        {
          type: "first",
          description: "🏦 Start at the Bank",
          explanation: "Bank closes early on Saturdays!",
          action: "Put Bank in slot 1",
          involvedTasks: ["bank"],
        },
      ],
      [
        {
          type: "first",
          description: "🏦 Start at the Bank",
          explanation: "Bank closes early on Saturdays!",
          action: "Put Bank in slot 1",
          involvedTasks: ["bank"],
        },
        {
          type: "before",
          description: "💊 Pharmacy before 🛒 Groceries",
          explanation: "Pharmacy is at the grocery store entrance",
          action: "Put Pharmacy before Groceries",
          involvedTasks: ["pharmacy", "groceries"],
        },
      ],
      [
        {
          type: "first",
          description: "🏦 Start at the Bank",
          explanation: "Bank closes early on Saturdays!",
          action: "Put Bank in slot 1",
          involvedTasks: ["bank"],
        },
        {
          type: "before",
          description: "💊 Pharmacy before 🛒 Groceries",
          explanation: "Pharmacy is at the grocery store entrance",
          action: "Put Pharmacy before Groceries",
          involvedTasks: ["pharmacy", "groceries"],
        },
        {
          type: "not_adjacent",
          description: "⛽ Gas and ☕ Coffee not together",
          explanation: "They are on opposite sides of town!",
          action: "Put at least one task between Gas and Coffee",
          involvedTasks: ["gas", "coffee_shop"],
        },
      ],
      [
        {
          type: "first",
          description: "🏦 Start at the Bank",
          explanation: "Bank closes early on Saturdays!",
          action: "Put Bank in slot 1",
          involvedTasks: ["bank"],
        },
        {
          type: "before",
          description: "💊 Pharmacy before 🛒 Groceries",
          explanation: "Pharmacy is at the grocery store entrance",
          action: "Put Pharmacy before Groceries",
          involvedTasks: ["pharmacy", "groceries"],
        },
        {
          type: "not_adjacent",
          description: "⛽ Gas and ☕ Coffee not together",
          explanation: "They are on opposite sides of town!",
          action: "Put at least one task between Gas and Coffee",
          involvedTasks: ["gas", "coffee_shop"],
        },
        {
          type: "last",
          description: "🛒 Groceries is last",
          explanation: "Frozen items need to go straight home",
          action: "Put Groceries in the last slot",
          involvedTasks: ["groceries"],
        },
      ],
    ],
    successMessage: "Helen got everything done and made it to soccer practice right on time!",
  },

  // ===== PRODUCTIVE SATURDAY =====
  {
    id: "linda_saturday",
    characterId: "frank_linda",
    title: "Productive Saturday",
    subtitle: "Get things done",
    scenario: "Frank and Linda have a productive Saturday planned.",
    context: "They want to get chores done so Sunday can be pure relaxation.",
    storyClue: "They start with a nice brunch for energy! They clean the house first while it is still cool inside, then head out to the garden. They do not exercise right before a nap - that would be too tiring! They end the day calling family to catch up.",
    taskPool: WEEKEND_TASKS,
    taskCount: 5,
    stageRules: [
      [
        {
          type: "before",
          description: "🧹 Clean before 🌱 Garden",
          explanation: "Indoor chores first while it is cool",
          action: "Put Clean house before Gardening",
          involvedTasks: ["clean_house", "garden"],
        },
      ],
      [
        {
          type: "before",
          description: "🧹 Clean before 🌱 Garden",
          explanation: "Indoor chores first while it is cool",
          action: "Put Clean house before Gardening",
          involvedTasks: ["clean_house", "garden"],
        },
        {
          type: "not_adjacent",
          description: "🏃 Exercise and 😴 Nap apart",
          explanation: "Need time to cool down after exercise",
          action: "Put at least one task between Exercise and Nap",
          involvedTasks: ["exercise", "nap"],
        },
      ],
      [
        {
          type: "before",
          description: "🧹 Clean before 🌱 Garden",
          explanation: "Indoor chores first while it is cool",
          action: "Put Clean house before Gardening",
          involvedTasks: ["clean_house", "garden"],
        },
        {
          type: "not_adjacent",
          description: "🏃 Exercise and 😴 Nap apart",
          explanation: "Need time to cool down after exercise",
          action: "Put at least one task between Exercise and Nap",
          involvedTasks: ["exercise", "nap"],
        },
        {
          type: "last",
          description: "📞 Call family last",
          explanation: "Catch up with loved ones at the end of the day",
          action: "Put Call family in the last slot",
          involvedTasks: ["call"],
        },
      ],
      [
        {
          type: "before",
          description: "🧹 Clean before 🌱 Garden",
          explanation: "Indoor chores first while it is cool",
          action: "Put Clean house before Gardening",
          involvedTasks: ["clean_house", "garden"],
        },
        {
          type: "not_adjacent",
          description: "🏃 Exercise and 😴 Nap apart",
          explanation: "Need time to cool down after exercise",
          action: "Put at least one task between Exercise and Nap",
          involvedTasks: ["exercise", "nap"],
        },
        {
          type: "last",
          description: "📞 Call family last",
          explanation: "Catch up with loved ones at the end of the day",
          action: "Put Call family in the last slot",
          involvedTasks: ["call"],
        },
        {
          type: "first",
          description: "🥞 Brunch is first",
          explanation: "Weekend fuel to start the day!",
          action: "Put Brunch in slot 1",
          involvedTasks: ["brunch"],
        },
      ],
    ],
    successMessage: "Frank and Linda finished all their chores and feel great about Sunday!",
  },
];

// =============================================================================
// HELPERS
// =============================================================================

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function createSeededRNG(seed: number): () => number {
  let state = seed;
  return function (): number {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function shuffleWithSeed<T>(array: T[], rng: () => number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// =============================================================================
// PUZZLE GENERATION
// =============================================================================

/**
 * Generate a deterministic daily puzzle based on the date
 * FIXED: Required tasks are ALWAYS included in the puzzle
 */
export function generateDailyPuzzle(
  date: Date = new Date(),
  _daysPlayed: number = 0
): DailyPuzzle {
  // Create seed from date
  const dateStr = date.toISOString().split("T")[0];
  const seed = hashString(dateStr);
  const rng = createSeededRNG(seed);

  // Select a template based on the seed
  const templateIndex = Math.floor(rng() * STORY_TEMPLATES.length);
  const template = STORY_TEMPLATES[templateIndex];
  const character = CHARACTERS[template.characterId];

  // CRITICAL FIX: Collect ALL task IDs that are mentioned in ANY rule
  const requiredTaskIds = new Set<string>();
  for (const stageRules of template.stageRules) {
    for (const rule of stageRules) {
      rule.involvedTasks.forEach((id) => requiredTaskIds.add(id));
    }
  }

  // Build the task list - REQUIRED tasks first (guaranteed to be included)
  const tasks: PuzzleTask[] = [];
  const taskPool = [...template.taskPool];

  // Add all required tasks FIRST
  for (const taskId of requiredTaskIds) {
    const taskIndex = taskPool.findIndex((t) => t.id === taskId);
    if (taskIndex !== -1) {
      tasks.push(taskPool[taskIndex]);
      taskPool.splice(taskIndex, 1); // Remove from pool
    } else {
      logger.error(
        `CRITICAL: Rule references task "${taskId}" but it does not exist in pool!`
      );
    }
  }

  // Fill remaining slots with random tasks from what is left
  const shuffledRemaining = shuffleWithSeed(taskPool, rng);
  while (tasks.length < template.taskCount && shuffledRemaining.length > 0) {
    tasks.push(shuffledRemaining.shift()!);
  }

  // Shuffle for display (user sees them in random order)
  const displayTasks = shuffleWithSeed([...tasks], rng);

  // Build stages with intros
  const stages: PuzzleStage[] = template.stageRules.map((rules, index) => ({
    stageNumber: index + 1,
    rules: rules,
    intro: template.stageIntros?.[index],
  }));

  return {
    id: `${template.id}_${dateStr}`,
    date: dateStr,
    title: template.title,
    subtitle: template.subtitle,
    tasks: displayTasks,
    rules: template.stageRules[template.stageRules.length - 1],
    totalStages: stages.length,
    stages,
    // Story elements
    character,
    scenario: template.scenario,
    context: template.context,
    storyClue: template.storyClue,
    successMessage: template.successMessage,
  };
}

/**
 * Create a fallback rule for a task (used when template has no matching rules)
 * This ensures every puzzle has at least 1 rule so users can solve it logically
 */
function createFallbackRule(task: PuzzleTask, ruleType: RuleType): PuzzleRule {
  switch (ruleType) {
    case "first":
      return {
        type: "first",
        description: `${task.emoji} ${task.title} is first`,
        explanation: `Start with ${task.title.toLowerCase()} to get everything in order`,
        involvedTasks: [task.id],
      };
    case "last":
      return {
        type: "last",
        description: `${task.emoji} ${task.title} is last`,
        explanation: `Finish with ${task.title.toLowerCase()} at the end`,
        involvedTasks: [task.id],
      };
    default:
      // Default to "first" if no matching type
      return {
        type: "first",
        description: `${task.emoji} ${task.title} is first`,
        explanation: `Start with ${task.title.toLowerCase()}`,
        involvedTasks: [task.id],
      };
  }
}

/**
 * Generate a puzzle based on difficulty configuration
 * This allows progressive difficulty based on user level
 *
 * CRITICAL FIX: Ensures tasks, rules, and storyClue are ALL coherent
 * The storyClue must explain the rules, and rules must reference actual tasks
 */
export function generatePuzzleWithDifficulty(
  config: DifficultyConfig,
  seed?: number
): DailyPuzzle {
  // Use provided seed or create from current time
  const actualSeed = seed ?? Date.now();
  const rng = createSeededRNG(actualSeed);

  // Filter rules by allowed types for a template
  const filterRules = (rules: PuzzleRule[]): PuzzleRule[] => {
    return rules.filter((rule) => config.allowedRuleTypes.includes(rule.type));
  };

  // CRITICAL FIX: Score templates by how well they match the config
  // We MUST use templates that have rules matching our allowed types
  // This ensures the storyClue will explain the actual rules
  const scoredTemplates = STORY_TEMPLATES.map((template) => {
    // Get all unique rules from this template that match allowed types
    const matchingRules: PuzzleRule[] = [];
    for (const stageRules of template.stageRules) {
      const filtered = filterRules(stageRules);
      for (const rule of filtered) {
        if (!matchingRules.some((r) => r.description === rule.description)) {
          matchingRules.push(rule);
        }
      }
    }

    // Score based on:
    // 1. Has at least 1 matching rule (REQUIRED)
    // 2. Task count close to desired
    // 3. Number of matching rules close to desired
    const hasMatchingRules = matchingRules.length > 0;
    const taskDiff = Math.abs(template.taskCount - config.taskCount);
    const ruleDiff = Math.abs(matchingRules.length - config.ruleCount);

    // If no matching rules, score is -1 (unusable)
    if (!hasMatchingRules) {
      return { template, score: -1, matchingRules };
    }

    // Higher score = better match (max 100, minus penalties)
    const score = 100 - taskDiff * 10 - ruleDiff * 5;

    return { template, score, matchingRules };
  });

  // Filter out unusable templates (no matching rules)
  const usableTemplates = scoredTemplates.filter((st) => st.score >= 0);

  // Sort by score descending
  usableTemplates.sort((a, b) => b.score - a.score);

  // If no usable templates, fall back to any template (shouldn't happen with good template design)
  const selectedTemplateData =
    usableTemplates.length > 0
      ? usableTemplates[Math.floor(rng() * Math.min(3, usableTemplates.length))] // Pick from top 3
      : { template: STORY_TEMPLATES[0], matchingRules: [] as PuzzleRule[] };

  const template = selectedTemplateData.template;
  const character = CHARACTERS[template.characterId];

  // Use the pre-filtered matching rules
  let selectedRules = selectedTemplateData.matchingRules;

  // CRITICAL: Ensure at least 1 rule (minimum to make puzzle solvable)
  const minRuleCount = Math.max(1, config.ruleCount);

  // Limit to config.ruleCount rules (but at least 1)
  selectedRules = selectedRules.slice(0, minRuleCount);

  // Build task pool from template
  let taskPool = [...template.taskPool];

  // CRITICAL FIX: Do NOT create fallback rules for random tasks
  // If we have no rules, the template selection failed - use whatever rules we have
  // The storyClue will still be coherent because we selected a matching template

  // Collect required task IDs from selected rules
  const requiredTaskIds = new Set<string>();
  for (const rule of selectedRules) {
    rule.involvedTasks.forEach((id) => requiredTaskIds.add(id));
  }

  // Build task list
  const tasks: PuzzleTask[] = [];

  // Add required tasks first (these are referenced by rules)
  for (const taskId of requiredTaskIds) {
    const taskIndex = taskPool.findIndex((t) => t.id === taskId);
    if (taskIndex !== -1) {
      tasks.push(taskPool[taskIndex]);
      taskPool.splice(taskIndex, 1);
    }
  }

  // Fill remaining slots with other tasks from the same pool
  const shuffledRemaining = shuffleWithSeed(taskPool, rng);
  while (tasks.length < config.taskCount && shuffledRemaining.length > 0) {
    tasks.push(shuffledRemaining.shift()!);
  }

  // Shuffle for display
  const displayTasks = shuffleWithSeed([...tasks], rng);

  // For difficulty-based puzzles, use single stage with all rules
  const stages: PuzzleStage[] = [
    {
      stageNumber: 1,
      rules: selectedRules,
    },
  ];

  const dateStr = new Date().toISOString().split("T")[0];

  // CRITICAL FIX: Generate a coherent storyClue that matches the selected rules
  // The storyClue should only mention tasks that are in the puzzle
  const coherentStoryClue = generateCoherentStoryClue(
    selectedRules,
    displayTasks,
    template.storyClue,
    character?.name || "the character"
  );

  return {
    id: `${template.id}_${dateStr}_${actualSeed}`,
    date: dateStr,
    title: template.title,
    subtitle: `${config.name} - Level ${config.level}`,
    tasks: displayTasks,
    rules: selectedRules,
    totalStages: 1,
    stages,
    character,
    scenario: template.scenario,
    context: template.context,
    storyClue: coherentStoryClue,
    successMessage: template.successMessage,
  };
}

/**
 * Generate a story clue that only references tasks in the current puzzle
 * and explains the actual rules being used
 */
function generateCoherentStoryClue(
  rules: PuzzleRule[],
  tasks: PuzzleTask[],
  templateClue: string | undefined,
  characterName: string
): string {
  // Build a set of task IDs in this puzzle
  const taskIds = new Set(tasks.map((t) => t.id));

  // Build a map for quick task lookup
  const taskMap = new Map(tasks.map((t) => [t.id, t]));

  // Generate clue parts based on actual rules
  const clueParts: string[] = [];

  for (const rule of rules) {
    // Only include clues for tasks that exist in this puzzle
    const involvedTasksInPuzzle = rule.involvedTasks.filter((id) =>
      taskIds.has(id)
    );
    if (involvedTasksInPuzzle.length === 0) continue;

    switch (rule.type) {
      case "first": {
        const task = taskMap.get(involvedTasksInPuzzle[0]);
        if (task) {
          clueParts.push(
            `${characterName} always starts with ${task.title.toLowerCase()} - nothing else can happen before that!`
          );
        }
        break;
      }
      case "last": {
        const task = taskMap.get(involvedTasksInPuzzle[0]);
        if (task) {
          clueParts.push(
            `${task.title} should be saved for last so everything stays fresh.`
          );
        }
        break;
      }
      case "before": {
        if (involvedTasksInPuzzle.length >= 2) {
          const firstTask = taskMap.get(involvedTasksInPuzzle[0]);
          const secondTask = taskMap.get(involvedTasksInPuzzle[1]);
          if (firstTask && secondTask) {
            clueParts.push(
              `${firstTask.title} needs to happen before ${secondTask.title.toLowerCase()}.`
            );
          }
        }
        break;
      }
      case "not_adjacent": {
        if (involvedTasksInPuzzle.length >= 2) {
          const taskA = taskMap.get(involvedTasksInPuzzle[0]);
          const taskB = taskMap.get(involvedTasksInPuzzle[1]);
          if (taskA && taskB) {
            clueParts.push(
              `${taskA.title} and ${taskB.title.toLowerCase()} should not be done back-to-back.`
            );
          }
        }
        break;
      }
    }
  }

  // If we generated clue parts, use them
  if (clueParts.length > 0) {
    return clueParts.join(" ");
  }

  // Fallback to template clue if no rules generated text
  // (but check if template clue references missing tasks)
  if (templateClue) {
    // Check if template clue is still relevant by seeing if it mentions tasks not in puzzle
    // This is a simple heuristic - check for common task words
    const taskTitles = tasks.map((t) => t.title.toLowerCase());
    const clueWords = templateClue.toLowerCase();

    // List of task keywords that might indicate a mismatch
    const potentialMismatches = [
      "car wash",
      "groceries",
      "bank",
      "pharmacy",
      "library",
      "hardware",
      "gas station",
      "coffee",
    ];

    let hasMismatch = false;
    for (const keyword of potentialMismatches) {
      if (
        clueWords.includes(keyword) &&
        !taskTitles.some((t) => t.includes(keyword.split(" ")[0]))
      ) {
        hasMismatch = true;
        break;
      }
    }

    if (!hasMismatch) {
      return templateClue;
    }
  }

  // Generic fallback
  return `Read the rules carefully - they tell you exactly what order to use!`;
}

/**
 * Generate a puzzle for a user based on their completed puzzles count
 *
 * CRITICAL FIX: Now uses predefined coherent puzzles to ensure:
 * - Tasks, rules, and clues are always matched
 * - No "undefined undefined" errors
 * - No unsolvable puzzles
 * - Clues give reasoning, not answers
 */
export function generatePuzzleForUser(puzzlesCompleted: number, seed?: number): DailyPuzzle {
  const config = getDifficultyConfigByPuzzlesCompleted(puzzlesCompleted);

  // Use coherent puzzles that match the allowed rule types
  const matchingPuzzles = getPuzzlesByRuleTypes(config.allowedRuleTypes);

  // Filter by task count (allow ±1 task variance for flexibility)
  const suitablePuzzles = matchingPuzzles.filter(
    (p) => Math.abs(p.tasks.length - config.taskCount) <= 1
  );

  // If no suitable puzzles, fall back to all matching puzzles
  const puzzlePool =
    suitablePuzzles.length > 0 ? suitablePuzzles : matchingPuzzles.length > 0 ? matchingPuzzles : ALL_COHERENT_PUZZLES;

  // Select puzzle using seed for determinism
  const actualSeed = seed ?? Date.now() + puzzlesCompleted;
  const puzzleIndex = Math.abs(hashString(String(actualSeed))) % puzzlePool.length;
  const coherentPuzzle = puzzlePool[puzzleIndex];

  // Validate the puzzle before using (should always pass with predefined puzzles)
  const validation = validateCoherentPuzzle(coherentPuzzle);
  if (!validation.valid) {
    logger.error("Invalid coherent puzzle:", validation.errors);
  }

  // Convert coherent puzzle to DailyPuzzle format
  return convertCoherentToDailyPuzzle(coherentPuzzle, config, actualSeed);
}

/**
 * Convert a CoherentPuzzle to the DailyPuzzle format used by the game
 */
function convertCoherentToDailyPuzzle(
  coherent: CoherentPuzzle,
  config: DifficultyConfig,
  seed: number
): DailyPuzzle {
  const rng = createSeededRNG(seed);
  const dateStr = new Date().toISOString().split("T")[0];

  // Convert tasks
  const tasks: PuzzleTask[] = coherent.tasks.map((t) => ({
    id: t.id,
    title: t.title,
    emoji: t.emoji,
  }));

  // Shuffle tasks for display (user sees them in random order)
  const displayTasks = shuffleWithSeed([...tasks], rng);

  // Convert rules to PuzzleRule format
  const rules: PuzzleRule[] = coherent.rules.map((r) => ({
    type: r.type,
    description: r.description,
    explanation: r.explanation,
    action: r.action,
    involvedTasks: r.taskId2 ? [r.taskId, r.taskId2] : [r.taskId],
  }));

  // Build stages (single stage for coherent puzzles)
  const stages: PuzzleStage[] = [
    {
      stageNumber: 1,
      rules: rules,
    },
  ];

  // Build character
  const character: Character = {
    id: coherent.character.name.toLowerCase().replace(/[^a-z]/g, "_"),
    name: coherent.character.name,
    emoji: coherent.character.emoji,
    age: 65, // Default age
    tagline: coherent.character.tagline,
  };

  return {
    id: `${coherent.id}_${dateStr}_${seed}`,
    date: dateStr,
    title: coherent.title,
    subtitle: `${config.name} - Level ${config.level}`,
    tasks: displayTasks,
    rules: rules,
    totalStages: 1,
    stages,
    character,
    scenario: coherent.intro,
    context: coherent.character.tagline,
    storyClue: coherent.clue,
    successMessage: coherent.successMessage,
  };
}

// =============================================================================
// VALIDATION - FIXED to handle missing tasks gracefully
// =============================================================================

/**
 * Helper to safely get task info - handles undefined gracefully
 */
function getTaskInfo(
  tasks: PuzzleTask[],
  taskId: string
): { emoji: string; title: string } {
  const task = tasks.find((t) => t.id === taskId);
  if (task) {
    return { emoji: task.emoji, title: task.title };
  }
  // Fallback for unknown task - this should never happen with the fixed generator
  return { emoji: "❓", title: "Unknown task" };
}

/**
 * Check if the user's solution satisfies all rules
 * FIXED: Handles undefined tasks gracefully with proper error messages
 */
export function validateSolution(
  tasks: PuzzleTask[],
  userOrder: string[], // Array of task IDs in user's order
  rules: PuzzleRule[]
): ValidationResult {
  for (const rule of rules) {
    switch (rule.type) {
      case "first": {
        const taskId = rule.involvedTasks[0];
        if (userOrder[0] !== taskId) {
          const taskInfo = getTaskInfo(tasks, taskId);
          return {
            isValid: false,
            failedRule: rule,
            message: `${taskInfo.emoji} ${taskInfo.title} needs to be in the first slot`,
          };
        }
        break;
      }

      case "last": {
        const taskId = rule.involvedTasks[0];
        if (userOrder[userOrder.length - 1] !== taskId) {
          const taskInfo = getTaskInfo(tasks, taskId);
          return {
            isValid: false,
            failedRule: rule,
            message: `${taskInfo.emoji} ${taskInfo.title} needs to be in the last slot`,
          };
        }
        break;
      }

      case "before": {
        const [firstId, secondId] = rule.involvedTasks;
        const firstIndex = userOrder.indexOf(firstId);
        const secondIndex = userOrder.indexOf(secondId);

        // Skip if either task is not in the puzzle
        if (firstIndex === -1 || secondIndex === -1) continue;

        if (firstIndex >= secondIndex) {
          const firstInfo = getTaskInfo(tasks, firstId);
          const secondInfo = getTaskInfo(tasks, secondId);
          return {
            isValid: false,
            failedRule: rule,
            message: `${firstInfo.emoji} ${firstInfo.title} needs to come before ${secondInfo.emoji} ${secondInfo.title}`,
          };
        }
        break;
      }

      case "not_adjacent": {
        const [taskA, taskB] = rule.involvedTasks;
        const indexA = userOrder.indexOf(taskA);
        const indexB = userOrder.indexOf(taskB);

        // Skip if either task is not in the puzzle
        if (indexA === -1 || indexB === -1) continue;

        if (Math.abs(indexA - indexB) === 1) {
          const infoA = getTaskInfo(tasks, taskA);
          const infoB = getTaskInfo(tasks, taskB);
          return {
            isValid: false,
            failedRule: rule,
            message: `${infoA.emoji} ${infoA.title} and ${infoB.emoji} ${infoB.title} cannot be next to each other`,
          };
        }
        break;
      }
    }
  }

  return { isValid: true };
}

/**
 * Legacy validation function for backwards compatibility
 */
export function validatePuzzleSolution(
  tasks: PuzzleTask[],
  orderedTaskIds: string[],
  _constraints: unknown[]
): { isValid: boolean; violations: string[] } {
  return {
    isValid: true,
    violations: [],
  };
}

// =============================================================================
// HELPER: Get today's puzzle
// =============================================================================
export function getTodaysPuzzle(daysPlayed: number = 0): DailyPuzzle {
  return generateDailyPuzzle(new Date(), daysPlayed);
}

// =============================================================================
// RULE TYPE HELPERS
// =============================================================================

export const RULE_TYPE_LABELS: Record<
  RuleType,
  { label: string; color: string }
> = {
  first: { label: "MUST BE FIRST", color: "#10B981" },
  last: { label: "MUST BE LAST", color: "#8B5CF6" },
  before: { label: "ORDER", color: "#2F80ED" },
  not_adjacent: { label: "NOT NEIGHBORS", color: "#F59E0B" },
};

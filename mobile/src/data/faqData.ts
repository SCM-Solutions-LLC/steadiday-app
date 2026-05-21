// =============================================================================
// FAQ DATABASE - Fully improved questions AND answers
// Questions: Clear and specific (not too short)
// Answers: Contextual with navigation paths (2-3 sentences)
// Priority field for ordering most common questions first
// Actions field for deep linking navigation buttons
// =============================================================================

export interface FAQAction {
  label: string;
  type: "navigate" | "link";
  target: string;
  icon?: string;
}

export interface FAQItem {
  id: string;
  category: string;
  keywords: string[];
  question: string;
  answer: string;
  priority?: number;
  actions?: FAQAction[];
  isSafety?: boolean;
  isHealth?: boolean;
  platforms?: ("ios" | "android")[];
  androidAnswer?: string;
}

export interface CategoryInfo {
  id: string;
  label: string;
  icon: string;
  description: string;
}

// Shortened category labels to fit in 2-column grid without truncation
export const FAQ_CATEGORIES: CategoryInfo[] = [
  { id: "getting-started", label: "Getting Started", icon: "🚀", description: "New to SteadiDay?" },
  { id: "medications", label: "Medications", icon: "💊", description: "Pills, reminders, refills" },
  { id: "tasks", label: "Tasks", icon: "📋", description: "To-dos and schedules" },
  { id: "emergency", label: "Emergency", icon: "🆘", description: "SOS and fall detection" },
  { id: "syncing", label: "Syncing", icon: "🔄", description: "Calendar, Health, connections" },
  { id: "health", label: "Health", icon: "❤️", description: "Food, water, metrics" },
  { id: "accessibility", label: "Accessibility", icon: "👁️", description: "Text size, colors, sounds" },
  // v1.0: Premium category removed — IAP disabled
  { id: "privacy", label: "Privacy", icon: "🔒", description: "PIN, Face ID, data" },
  { id: "troubleshooting", label: "Troubleshooting", icon: "🔧", description: "Fix common issues" },
];

export const FAQ_DATABASE: FAQItem[] = [
  // =========================================================================
  // GETTING STARTED (10 FAQs)
  // =========================================================================
  {
    id: "gs-1",
    category: "getting-started",
    priority: 3,
    keywords: ["profile", "setup", "name", "photo", "edit profile", "change name", "account", "picture", "trusted", "contact"],
    question: "How do I add or edit my trusted contacts?",
    answer: "Go to Settings > Safety Features to view and manage your trusted contacts. Tap the pencil icon to edit someone's info, or the trash icon to remove them. You can add new contacts anytime by tapping 'Add Trusted Contact'.",
    actions: [{ label: "Manage Trusted Contacts", type: "navigate", target: "EmergencyContacts", icon: "👥" }],
    isSafety: true
  },
  {
    id: "gs-2",
    category: "getting-started",
    priority: 2,
    keywords: ["home", "customize", "widget", "card", "home screen", "edit", "rearrange", "reorder", "move"],
    question: "How do I customize my home screen widgets?",
    answer: "Tap 'Edit' in the top right corner of your Home screen. You can add or remove widgets, and use the arrow buttons to reorder them. Your changes save automatically when you tap 'Done'."
  },
  {
    id: "gs-3",
    category: "getting-started",
    priority: 1,
    keywords: ["tabs", "features", "what", "included", "plan"],
    question: "What features does SteadiDay include?",
    answer: "SteadiDay includes medication reminders, task tracking, the Health tab for tracking vitals, Tools for water and food tracking, Mind Break games, trusted contacts, SOS button, and fall detection — all included at no extra cost."
  },
  {
    id: "gs-4",
    category: "getting-started",
    priority: 1,
    keywords: ["start", "begin", "first", "new user", "tutorial", "learn", "how to use"],
    question: "Where should I start as a new user?",
    answer: "Start by adding your medications in the Meds tab and your daily tasks in the Tasks tab. You can also connect your Apple Calendar in Settings > Connected Apps to see all your appointments in one place.",
    androidAnswer: "Start by adding your medications in the Meds tab and your daily tasks in the Tasks tab. You can also connect your Google Calendar in Settings > Connected Apps to see all your appointments in one place.",
    actions: [
      { label: "Add Medication", type: "navigate", target: "AddMedication", icon: "💊" },
      { label: "Add Task", type: "navigate", target: "AddTask", icon: "📋" }
    ]
  },
  {
    id: "gs-5",
    category: "getting-started",
    priority: 4,
    keywords: ["tabs", "navigate", "menu", "bottom", "screen", "sections"],
    question: "What are the different tabs at the bottom for?",
    answer: "The bottom tabs help you navigate the app: Meds for medications, Tasks for to-dos, Care Team for doctor info, and Settings for app options. Additional tabs include Health, Tools, and Mind Breaks."
  },
  {
    id: "gs-6",
    category: "getting-started",
    priority: 5,
    keywords: ["family", "share", "caregiver", "loved one", "help", "assist"],
    question: "Can my family help me set up the app?",
    answer: "Absolutely! Many users have a family member help with initial setup. Once set up, you can share your Care Summary with them so they can see your daily progress and medications."
  },
  {
    id: "gs-7",
    category: "getting-started",
    priority: 6,
    keywords: ["age", "senior", "older", "designed for", "who is this for"],
    question: "Is this app designed specifically for seniors?",
    answer: "Yes! SteadiDay is designed specifically for adults 50+ who want to stay independent. We use large text, simple navigation, and helpful safety features like fall detection and emergency SOS."
  },
  {
    id: "gs-8",
    category: "getting-started",
    priority: 7,
    keywords: ["offline", "internet", "wifi", "no connection", "airplane"],
    question: "Does the app work without an internet connection?",
    answer: "Most features work offline, including viewing your medications and tasks, and using the SOS button. You'll need internet to sync with calendars or Apple Health."
  },
  {
    id: "gs-9",
    category: "getting-started",
    priority: 8,
    keywords: ["ipad", "tablet", "device", "iphone only"],
    question: "Can I use SteadiDay on my iPad?",
    answer: "Yes! SteadiDay works great on both iPhone and iPad. The app adjusts to fit your screen size, so use whichever device is most comfortable for you.",
    platforms: ["ios"]
  },
  {
    id: "gs-10",
    category: "getting-started",
    priority: 9,
    keywords: ["language", "spanish", "other language", "translate", "english"],
    question: "Is the app available in languages other than English?",
    answer: "Yes! SteadiDay supports 9 languages including Spanish, Chinese, French, German, and more. Go to Settings > Language to change your preferred language."
  },

  // =========================================================================
  // MEDICATIONS (15 FAQs)
  // =========================================================================
  {
    id: "med-1",
    category: "medications",
    priority: 1,
    keywords: ["add", "medication", "medicine", "pill", "new", "create", "prescription", "drug", "enter"],
    question: "How do I add a new medication to my list?",
    answer: "Go to the Meds tab and tap 'Add a Medication'. Enter the name, dosage, and how often you take it. You can also add a photo of the pill bottle to help identify it later.",
    actions: [{ label: "Add Medication Now", type: "navigate", target: "AddMedication", icon: "💊" }],
    isHealth: true
  },
  {
    id: "med-2",
    category: "medications",
    priority: 2,
    keywords: ["mark", "taken", "check", "complete", "dose", "took", "medication", "done"],
    question: "How do I mark a medication as taken?",
    answer: "On the Meds tab, tap the circle next to any medication to mark it as taken. You'll see a checkmark and the time you took it. Tap again to undo if you made a mistake."
  },
  {
    id: "med-3",
    category: "medications",
    priority: 3,
    keywords: ["multiple", "reminder", "times", "twice", "three", "frequency", "schedule", "doses"],
    question: "Can I set multiple reminder times for one medication?",
    answer: "Yes! When adding a medication, choose how often you take it (like 'Twice a day') and set the specific times for each dose. You'll get a separate reminder for each time."
  },
  {
    id: "med-4",
    category: "medications",
    priority: 6,
    keywords: ["pharmacy", "refill", "prescription", "drugstore", "phone", "address", "order"],
    question: "How do I add my pharmacy's information?",
    answer: "When adding or editing a medication, scroll down to the Pharmacy section. Add your pharmacy's name, phone number, and address so you can quickly contact them when you need a refill."
  },
  {
    id: "med-5",
    category: "medications",
    priority: 4,
    keywords: ["edit", "change", "update", "modify", "medication", "dosage", "time"],
    question: "How do I edit or update a medication?",
    answer: "Swipe left on any medication to reveal the Edit button. Tap it to change the name, dosage, times, or any other details. Don't forget to tap Save when you're done!"
  },
  {
    id: "med-6",
    category: "medications",
    priority: 5,
    keywords: ["delete", "remove", "medication", "stop", "discontinue", "no longer"],
    question: "How do I delete a medication I no longer take?",
    answer: "Swipe left on the medication card to reveal the Delete button. Tap it and confirm to remove. This can't be undone, so make sure you no longer need to track that medication."
  },
  {
    id: "med-7",
    category: "medications",
    priority: 7,
    keywords: ["photo", "picture", "image", "scan", "camera", "bottle", "pill"],
    question: "Can I add a photo of my medication bottle?",
    answer: "Yes! When adding or editing a medication, tap 'Add Photo' to take a picture. This is helpful for identifying the right pill, especially if you take several medications."
  },
  {
    id: "med-8",
    category: "medications",
    priority: 8,
    keywords: ["as needed", "prn", "occasional", "sometimes", "not daily", "when needed", "one time"],
    question: "What frequency options are available for medications?",
    answer: "You can choose: Once daily, Twice daily, Three times daily, or Four times daily. Set specific times for each dose, and you'll receive reminders at those times."
  },
  {
    id: "med-9",
    category: "medications",
    priority: 9,
    keywords: ["history", "log", "past", "record", "when did i take", "track"],
    question: "How can I see my medication history?",
    answer: "Tap any medication to see its details page, then look for 'History' to see when you've taken it. This helps you track your adherence over time."
  },
  {
    id: "med-10",
    category: "medications",
    priority: 10,
    keywords: ["snooze", "later", "remind again", "postpone", "not now", "notification"],
    question: "What happens when I receive a medication reminder?",
    answer: "When a medication reminder pops up, tap it to open the app and mark it as taken. If you're not ready yet, just dismiss it and mark it later from the Meds tab."
  },
  {
    id: "med-11",
    category: "medications",
    priority: 11,
    keywords: ["missed", "forgot", "skipped", "late", "didnt take"],
    question: "What happens if I miss a medication dose?",
    answer: "The medication will show as 'Missed' if you don't mark it in time. You can still mark it as taken late, or mark it as skipped. Always check with your doctor about what to do if you miss doses."
  },
  {
    id: "med-12",
    category: "medications",
    priority: 12,
    keywords: ["notes", "instructions", "special", "with food", "doctor", "directions", "details"],
    question: "What information can I add for each medication?",
    answer: "You can add the medication name, dosage amount, frequency, specific reminder times, and a photo. For special instructions like 'take with food', you can add notes in the Instructions field."
  },
  {
    id: "med-13",
    category: "medications",
    priority: 13,
    keywords: ["running low", "supply", "count", "pills left", "quantity", "inventory", "refill", "pharmacy"],
    question: "How do I remember when to refill my prescriptions?",
    answer: "Create a recurring task in the Tasks tab to remind yourself to check your medication supply. Set it to repeat weekly or monthly depending on how often you need refills."
  },
  {
    id: "med-14",
    category: "medications",
    priority: 14,
    keywords: ["doctor", "prescriber", "physician", "who prescribed", "provider", "care team"],
    question: "How do I keep track of my doctors' information?",
    answer: "Use the Care Team tab to store your doctors' information. Add their name, specialty, phone number, and address so everything is in one easy-to-find place."
  },
  {
    id: "med-15",
    category: "medications",
    priority: 15,
    keywords: ["apple health", "import", "automatic", "health records", "sync medications"],
    question: "Can I import medications from Apple Health?",
    answer: "Yes! Go to Settings > Connected Apps > Apple Health and enable the connection. Medications from your health records can sync to SteadiDay automatically.",
    androidAnswer: "Medication import from Health Connect is not currently available. You can add medications manually in the Meds tab — tap 'Add a Medication' to get started."
  },

  // =========================================================================
  // TASKS & REMINDERS (12 FAQs)
  // =========================================================================
  {
    id: "task-1",
    category: "tasks",
    priority: 1,
    keywords: ["add", "create", "new", "task", "reminder", "todo", "to-do"],
    question: "How do I create a new task or reminder?",
    answer: "Go to the Tasks tab and tap the green 'Add a Task' button. Give it a name, choose a category, select how often it repeats, and toggle on a reminder if you'd like one."
  },
  {
    id: "task-2",
    category: "tasks",
    priority: 2,
    keywords: ["reminder", "alert", "notify", "notification", "time", "when"],
    question: "How do I set up a reminder for a task?",
    answer: "When creating a task, toggle on 'Do you want a reminder?' at the bottom. You can choose when to be reminded: at the time of the task, or 5, 15, or 30 minutes before."
  },
  {
    id: "task-3",
    category: "tasks",
    priority: 3,
    keywords: ["recurring", "repeat", "daily", "weekly", "monthly", "schedule", "repeating", "every", "frequency"],
    question: "How do I create a task that repeats automatically?",
    answer: "When adding a task, choose a frequency: One time, Daily, Twice daily, Three times daily, Every other day, Weekly, or Monthly. The task will automatically repeat on that schedule."
  },
  {
    id: "task-4",
    category: "tasks",
    priority: 4,
    keywords: ["complete", "done", "finish", "check off", "mark complete"],
    question: "How do I mark a task as completed?",
    answer: "Tap the circle next to any task to mark it complete. It will show a checkmark and move to the completed section. For recurring tasks, it resets automatically for the next scheduled time."
  },
  {
    id: "task-5",
    category: "tasks",
    priority: 5,
    keywords: ["delete", "remove", "task", "cancel", "get rid of"],
    question: "How do I delete a task I no longer need?",
    answer: "Swipe left on any task to reveal the Delete button. Tap it and confirm to remove the task permanently from your list."
  },
  {
    id: "task-6",
    category: "tasks",
    priority: 6,
    keywords: ["edit", "change", "update", "modify", "task"],
    question: "How do I edit an existing task?",
    answer: "Swipe left on a task to reveal the Edit button. You can change the name, time, frequency, or reminder settings. Tap Save when you're done making changes."
  },
  {
    id: "task-7",
    category: "tasks",
    priority: 7,
    keywords: ["appointment", "doctor", "event", "meeting", "schedule"],
    question: "How do I add doctor appointments to my tasks?",
    answer: "Create a task with your appointment details and set a reminder. If you use Apple Calendar, connect it in Settings > Connected Apps and your appointments will appear automatically."
  },
  {
    id: "task-8",
    category: "tasks",
    priority: 8,
    keywords: ["today", "tomorrow", "upcoming", "view", "see", "list", "week"],
    question: "How do I see only today's tasks?",
    answer: "On the Tasks screen, tap 'Today' at the top to see only today's tasks, or 'Week' to see the full week ahead. Today's tasks also appear on your Home screen for quick access."
  },
  {
    id: "task-9",
    category: "tasks",
    priority: 9,
    keywords: ["reorder", "rearrange", "priority", "order", "move", "sort"],
    question: "Can I change the order of my tasks?",
    answer: "Tasks are sorted by time automatically, with earlier tasks at the top. To change the order, edit the task times to move them up or down in the list."
  },
  {
    id: "task-10",
    category: "tasks",
    priority: 10,
    keywords: ["template", "quick add", "common", "preset", "routine", "browse"],
    question: "Are there pre-made task templates I can use?",
    answer: "Yes! Tap 'Browse Templates' on the Tasks screen to see common tasks like doctor appointments, errands, and daily routines. Tap one to quickly add it with pre-set options."
  },
  {
    id: "task-11",
    category: "tasks",
    priority: 11,
    keywords: ["all day", "no time", "anytime", "flexible"],
    question: "Can I create a task without a specific time?",
    answer: "Yes! When creating a task, you can leave the time blank to create an all-day task. It will appear in your list without a specific time attached."
  },
  {
    id: "task-12",
    category: "tasks",
    priority: 12,
    keywords: ["overdue", "past due", "missed", "late", "forgot"],
    question: "What happens to tasks that are overdue?",
    answer: "One-time tasks pass after their date if not completed. Recurring tasks automatically reset for the next occurrence. Enable reminders to help avoid missing important tasks."
  },

  // =========================================================================
  // EMERGENCY & SAFETY (10 FAQs)
  // =========================================================================
  {
    id: "sos-1",
    category: "emergency",
    priority: 1,
    keywords: ["emergency", "sos", "help", "911", "call", "urgent", "panic", "button"],
    question: "How do I use the SOS emergency button?",
    answer: "Tap the red SOS button on your Home screen. You can call 911 directly, or contact your trusted contact. When you contact your trusted contact, your location is automatically shared so they know where you are.",
    isSafety: true
  },
  {
    id: "sos-2",
    category: "emergency",
    priority: 2,
    keywords: ["emergency", "contact", "trusted", "add", "family", "caregiver", "person", "edit", "change"],
    question: "How do I add someone as my trusted contact?",
    answer: "Go to Settings > Safety Features and tap 'Add Trusted Contact'. You can type their info manually or tap 'Import from Phone Contacts' to select someone from your address book.",
    actions: [{ label: "Add Trusted Contact", type: "navigate", target: "EmergencyContacts", icon: "👥" }],
    isSafety: true
  },
  {
    id: "sos-3",
    category: "emergency",
    priority: 3,
    keywords: ["location", "share", "gps", "where", "find me", "emergency", "send"],
    question: "Can I share my location during an emergency?",
    answer: "Yes! When you use SOS to contact your trusted contact, your current location is automatically included in the message. Make sure location services are enabled for SteadiDay in your iPhone settings.",
    androidAnswer: "Yes! When you use SOS to contact your trusted contact, your current location is automatically included in the message. Make sure location services are enabled for SteadiDay in your phone's Settings > Apps > SteadiDay > Permissions.",
    isSafety: true
  },
  {
    id: "sos-4",
    category: "emergency",
    priority: 4,
    keywords: ["fall", "detection", "detect", "fell", "accident", "automatic", "fallen", "safety", "session"],
    question: "How does fall detection work?",
    answer: "Start a Safety Session from your Home screen. While the session is active, SteadiDay uses your phone's sensors to detect if you may have fallen. If a fall is detected, you'll be asked if you're okay. If you don't respond in 30 seconds, your trusted contact is alerted with your location.",
    isSafety: true
  },
  {
    id: "sos-5",
    category: "emergency",
    priority: 5,
    keywords: ["fall", "enable", "turn on", "activate", "setup", "detection", "safety", "session", "start"],
    question: "How do I turn on fall detection?",
    answer: "Tap 'Start Safety Session' on your Home screen. The first time, you'll see a quick guide explaining how it works. Fall detection stays active while the app is open. You can end the session anytime.",
    isSafety: true
  },
  {
    id: "sos-6",
    category: "emergency",
    priority: 6,
    keywords: ["false", "alarm", "accident", "did not fall", "mistake", "cancel"],
    question: "What if fall detection triggers by mistake?",
    answer: "No problem! When a fall is detected, you'll be asked if you're okay. Just tap 'I'm OK' and nothing happens. Some quick movements may occasionally trigger it.",
    isSafety: true
  },
  {
    id: "sos-7",
    category: "emergency",
    priority: 7,
    keywords: ["sos", "free", "always", "available", "safety", "cost"],
    question: "Is the SOS emergency feature free to use?",
    answer: "Yes! The SOS emergency button is completely free for all users and cannot be removed from your Home screen. Your safety is our top priority.",
    isSafety: true
  },
  {
    id: "sos-8",
    category: "emergency",
    priority: 8,
    keywords: ["multiple", "emergency", "contacts", "more than one", "several", "trusted", "how many"],
    question: "Can I add multiple trusted contacts?",
    answer: "You can add as many trusted contacts as you need, so you always have backup people to reach in an emergency."
  },
  {
    id: "sos-9",
    category: "emergency",
    priority: 9,
    keywords: ["test", "try", "practice", "sos", "check", "works"],
    question: "How can I test the SOS feature without calling anyone?",
    answer: "You can tap the SOS button to see the options without making an actual call. Just don't tap 'Call 911' or 'Call Contact' unless it's a real emergency."
  },
  {
    id: "sos-10",
    category: "emergency",
    priority: 10,
    keywords: ["medical", "id", "information", "allergies", "conditions", "health"],
    question: "Can I store my medical information for emergencies?",
    answer: "For security, we recommend using Apple Health's Medical ID for this. Go to the Health app > Profile > Medical ID to add allergies, conditions, and emergency contacts that first responders can access.",
    androidAnswer: "SteadiDay doesn't currently store medical ID information. You can use your Care Team tab to keep your doctors' contact details handy. Some Android phones support medical information on the lock screen — check your phone's Settings > Safety & Emergency."
  },
  {
    id: "sos-11",
    category: "emergency",
    priority: 11,
    keywords: ["background", "close", "app", "killed", "not open", "session", "paused"],
    question: "Does fall detection work when the app is closed?",
    answer: "Fall detection only works during an active Safety Session while SteadiDay is open. Your phone can be locked, but don't swipe the app closed. If the app goes to the background, you'll get a reminder notification to come back.",
    isSafety: true
  },

  // =========================================================================
  // SYNCING & CONNECTED APPS (12 FAQs)
  // =========================================================================
  {
    id: "sync-1",
    category: "syncing",
    priority: 1,
    keywords: ["apple", "calendar", "sync", "connect", "import", "events", "ical"],
    question: "How do I sync my Apple Calendar with SteadiDay?",
    answer: "Go to Settings > Connected Apps > Apple Calendar and toggle it on. Grant calendar access when prompted. Your events will appear in SteadiDay alongside your tasks."
  },
  {
    id: "sync-2",
    category: "syncing",
    priority: 2,
    keywords: ["apple", "reminders", "sync", "connect", "import", "ios"],
    question: "How do I sync my Apple Reminders?",
    answer: "Go to Settings > Connected Apps > Apple Reminders and toggle it on. Your Apple reminders will appear as tasks in SteadiDay so everything is in one place.",
    platforms: ["ios"]
  },
  {
    id: "sync-3",
    category: "syncing",
    priority: 3,
    keywords: ["google", "calendar", "sync", "connect", "gmail", "android"],
    question: "Can I sync with Google Calendar?",
    answer: "Google Calendar sync isn't available yet, but we're working on adding it in a future update. For now, you can sync with Apple Calendar and Apple Reminders.",
    androidAnswer: "Yes! Google Calendar is already available on Android. Go to Settings > Connected Apps > Google Calendar and sign in with your Google account. Your events will appear in SteadiDay alongside your tasks."
  },
  {
    id: "sync-4",
    category: "syncing",
    priority: 4,
    keywords: ["two-way", "both ways", "changes", "update", "sync back", "direction"],
    question: "Does syncing work both ways?",
    answer: "Syncing is one-way: events from Apple Calendar and Reminders are imported into SteadiDay so you can see everything together. Pull down on the screen to refresh and get the latest updates.",
    androidAnswer: "Syncing is one-way: events from Google Calendar are imported into SteadiDay so you can see everything together. Pull down on the screen to refresh and get the latest updates."
  },
  {
    id: "sync-5",
    category: "syncing",
    priority: 5,
    keywords: ["refresh", "update", "pull", "swipe", "reload", "manual"],
    question: "How do I refresh my synced data?",
    answer: "Pull down (swipe from top) on the Tasks or Meds screen to refresh. You'll see 'Synced successfully' when complete. This requires an internet connection."
  },
  {
    id: "sync-6",
    category: "syncing",
    priority: 6,
    keywords: ["apple health", "health", "connect", "metrics", "steps", "heart", "data"],
    question: "How do I connect Apple Health to see my vitals?",
    answer: "Go to Settings > Connected Apps > Apple Health and choose which data to share, like steps and heart rate. Your health metrics will then appear in the Health tab."
  },
  {
    id: "sync-7",
    category: "syncing",
    priority: 7,
    keywords: ["health records", "medical", "lab", "results", "doctor", "hospital"],
    question: "Can I see my medical health records in SteadiDay?",
    answer: "For security and privacy, SteadiDay doesn't access clinical health records. You can view those directly in Apple Health by connecting your healthcare provider there."
  },
  {
    id: "sync-8",
    category: "syncing",
    priority: 8,
    keywords: ["disconnect", "remove", "unlink", "stop", "turn off", "disable"],
    question: "How do I disconnect a synced app?",
    answer: "Go to Settings > Connected Apps and toggle off the app you want to disconnect. Your existing data in SteadiDay stays, but it won't sync new updates anymore."
  },
  {
    id: "sync-9",
    category: "syncing",
    priority: 9,
    keywords: ["automatic", "background", "sync", "battery", "manual"],
    question: "Does syncing happen automatically in the background?",
    answer: "To save battery, syncing happens when you pull down to refresh rather than constantly in the background. Pull down anytime to get the latest data from your connected apps."
  },
  {
    id: "sync-10",
    category: "syncing",
    priority: 10,
    keywords: ["which", "calendars", "choose", "select", "specific"],
    question: "Can I choose which specific calendars to sync?",
    answer: "Yes! After connecting Apple Calendar, go to Settings > Connected Apps and tap on it to select which specific calendars you want to show in SteadiDay."
  },
  {
    id: "sync-11",
    category: "syncing",
    priority: 11,
    keywords: ["events", "not showing", "missing", "calendar", "can not see"],
    question: "Why aren't my calendar events showing up?",
    answer: "Make sure the calendar is connected in Settings > Connected Apps. Pull down to refresh. Only events from the next 90 days are synced. Check that the specific calendar is selected in settings."
  },
  {
    id: "sync-12",
    category: "syncing",
    priority: 12,
    keywords: ["contacts", "import", "phone", "address book"],
    question: "Can I import contacts from my phone's address book?",
    answer: "Yes! When adding a trusted contact, tap 'Import from Phone Contacts' to select from your address book instead of typing all the information manually."
  },

  // =========================================================================
  // HEALTH TRACKING (12 FAQs)
  // =========================================================================
  {
    id: "health-1",
    category: "health",
    priority: 1,
    keywords: ["water", "hydration", "drink", "fluid", "track", "glass", "intake", "cups"],
    question: "How do I track my daily water intake?",
    answer: "Go to the Tools tab > Water Tracker. Tap the + button each time you drink a glass of water. You'll see your progress toward the daily goal of 8 glasses filling up throughout the day!"
  },
  {
    id: "health-2",
    category: "health",
    priority: 2,
    keywords: ["water", "goal", "target", "glasses", "how much", "daily"],
    question: "How much water should I be drinking daily?",
    answer: "The Water Tracker uses a goal of 8 glasses per day, which is a common recommendation for adults. Your progress shows as a ring that fills up as you log each glass throughout the day."
  },
  {
    id: "health-3",
    category: "health",
    priority: 3,
    keywords: ["food", "meal", "eat", "nutrition", "breakfast", "lunch", "dinner", "log", "track"],
    question: "How do I log my meals in the Food Tracker?",
    answer: "Go to the Tools tab > Food Tracker. Tap + to add what you ate for breakfast, lunch, dinner, or snacks. You can search for foods in our database or create your own custom entries."
  },
  {
    id: "health-4",
    category: "health",
    priority: 4,
    keywords: ["food", "search", "find", "database", "lookup"],
    question: "How do I search for a food to log?",
    answer: "In the Food Tracker, type the food name in the search bar at the top. We have thousands of common foods in our database. If you can't find something, tap 'Add Custom' to create your own entry."
  },
  {
    id: "health-5",
    category: "health",
    priority: 5,
    keywords: ["barcode", "scan", "packaged", "food", "label", "custom", "portion"],
    question: "How do I add a custom food to the tracker?",
    answer: "Search for the food name, or type any name to create a custom entry. Choose a portion size (Small, Medium, Large) and a health label (Healthy, Neutral, Treat). The app will estimate calories for you."
  },
  {
    id: "health-6",
    category: "health",
    priority: 6,
    keywords: ["calories", "nutrition", "macros", "carbs", "protein", "fat", "track"],
    question: "Does the Food Tracker count calories?",
    answer: "Yes! The Food Tracker estimates calories based on portion size. Your daily total appears at the top with a progress ring showing how much of your 2,000 calorie goal you've consumed."
  },
  {
    id: "health-7",
    category: "health",
    priority: 7,
    keywords: ["steps", "walking", "activity", "exercise", "movement"],
    question: "How do I see my daily step count?",
    answer: "Go to Settings > Connected Apps > Apple Health and enable the connection. Once connected, your daily steps will appear on your Home screen and in the Health tab.",
    androidAnswer: "Go to Settings > Connected Apps > Health Connect and enable the connection. Once connected, your daily steps will appear on your Home screen and in the Health tab."
  },
  {
    id: "health-8",
    category: "health",
    priority: 8,
    keywords: ["heart", "rate", "pulse", "bpm", "heart rate"],
    question: "Can I see my heart rate in the app?",
    answer: "Connect Apple Health in Settings > Connected Apps. If you have an Apple Watch or compatible device that records heart rate, that data will appear in the Health tab.",
    androidAnswer: "Connect Health Connect in Settings > Connected Apps. If you have a fitness tracker or smartwatch that records heart rate to Health Connect, that data will appear in the Health tab."
  },
  {
    id: "health-9",
    category: "health",
    priority: 9,
    keywords: ["weight", "track", "log", "pounds", "scale"],
    question: "How do I track my weight over time?",
    answer: "Connect Apple Health to see weight data from your smart scale. You can also log weight manually in the Apple Health app, and it will sync to SteadiDay automatically.",
    androidAnswer: "Connect Health Connect to see weight data from your smart scale. You can also log weight in any app that syncs to Health Connect, and it will appear in SteadiDay automatically."
  },
  {
    id: "health-10",
    category: "health",
    priority: 10,
    keywords: ["blood pressure", "bp", "systolic", "diastolic", "enter", "manual"],
    question: "Can I track my blood pressure readings?",
    answer: "Yes! In the Health tab, you can manually enter your blood pressure readings including systolic and diastolic values. This helps you keep a record over time to share with your doctor."
  },
  {
    id: "health-11",
    category: "health",
    priority: 11,
    keywords: ["lab", "results", "test", "blood work", "cholesterol", "health", "tab"],
    question: "What health metrics can I see in the Health tab?",
    answer: "The Health tab shows your steps, heart rate, exercise minutes, sleep, and weight synced from Apple Health. You can also manually enter blood pressure readings to track over time.",
    androidAnswer: "The Health tab shows your steps, heart rate, exercise minutes, sleep, and weight synced from Health Connect. You can also manually enter blood pressure readings to track over time."
  },
  {
    id: "health-12",
    category: "health",
    priority: 12,
    keywords: ["history", "trends", "past", "over time", "progress"],
    question: "Can I see my health history and trends over time?",
    answer: "The Health tab shows today's metrics. For detailed history, graphs, and trends over time, we recommend checking the Apple Health app, which provides comprehensive health insights.",
    androidAnswer: "The Health tab shows today's metrics. For detailed history, graphs, and trends over time, check the Health Connect app or your fitness tracker's companion app for comprehensive health insights."
  },

  // =========================================================================
  // ACCESSIBILITY (10 FAQs)
  // =========================================================================
  {
    id: "access-1",
    category: "accessibility",
    priority: 1,
    keywords: ["text", "size", "bigger", "larger", "font", "read", "small", "increase"],
    question: "How do I make the text larger and easier to read?",
    answer: "Go to Settings > Text Size & Accessibility. Choose from Regular, Large, or Extra Large. The entire app will adjust to your preferred size for easier reading."
  },
  {
    id: "access-2",
    category: "accessibility",
    priority: 2,
    keywords: ["dark", "mode", "night", "light", "bright", "theme", "black"],
    question: "How do I switch to dark mode?",
    answer: "Go to Settings > Appearance and choose 'Dark' mode. You can also select 'System' to automatically match your iPhone's settings (dark at night, light during day).",
    androidAnswer: "Go to Settings > Appearance and choose 'Dark' mode. You can also select 'System' to automatically match your phone's settings (dark at night, light during day)."
  },
  {
    id: "access-3",
    category: "accessibility",
    priority: 3,
    keywords: ["color", "theme", "appearance", "change", "look", "style", "scheme"],
    question: "How do I change the app's color theme?",
    answer: "Go to Settings > Appearance > Theme. Choose from Warm Cream, Soft Blue, Sage Green, Lavender, or other themes. Pick what's most comfortable and easy on your eyes."
  },
  {
    id: "access-4",
    category: "accessibility",
    priority: 4,
    keywords: ["contrast", "high", "visibility", "see", "bold", "easier"],
    question: "Is there a high contrast mode for better visibility?",
    answer: "Yes! Go to Settings > Text Size & Accessibility and turn on 'High Contrast'. This makes text and buttons more visible with stronger color differences."
  },
  {
    id: "access-5",
    category: "accessibility",
    priority: 5,
    keywords: ["voiceover", "screen reader", "blind", "speak", "read aloud"],
    question: "Does the app work with VoiceOver screen reader?",
    answer: "Yes! SteadiDay is designed to work with iPhone's VoiceOver screen reader. All buttons and content have accessibility labels so VoiceOver can describe them properly.",
    androidAnswer: "Yes! SteadiDay is designed to work with Android's TalkBack screen reader. All buttons and content have accessibility labels so TalkBack can describe them properly."
  },
  {
    id: "access-6",
    category: "accessibility",
    priority: 6,
    keywords: ["sounds", "volume", "audio", "mute", "silent", "notifications"],
    question: "How do I change or turn off notification sounds?",
    answer: "Go to Settings > Sounds & Haptics. You can change sounds for medication reminders, task alerts, and other notifications, or turn them off entirely if you prefer silence."
  },
  {
    id: "access-7",
    category: "accessibility",
    priority: 7,
    keywords: ["vibration", "haptic", "buzz", "feel", "tactile"],
    question: "Can I turn off the vibration feedback?",
    answer: "Yes! Go to Settings > Sounds & Haptics and toggle off 'Haptic Feedback'. The app will no longer vibrate when you tap buttons or complete actions."
  },
  {
    id: "access-8",
    category: "accessibility",
    priority: 8,
    keywords: ["reduce", "motion", "animation", "movement", "dizzy", "motion sickness"],
    question: "Can I reduce the animations if they bother me?",
    answer: "SteadiDay respects your iPhone's 'Reduce Motion' setting. Go to iPhone Settings > Accessibility > Motion > Reduce Motion to minimize animations throughout the app.",
    androidAnswer: "SteadiDay respects your phone's animation settings. Go to phone Settings > Accessibility > Remove Animations (or Settings > Developer Options > reduce animation scale) to minimize animations throughout the app."
  },
  {
    id: "access-9",
    category: "accessibility",
    priority: 9,
    keywords: ["color blind", "colorblind", "red green", "deuteranopia", "protanopia"],
    question: "Is there a colorblind-friendly mode?",
    answer: "Our themes are designed with accessibility in mind. The Soft Blue and Sage Green themes work well for most types of color vision differences. High contrast mode also helps distinguish elements."
  },
  {
    id: "access-10",
    category: "accessibility",
    priority: 10,
    keywords: ["button", "size", "tap", "touch", "target", "hit"],
    question: "Can the buttons be made larger for easier tapping?",
    answer: "Our buttons are already larger than standard (56pt minimum) for easier tapping. Increasing your text size in Settings > Text Size & Accessibility also makes some interactive elements larger."
  },

  // =========================================================================
  // PREMIUM & BILLING — v1.0: IAP disabled, section hidden from FAQ categories
  // These entries are kept for reference but the "premium" category is removed
  // from FAQ_CATEGORIES so they won't be shown to users
  // =========================================================================

  // =========================================================================
  // PRIVACY & SECURITY (10 FAQs)
  // =========================================================================
  {
    id: "priv-1",
    category: "privacy",
    priority: 1,
    keywords: ["data", "secure", "safe", "privacy", "information", "server", "stored"],
    question: "Is my personal health data secure?",
    answer: "Yes! Your health and medication data stays on your device and is encrypted. We don't upload your personal health information to any servers. Your privacy is our top priority."
  },
  {
    id: "priv-2",
    category: "privacy",
    priority: 2,
    keywords: ["pin", "passcode", "lock", "code", "4 digit", "password"],
    question: "How do I set up a PIN to lock the app?",
    answer: "Go to Settings > Security and toggle on 'App Lock'. You'll be prompted to create a 4-digit PIN. You'll need to enter it each time you open the app to keep your information private."
  },
  {
    id: "priv-3",
    category: "privacy",
    priority: 3,
    keywords: ["face id", "touch id", "fingerprint", "biometric", "unlock"],
    question: "How do I enable Face ID or Touch ID to unlock?",
    answer: "First set up a PIN in Settings > Security, then toggle on 'Use Face ID' (or Touch ID). This gives you quick access while keeping your PIN as a backup option."
  },
  {
    id: "priv-4",
    category: "privacy",
    priority: 4,
    keywords: ["delete", "data", "remove", "erase", "clear", "account", "all"],
    question: "How do I delete all my data from the app?",
    answer: "Go to Settings > Security and scroll to 'Delete My Data'. You can delete specific categories or everything at once. Warning: This action can't be undone, so please be certain before proceeding."
  },
  {
    id: "priv-5",
    category: "privacy",
    priority: 5,
    keywords: ["export", "download", "backup", "copy", "my data"],
    question: "Can I download or export a copy of my data?",
    answer: "Yes! Go to Settings > Security and find 'Download My Data'. You can save a copy of your medications, tasks, and other information as a file for your records."
  },
  {
    id: "priv-6",
    category: "privacy",
    priority: 6,
    keywords: ["share", "who", "access", "see", "data", "third party"],
    question: "Who else can see my data?",
    answer: "Only you can see your data unless you choose to share it (like your Care Summary with family). We never sell your data and don't even have access to your health information - it stays on your device."
  },
  {
    id: "priv-7",
    category: "privacy",
    priority: 7,
    keywords: ["privacy", "policy", "terms", "legal", "agreement"],
    question: "Where can I read the privacy policy?",
    answer: "Go to Settings > Legal & Privacy > Privacy Policy. You can also find it on our website at steadiday.com/privacy. We explain exactly how we handle your information in plain language."
  },
  {
    id: "priv-8",
    category: "privacy",
    priority: 8,
    keywords: ["timeout", "auto lock", "automatic", "inactivity", "session"],
    question: "Does the app lock automatically when I'm not using it?",
    answer: "Yes, if you have a PIN set up, the app locks when you close it or switch to another app. Go to Settings > Security to manage your lock settings and preferences."
  },
  {
    id: "priv-9",
    category: "privacy",
    priority: 9,
    keywords: ["permissions", "access", "allow", "camera", "location", "microphone"],
    question: "Why does the app ask for various permissions?",
    answer: "We only ask for what we need: Camera (for medication and insurance photos), Location (for SOS emergencies), Calendar (for syncing), Health (for tracking). You can deny any permission you're not comfortable with."
  },
  {
    id: "priv-10",
    category: "privacy",
    priority: 10,
    keywords: ["analytics", "tracking", "usage", "collect", "anonymous"],
    question: "Do you collect any analytics or usage data?",
    answer: "We collect minimal, anonymous usage data to improve the app (like which features are most popular). We never collect your health data, medications, or any personal information."
  },

  // =========================================================================
  // TROUBLESHOOTING (20 FAQs)
  // =========================================================================
  {
    id: "trouble-1",
    category: "troubleshooting",
    priority: 1,
    keywords: ["notification", "not working", "no alerts", "reminder", "did not get", "missing", "silent", "no notification"],
    question: "I'm not receiving any notifications or reminders",
    answer: "First, check that notifications are enabled: go to iPhone Settings > SteadiDay > Notifications and make sure they're on. Also check that Do Not Disturb is off. Try toggling notifications off and back on if they're still not working.",
    androidAnswer: "First, check that notifications are enabled: go to phone Settings > Apps > SteadiDay > Notifications and make sure they're on. Also check that Do Not Disturb is off. Make sure battery optimization isn't restricting SteadiDay — go to Settings > Apps > SteadiDay > Battery and select 'Unrestricted'."
  },
  {
    id: "trouble-2",
    category: "troubleshooting",
    priority: 2,
    keywords: ["crash", "freeze", "stuck", "not responding", "will not open", "closes", "black screen", "freezing"],
    question: "The app keeps crashing or freezing",
    answer: "Try these steps: 1) Force close the app (swipe up from bottom, swipe SteadiDay away). 2) Restart your iPhone. 3) Check the App Store for updates. 4) If it still doesn't work, try deleting and reinstalling - your synced data will restore.",
    androidAnswer: "Try these steps: 1) Force close the app (open recent apps, swipe SteadiDay away). 2) Restart your phone. 3) Check the Google Play Store for updates. 4) If it still doesn't work, try clearing the app cache in Settings > Apps > SteadiDay > Storage > Clear Cache."
  },
  {
    id: "trouble-3",
    category: "troubleshooting",
    priority: 3,
    keywords: ["sync", "not working", "will not sync", "calendar", "failed", "error", "not syncing"],
    question: "My calendar or health data isn't syncing",
    answer: "Check your internet connection first. Then go to Settings > Connected Apps and make sure the service is still connected (the toggle may have reset). Try disconnecting and reconnecting. Pull down on the screen to manually refresh."
  },
  {
    id: "trouble-4",
    category: "troubleshooting",
    priority: 4,
    keywords: ["data", "lost", "missing", "gone", "disappeared", "medications", "tasks", "where"],
    question: "My medications or tasks seem to be missing",
    answer: "Don't worry - your data is stored safely on your device. Try pulling down on each screen to refresh. If you recently updated the app, wait a moment for data to reload. Also check that you're signed into the correct account."
  },
  {
    id: "trouble-5",
    category: "troubleshooting",
    priority: 5,
    keywords: ["battery", "drain", "power", "using", "too much", "hot", "overheating"],
    question: "The app seems to be draining my battery",
    answer: "SteadiDay is designed to use minimal battery. Try disabling background sync in Settings > Connected Apps if you have it enabled. Make sure you're on the latest app version. If problems persist, try reinstalling."
  },
  {
    id: "trouble-6",
    category: "troubleshooting",
    priority: 6,
    keywords: ["face id", "not working", "touch id", "biometric", "will not unlock", "fingerprint", "does not recognize"],
    question: "Face ID or Touch ID isn't working to unlock the app",
    answer: "Go to Settings > Security and toggle Face ID (or Touch ID) off, then back on. Make sure biometrics work in other apps on your phone. Your PIN always works as a backup way to unlock."
  },
  {
    id: "trouble-7",
    category: "troubleshooting",
    priority: 7,
    keywords: ["purchase", "did not work", "charged", "no premium", "payment", "failed", "money"],
    question: "I was charged but don't have Premium access",
    answer: "Go to Settings > Manage Subscription > Restore Purchases. Make sure you're signed into the same Apple ID you used for the purchase. If it's still not working, check iPhone Settings > [Your Name] > Subscriptions to verify the purchase went through.",
    androidAnswer: "Go to Settings > Manage Subscription > Restore Purchases. Make sure you're signed into the same Google account you used for the purchase. If it's still not working, check Google Play Store > Profile > Payments & Subscriptions to verify the purchase went through."
  },
  {
    id: "trouble-8",
    category: "troubleshooting",
    priority: 8,
    keywords: ["slow", "laggy", "takes long", "loading", "waiting", "spinning"],
    question: "The app feels slow or takes a long time to load",
    answer: "Try closing other apps running in the background. Check your iPhone storage (Settings > General > iPhone Storage) - the app works best with 500MB+ free space. Restart your phone and make sure you have the latest app version.",
    androidAnswer: "Try closing other apps running in the background. Check your phone's storage (Settings > Storage) — the app works best with 500MB+ free space. Restart your phone and make sure you have the latest app version from the Google Play Store."
  },
  {
    id: "trouble-9",
    category: "troubleshooting",
    priority: 9,
    keywords: ["sound", "no sound", "silent", "audio", "can not hear", "volume", "mute"],
    question: "I can't hear any sounds from the app",
    answer: "Check the silent switch on the side of your iPhone (make sure it's not showing orange). Go to SteadiDay Settings > Sounds & Haptics and make sure sounds are enabled. Also check your iPhone's volume level and try restarting the app.",
    platforms: ["ios"]
  },
  {
    id: "trouble-9-android",
    category: "troubleshooting",
    priority: 9,
    keywords: ["sound", "no sound", "silent", "audio", "can not hear", "volume", "mute"],
    question: "I can't hear any sounds from the app",
    answer: "Check that your phone's volume is turned up (use the volume buttons). Go to SteadiDay Settings > Sounds & Haptics and make sure sounds are enabled. Also check that Do Not Disturb is off and try restarting the app.",
    platforms: ["android"]
  },
  {
    id: "trouble-10",
    category: "troubleshooting",
    priority: 10,
    keywords: ["update", "new version", "upgrade app", "latest", "app store", "outdated"],
    question: "How do I update the app to the latest version?",
    answer: "Open the App Store, tap your profile picture in the top right, scroll to see available updates, and tap 'Update' next to SteadiDay. We recommend enabling automatic updates for the best experience."
  },
  {
    id: "trouble-11",
    category: "troubleshooting",
    priority: 11,
    keywords: ["forgot", "pin", "locked out", "can not get in", "password", "reset pin"],
    question: "I forgot my PIN and can't get into the app",
    answer: "If Face ID or Touch ID is enabled, use that to unlock, then go to Settings > Security to reset your PIN. If you're completely locked out, you may need to reinstall the app. Your synced data will restore after reinstalling."
  },
  {
    id: "trouble-12",
    category: "troubleshooting",
    priority: 12,
    keywords: ["widget", "not updating", "home screen", "ios", "stuck", "old", "outdated widget"],
    question: "The home screen widget isn't showing current information",
    answer: "iOS widgets refresh periodically to save battery. Try removing the widget and adding it again. Also make sure SteadiDay has background refresh permission in iPhone Settings > General > Background App Refresh.",
    platforms: ["ios"]
  },
  {
    id: "trouble-13",
    category: "troubleshooting",
    priority: 13,
    keywords: ["health records", "not showing", "lab", "results", "hospital", "doctor", "medical records"],
    question: "My health records aren't appearing in the app",
    answer: "Health metrics must be set up in Apple Health first. Go to Settings > Connected Apps > Apple Health and enable the connection. Make sure you have granted the necessary permissions when prompted."
  },
  {
    id: "trouble-14",
    category: "troubleshooting",
    priority: 14,
    keywords: ["permissions", "allow", "access", "denied", "calendar", "contacts", "health", "asking again"],
    question: "The app keeps asking for permissions I already denied",
    answer: "If you denied a permission before, you'll need to enable it manually. Go to iPhone Settings > SteadiDay and turn on the permissions you need. This is required for features like calendar sync, health tracking, and emergency location.",
    androidAnswer: "If you denied a permission before, you'll need to enable it manually. Go to phone Settings > Apps > SteadiDay > Permissions and turn on the permissions you need. This is required for features like calendar sync, health tracking, and emergency location."
  },
  {
    id: "trouble-15",
    category: "troubleshooting",
    priority: 15,
    keywords: ["new phone", "transfer", "switch", "iphone", "moved", "backup", "restore data"],
    question: "How do I transfer my data to a new phone?",
    answer: "Restore your new iPhone from an iCloud or iTunes backup - SteadiDay data transfers automatically. For Premium, sign into the same Apple ID on your new phone and tap 'Restore Purchases' in Settings.",
    androidAnswer: "If you backed up your old phone using Google backup, restore your new phone from that backup — SteadiDay data may transfer automatically. You can also use SteadiDay's Export My Data feature (on the Home screen) to save a backup file and import it on your new device."
  },
  {
    id: "trouble-16",
    category: "troubleshooting",
    priority: 16,
    keywords: ["wrong time", "timezone", "clock", "schedule", "reminder time"],
    question: "My reminders are coming at the wrong times",
    answer: "Make sure your iPhone's date and time are correct: go to iPhone Settings > General > Date & Time and enable 'Set Automatically'. If you recently traveled, the app should adjust to your new timezone automatically.",
    androidAnswer: "Make sure your phone's date and time are correct: go to phone Settings > System > Date & Time and enable 'Set Automatically'. If you recently traveled, the app should adjust to your new timezone automatically."
  },
  {
    id: "trouble-17",
    category: "troubleshooting",
    priority: 17,
    keywords: ["duplicate", "double", "twice", "repeated", "same", "multiple"],
    question: "I'm seeing duplicate tasks or medications",
    answer: "This can happen with calendar sync. Try disconnecting and reconnecting the calendar in Settings > Connected Apps. Pull down to refresh the screen. If duplicates persist, you may need to remove them manually."
  },
  {
    id: "trouble-18",
    category: "troubleshooting",
    priority: 18,
    keywords: ["camera", "not working", "photo", "can not take", "black", "scanner"],
    question: "The camera isn't working when I try to take a photo",
    answer: "Make sure SteadiDay has camera permission: go to iPhone Settings > SteadiDay > Camera and turn it on. Try closing and reopening the app. If the camera shows a black screen, restart your iPhone.",
    androidAnswer: "Make sure SteadiDay has camera permission: go to phone Settings > Apps > SteadiDay > Permissions > Camera and turn it on. Try closing and reopening the app. If the camera shows a black screen, restart your phone."
  },
  {
    id: "trouble-19",
    category: "troubleshooting",
    priority: 19,
    keywords: ["sos", "not working", "emergency", "button", "does not work"],
    question: "The SOS emergency button isn't working",
    answer: "Make sure you have at least one trusted contact set up in Settings > Safety Features. Check that your phone has a cellular or WiFi connection if you're trying to make a call. Try restarting the app."
  },
  {
    id: "trouble-20",
    category: "troubleshooting",
    priority: 20,
    keywords: ["reinstall", "delete", "fresh start", "start over", "clean install"],
    question: "Should I try reinstalling the app to fix issues?",
    answer: "Reinstalling can fix many persistent issues. Before deleting, make sure important data is backed up or synced to a calendar. After reinstalling, go to Settings and restore your purchases, then reconnect your calendars and health apps."
  },
];

// Platform-aware text replacement for FAQ answers
import { Platform } from "react-native";

function adaptFaqText(text: string): string {
  if (Platform.OS === "ios") return text;
  return text
    .replace(/Apple Health/g, "Health Connect")
    .replace(/Apple Watch/g, "your fitness tracker")
    .replace(/the Health app/g, "Health Connect")
    .replace(/Apple Calendar/g, "Google Calendar")
    .replace(/App Store/g, "Google Play Store")
    .replace(/VoiceOver/g, "TalkBack")
    .replace(/iOS widgets/g, "Android widgets")
    .replace(/iPhone Settings/g, "phone Settings")
    .replace(/iPhone's/g, "your phone's")
    .replace(/your iPhone/g, "your phone")
    .replace(/Restart your iPhone/g, "Restart your phone")
    .replace(/iPhone/g, "phone")
    .replace(/same Apple ID/g, "same Google account")
    .replace(/iCloud or iTunes backup/g, "Google backup")
    .replace(/Restore your new phone from/g, "Restore your new phone from");
}

function adaptFaqItem(faq: FAQItem): FAQItem {
  if (Platform.OS === "ios") return faq;
  if (faq.androidAnswer) {
    return { ...faq, question: adaptFaqText(faq.question), answer: faq.androidAnswer };
  }
  return {
    ...faq,
    question: adaptFaqText(faq.question),
    answer: adaptFaqText(faq.answer),
  };
}

// Get FAQs by category ID, sorted by priority (most common first)
export function getFaqsByCategory(categoryId: string): FAQItem[] {
  const currentPlatform = Platform.OS as "ios" | "android";
  return FAQ_DATABASE
    .filter(faq => faq.category === categoryId)
    .filter(faq => !faq.platforms || faq.platforms.includes(currentPlatform))
    .sort((a, b) => (a.priority || 99) - (b.priority || 99))
    .map(adaptFaqItem);
}

// Get category info by ID
export function getCategoryInfo(categoryId: string): CategoryInfo | undefined {
  return FAQ_CATEGORIES.find(cat => cat.id === categoryId);
}

// Get all FAQ items with platform-adapted text
export function getAdaptedFaqDatabase(): FAQItem[] {
  const currentPlatform = Platform.OS as "ios" | "android";
  return FAQ_DATABASE
    .filter(faq => !faq.platforms || faq.platforms.includes(currentPlatform))
    .map(adaptFaqItem);
}

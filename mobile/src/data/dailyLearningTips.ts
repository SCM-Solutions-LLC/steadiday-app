// =============================================================================
// DAILY LEARNING TIPS - Auto-rotating content library
// Tips rotate based on day of year, so users see fresh content daily
// No maintenance required - tips cycle automatically
// =============================================================================

export interface DailyTip {
  id: string;
  title: string;
  content: string;
  androidContent?: string;
}

export interface LearningCategory {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  iconColor: string;
  cardColor: { light: string; dark: string };
  tips: DailyTip[];
}

// =============================================================================
// HEALTHY AGING TIPS (31 tips - one for each day of month, cycles monthly)
// =============================================================================
const healthyAgingTips: DailyTip[] = [
  { id: "ha-1", title: "Stay Socially Connected", content: "Regular social interaction can reduce the risk of cognitive decline. Try calling a friend or family member today, even for just 10 minutes." },
  { id: "ha-2", title: "Prioritize Quality Sleep", content: "Aim for 7-8 hours of sleep. Keep your bedroom cool and dark, and try to go to bed at the same time each night." },
  { id: "ha-3", title: "Challenge Your Brain Daily", content: "Learning something new creates neural pathways. Try a crossword puzzle, learn a new word, or read about an unfamiliar topic." },
  { id: "ha-4", title: "Practice Gratitude", content: "Write down three things you are grateful for each morning. Studies show this simple practice improves mood and overall wellbeing." },
  { id: "ha-5", title: "Stay Hydrated", content: "Dehydration can cause confusion and fatigue. Keep a water bottle nearby and aim for 6-8 glasses throughout the day." },
  { id: "ha-6", title: "Maintain a Routine", content: "Consistent daily routines help maintain cognitive function and reduce stress. Try to wake, eat, and sleep at regular times." },
  { id: "ha-7", title: "Get Natural Light", content: "Exposure to natural light helps regulate your sleep cycle and boosts vitamin D. Spend at least 15 minutes outside today." },
  { id: "ha-8", title: "Practice Deep Breathing", content: "Take 5 slow, deep breaths when you feel stressed. Breathe in for 4 counts, hold for 4, exhale for 6. This activates your calm response." },
  { id: "ha-9", title: "Keep Learning", content: "Your brain continues to form new connections at any age. Pick up a hobby you have always wanted to try—it is never too late." },
  { id: "ha-10", title: "Laugh Often", content: "Laughter reduces stress hormones and boosts immune function. Watch a funny show or share jokes with friends." },
  { id: "ha-11", title: "Maintain Eye Health", content: "Have your eyes checked annually. Good vision helps prevent falls and keeps you engaged with the world around you." },
  { id: "ha-12", title: "Stay Curious", content: "Ask questions about things you do not understand. Curiosity keeps your mind active and engaged with life." },
  { id: "ha-13", title: "Listen to Music", content: "Music stimulates multiple areas of the brain. Listen to your favorite songs or try exploring a new genre today." },
  { id: "ha-14", title: "Practice Mindfulness", content: "Spend 5 minutes focusing only on the present moment. Notice what you see, hear, and feel without judgment." },
  { id: "ha-15", title: "Keep a Journal", content: "Writing about your thoughts and experiences helps process emotions and can improve memory recall." },
  { id: "ha-16", title: "Embrace Change", content: "Adapting to change keeps your brain flexible. Try a new restaurant, take a different route, or rearrange a room." },
  { id: "ha-17", title: "Protect Your Hearing", content: "Hearing loss is linked to cognitive decline. Use hearing aids if prescribed, and protect ears from loud noises." },
  { id: "ha-18", title: "Nurture Relationships", content: "Strong relationships add years to your life. Reach out to someone you have not spoken to in a while." },
  { id: "ha-19", title: "Set Small Goals", content: "Having something to look forward to improves mental health. Set a small, achievable goal for this week." },
  { id: "ha-20", title: "Practice Self-Compassion", content: "Be kind to yourself when things do not go as planned. Treat yourself with the same kindness you would show a good friend." },
  { id: "ha-21", title: "Declutter Your Space", content: "A tidy environment reduces stress and helps prevent falls. Spend 10 minutes organizing one small area today." },
  { id: "ha-22", title: "Stay Mentally Flexible", content: "Try doing familiar tasks differently—brush teeth with your non-dominant hand or take a new walking path." },
  { id: "ha-23", title: "Connect Across Generations", content: "Spending time with younger people brings fresh perspectives and keeps you feeling connected to the world." },
  { id: "ha-24", title: "Review Medications", content: "Regularly review all medications with your doctor. Some combinations can affect cognition or balance." },
  { id: "ha-25", title: "Celebrate Small Wins", content: "Acknowledge your accomplishments, no matter how small. Positive reinforcement boosts motivation and mood." },
  { id: "ha-26", title: "Limit Screen Time Before Bed", content: "Blue light from screens can disrupt sleep. Try to avoid phones and tablets for an hour before bedtime." },
  { id: "ha-27", title: "Stay Vaccinated", content: "Keep up with recommended vaccinations including flu and pneumonia shots. Prevention is the best medicine." },
  { id: "ha-28", title: "Practice Balance Exercises", content: "Good balance prevents falls. Try standing on one foot while brushing your teeth (hold the counter for safety)." },
  { id: "ha-29", title: "Express Your Feelings", content: "Bottling up emotions can harm health. Share how you feel with someone you trust or write it down." },
  { id: "ha-30", title: "Plan Something Fun", content: "Having events to anticipate boosts happiness. Plan a lunch with a friend, a movie night, or a day trip." },
  { id: "ha-31", title: "Take Breaks When Reading", content: "Rest your eyes every 20 minutes when reading or using screens. Look at something 20 feet away for 20 seconds." },
];

// =============================================================================
// FOOD & NUTRITION TIPS
// =============================================================================
const foodNutritionTips: DailyTip[] = [
  { id: "fn-1", title: "Eat the Rainbow", content: "Try to include fruits and vegetables of different colors in your meals. Each color provides different nutrients your body needs." },
  { id: "fn-2", title: "Protein at Every Meal", content: "Include protein with each meal to maintain muscle strength. Good sources include eggs, fish, beans, chicken, or Greek yogurt." },
  { id: "fn-3", title: "Start with Vegetables", content: "Eat your vegetables first at meals. You will fill up on nutrients and naturally eat less of higher-calorie foods." },
  { id: "fn-4", title: "Choose Whole Grains", content: "Swap white bread for whole wheat, white rice for brown. Whole grains provide more fiber and keep you feeling full longer." },
  { id: "fn-5", title: "Healthy Fats Matter", content: "Include healthy fats from olive oil, avocados, nuts, and fish. They support brain health and help absorb vitamins." },
  { id: "fn-6", title: "Read Food Labels", content: "Check sodium content on packaged foods. Aim for less than 2,300mg of sodium per day for heart health." },
  { id: "fn-7", title: "Eat More Fish", content: "Try to eat fish twice a week. Salmon, sardines, and trout are rich in omega-3s that support heart and brain health." },
  { id: "fn-8", title: "Snack Smart", content: "Keep healthy snacks visible and accessible. A small handful of nuts, some fruit, or veggie sticks are great choices." },
  { id: "fn-9", title: "Cook at Home More", content: "Home-cooked meals are usually healthier and lower in sodium than restaurant food. Try one new simple recipe this week." },
  { id: "fn-10", title: "Do Not Skip Breakfast", content: "A nutritious breakfast provides energy and helps maintain stable blood sugar throughout the morning." },
  { id: "fn-11", title: "Add Fiber Gradually", content: "Fiber aids digestion and heart health. Add it slowly—beans, oatmeal, fruits, and vegetables are excellent sources." },
  { id: "fn-12", title: "Limit Added Sugars", content: "Check labels for hidden sugars. Words ending in '-ose' (fructose, sucrose) indicate added sugars." },
  { id: "fn-13", title: "Eat Mindfully", content: "Sit down for meals without distractions. Eating slowly helps digestion and helps you recognize when you are full." },
  { id: "fn-14", title: "Calcium for Bones", content: "Include calcium-rich foods daily: dairy products, fortified plant milks, leafy greens, or canned fish with bones." },
  { id: "fn-15", title: "Spice It Up", content: "Use herbs and spices instead of salt for flavor. Turmeric, ginger, and cinnamon also have health benefits." },
  { id: "fn-16", title: "Prep Ingredients Ahead", content: "Wash and cut vegetables on the weekend. Having them ready makes healthy cooking much easier during the week." },
  { id: "fn-17", title: "Watch Portion Sizes", content: "Use smaller plates to help control portions. A serving of meat should be about the size of a deck of cards." },
  { id: "fn-18", title: "Stay Hydrated with Food", content: "Many fruits and vegetables are high in water. Watermelon, cucumbers, and oranges help keep you hydrated." },
  { id: "fn-19", title: "Limit Processed Meats", content: "Reduce bacon, sausage, and deli meats. They are high in sodium and preservatives. Choose fresh protein instead." },
  { id: "fn-20", title: "Enjoy Dark Chocolate", content: "A small piece of dark chocolate (70%+ cocoa) can satisfy sweet cravings and contains beneficial antioxidants." },
  { id: "fn-21", title: "Try Beans and Legumes", content: "Beans are affordable, nutritious, and versatile. Add them to soups, salads, or enjoy as a side dish." },
  { id: "fn-22", title: "Frozen is Fine", content: "Frozen fruits and vegetables are just as nutritious as fresh and often more affordable. Keep some stocked." },
  { id: "fn-23", title: "Limit Fried Foods", content: "Try baking, grilling, or air-frying instead of deep frying. You will reduce unhealthy fats while keeping flavor." },
  { id: "fn-24", title: "Eat Before Shopping", content: "Never grocery shop hungry. You will make better choices and buy fewer impulse items." },
  { id: "fn-25", title: "Make Soup", content: "Soups are an easy way to get vegetables and stay hydrated. Make a big batch and freeze portions." },
  { id: "fn-26", title: "Choose Lean Proteins", content: "Opt for chicken, turkey, fish, or plant proteins more often than red meat for heart health." },
  { id: "fn-27", title: "Vitamin D Sources", content: "Get vitamin D from fortified milk, fatty fish, eggs, and sunlight. It is essential for bone health." },
  { id: "fn-28", title: "Limit Alcohol", content: "If you drink, do so in moderation. For most adults, that means up to one drink per day." },
  { id: "fn-29", title: "Try Mediterranean Eating", content: "The Mediterranean diet emphasizes olive oil, fish, vegetables, and whole grains—great for heart and brain health." },
  { id: "fn-30", title: "Keep Healthy Foods Visible", content: "Put fruit on the counter and vegetables at eye level in the fridge. You will eat more of what you see first." },
  { id: "fn-31", title: "Enjoy Meals with Others", content: "Eating with family or friends improves nutrition and mood. Plan a meal with someone this week." },
];

// =============================================================================
// STAYING ACTIVE TIPS
// =============================================================================
const stayingActiveTips: DailyTip[] = [
  { id: "sa-1", title: "Start with Walking", content: "A 10-minute walk counts! Start small and gradually increase. Even short walks improve heart health and mood." },
  { id: "sa-2", title: "Move Every Hour", content: "Set a reminder to stand and move for a few minutes every hour. This prevents stiffness and boosts circulation." },
  { id: "sa-3", title: "Stretch in the Morning", content: "Gentle stretching when you wake up improves flexibility and helps prevent injury. Start with neck and shoulder rolls." },
  { id: "sa-4", title: "Try Chair Exercises", content: "No need to stand for a full workout. Seated leg lifts, arm circles, and torso twists are effective exercises." },
  { id: "sa-5", title: "Walk During Commercials", content: "Use TV commercial breaks to walk around the house or do simple exercises. It adds up quickly!" },
  { id: "sa-6", title: "Garden for Exercise", content: "Gardening provides physical activity while being enjoyable. Digging, planting, and weeding all count as exercise." },
  { id: "sa-7", title: "Take the Stairs", content: "When safe to do so, choose stairs over elevators. Start with going down (easier) before going up." },
  { id: "sa-8", title: "Dance at Home", content: "Put on your favorite music and move! Dancing improves balance, coordination, and lifts your spirits." },
  { id: "sa-9", title: "Strength Training Matters", content: "Light weights or resistance bands help maintain muscle mass. Try 2-3 sessions per week." },
  { id: "sa-10", title: "Try Water Exercise", content: "Swimming or water aerobics are gentle on joints while providing excellent exercise. Many pools offer senior classes." },
  { id: "sa-11", title: "Balance Practice", content: "Stand near a counter and practice balancing on one foot for 10 seconds. Switch sides. This prevents falls." },
  { id: "sa-12", title: "Walk with a Friend", content: "Exercise is more enjoyable with company. Invite a friend or neighbor for regular walks together." },
  { id: "sa-13", title: "Household Chores Count", content: "Vacuuming, mopping, and cleaning windows all provide physical activity. Make chores work for your health!" },
  { id: "sa-14", title: "Try Tai Chi", content: "Tai Chi improves balance, flexibility, and reduces stress. Many community centers offer beginner classes." },
  { id: "sa-15", title: "Set a Step Goal", content: "Aim for a realistic daily step goal. Even 3,000-4,000 steps provides health benefits." },
  { id: "sa-16", title: "Ankle Circles", content: "While seated, rotate your ankles in circles. This simple exercise improves circulation and flexibility." },
  { id: "sa-17", title: "Walk After Meals", content: "A short 10-minute walk after eating helps with digestion and blood sugar control." },
  { id: "sa-18", title: "Use Proper Footwear", content: "Supportive, well-fitting shoes make exercise safer and more comfortable. Replace worn-out shoes." },
  { id: "sa-19", title: "Try Yoga", content: "Gentle yoga improves flexibility, strength, and mental calm. Many free videos are available for beginners." },
  { id: "sa-20", title: "Park Farther Away", content: "Choose parking spots farther from entrances. Those extra steps add up throughout the day." },
  { id: "sa-21", title: "Exercise with TV", content: "Follow along with exercise programs on TV or online. Many are designed specifically for seniors." },
  { id: "sa-22", title: "Squeeze a Ball", content: "Keep a stress ball or tennis ball handy. Squeezing it strengthens hands and forearms." },
  { id: "sa-23", title: "March in Place", content: "When you cannot go outside, march in place for a few minutes. Lift those knees and swing your arms!" },
  { id: "sa-24", title: "Listen to Your Body", content: "Some discomfort is normal when starting exercise, but stop if you feel pain. Rest when needed." },
  { id: "sa-25", title: "Find Activities You Enjoy", content: "Exercise you enjoy is exercise you will keep doing. Try different activities until you find your favorites." },
  { id: "sa-26", title: "Wall Push-Ups", content: "Stand arms length from a wall, place hands on it, and do push-ups. Great for arm strength with less strain." },
  { id: "sa-27", title: "Heel-to-Toe Walking", content: "Practice walking by placing your heel directly in front of your other foots toe. This improves balance." },
  { id: "sa-28", title: "Stay Consistent", content: "Regular, moderate activity is better than occasional intense exercise. Aim for some movement every day." },
  { id: "sa-29", title: "Warm Up First", content: "Always warm up before exercise with gentle movements. Cold muscles are more prone to injury." },
  { id: "sa-30", title: "Celebrate Progress", content: "Notice improvements in your strength, flexibility, or endurance. Every bit of progress is worth celebrating!" },
  { id: "sa-31", title: "Cool Down After", content: "End exercise with gentle stretches and slow walking. This helps your body recover and prevents stiffness." },
];

// =============================================================================
// TECH MADE EASY TIPS
// =============================================================================
const techMadeEasyTips: DailyTip[] = [
  { id: "te-1", title: "Increase Text Size", content: "Make reading easier! Go to Settings > Display > Text Size and move the slider to make text larger." },
  { id: "te-2", title: "Use Voice Commands", content: "Say \"Hey Siri\" or \"OK Google\" to make calls, send texts, or ask questions without typing." },
  { id: "te-3", title: "Screenshot Anything", content: "Press the side button and volume up together to capture what is on your screen. Great for saving information!" },
  { id: "te-4", title: "Turn On Do Not Disturb", content: "Silence calls and notifications at night. Find it in Settings > Focus > Do Not Disturb and set a schedule." },
  { id: "te-5", title: "Use the Magnifier", content: "Your phone can be a magnifying glass! Triple-click the side button or find Magnifier in Accessibility settings." },
  { id: "te-6", title: "Add Favorites", content: "Put your most-called contacts in Favorites. Open Phone app, tap Favorites, then the + to add people." },
  { id: "te-7", title: "Enable Flashlight Quickly", content: "Swipe down from the top corner of your screen to find the flashlight button. Great for dark areas!" },
  { id: "te-8", title: "Set Medication Reminders", content: "Use the Clock app to set daily alarms for medication times. Label each alarm with the medicine name." },
  { id: "te-9", title: "Video Call Family", content: "FaceTime or video calls let you see loved ones. It is as easy as selecting their name and tapping the video icon.", androidContent: "Video calls using Google Meet, WhatsApp, or Duo let you see loved ones. It is as easy as selecting their name and tapping the video icon." },
  { id: "te-10", title: "Organize Apps in Folders", content: "Press and hold an app, then drag it onto another app to create a folder. Keeps your screen tidy!" },
  { id: "te-11", title: "Use Medical ID", content: "Set up Medical ID in the Health app with emergency contacts and health conditions. First responders can access it.", androidContent: "Set up Emergency Information in your phone's Settings under Safety & Emergency. Add emergency contacts and health conditions. First responders can access it from your lock screen." },
  { id: "te-12", title: "Enable Dark Mode", content: "Dark mode is easier on your eyes at night. Find it in Settings > Display > Dark Mode." },
  { id: "te-13", title: "Back Up Your Photos", content: "Turn on iCloud Photos or Google Photos to automatically save your pictures. You will never lose precious memories.", androidContent: "Turn on Google Photos to automatically save your pictures. You will never lose precious memories." },
  { id: "te-14", title: "Use Speak Selection", content: "Have your phone read text aloud. Enable it in Settings > Accessibility > Spoken Content > Speak Selection." },

  { id: "te-16", title: "Wi-Fi Calling", content: "If cell signal is weak at home, enable Wi-Fi Calling in Settings > Phone. Uses your internet for clearer calls.", androidContent: "If cell signal is weak at home, enable Wi-Fi Calling in Settings under Network and Internet. Uses your internet for clearer calls." },
  { id: "te-17", title: "Emergency SOS", content: "Pressing the side button 5 times quickly calls emergency services. Know this feature—it could save a life." },
  { id: "te-18", title: "Reduce Motion", content: "If screen animations make you dizzy, go to Settings > Accessibility > Motion > Reduce Motion." },
  { id: "te-19", title: "Bold Text Option", content: "Make text easier to read by enabling Bold Text in Settings > Display & Brightness." },
  { id: "te-20", title: "Voice-to-Text", content: "Tap the microphone on your keyboard to dictate instead of type. Great for longer messages!" },
  { id: "te-21", title: "Adjust Brightness", content: "If your screen is too bright or dim, swipe down from the top corner and adjust the brightness slider." },
  { id: "te-22", title: "Use Calendar Reminders", content: "Add appointments to your Calendar app with alerts. You will get a notification before each event." },
  { id: "te-23", title: "Close Unused Apps", content: "Swipe up from the bottom and pause to see open apps. Swipe them up to close. This can save battery." },
  { id: "te-24", title: "Silence Unknown Callers", content: "Block spam calls! In Settings > Phone, turn on \"Silence Unknown Callers.\" Known contacts still ring through.", androidContent: "Block spam calls! Open your Phone app, go to Settings, and enable Caller ID and Spam protection. Unknown callers can be sent straight to voicemail." },
  { id: "te-25", title: "Use Reading Mode", content: "In Safari, tap \"AA\" in the address bar and select \"Show Reader\" for a cleaner, easier-to-read view of articles.", androidContent: "In Chrome, tap the three-dot menu and select Simplified View for a cleaner, easier-to-read view of articles." },
  { id: "te-26", title: "Keyboard Shortcuts", content: "Create shortcuts for phrases you type often. Go to Settings > General > Keyboard > Text Replacement." },
  { id: "te-27", title: "Check Battery Health", content: "See your battery condition in Settings > Battery > Battery Health. Replace if it is below 80%." },
  { id: "te-28", title: "Use Night Shift", content: "Reduce blue light in the evening with Night Shift. Find it in Settings > Display > Night Shift." },
  { id: "te-29", title: "Restart Fixes Problems", content: "If your phone is acting strange, try turning it off and on again. This fixes many common issues!" },
  { id: "te-30", title: "Keep Software Updated", content: "Updates include important security fixes. Check Settings > General > Software Update regularly." },
  { id: "te-31", title: "Ask for Help", content: "Do not struggle alone! Ask family, friends, or visit an Apple Store or phone carrier for free tech help.", androidContent: "Do not struggle alone! Ask family, friends, or visit your phone carrier store for free tech help." },
];

// =============================================================================
// CATEGORY DEFINITIONS
// =============================================================================
export const LEARNING_CATEGORIES: LearningCategory[] = [
  {
    id: "healthy-aging",
    title: "Healthy Aging",
    subtitle: "Clarity, balance, independence",
    icon: "heart",
    iconColor: "#EC4899",
    cardColor: { light: "#FCE7F3", dark: "#831843" },
    tips: healthyAgingTips,
  },
  {
    id: "food-nutrition",
    title: "Food & Nutrition",
    subtitle: "Practical everyday guidance",
    icon: "restaurant",
    iconColor: "#22C55E",
    cardColor: { light: "#DCFCE7", dark: "#14532D" },
    tips: foodNutritionTips,
  },
  {
    id: "staying-active",
    title: "Staying Active",
    subtitle: "Movement that adds up",
    icon: "fitness",
    iconColor: "#3B82F6",
    cardColor: { light: "#DBEAFE", dark: "#1E3A8A" },
    tips: stayingActiveTips,
  },
  {
    id: "tech-made-easy",
    title: "Tech Made Easy",
    subtitle: "Clear help for technology",
    icon: "phone-portrait",
    iconColor: "#F97316",
    cardColor: { light: "#FFEDD5", dark: "#7C2D12" },
    tips: techMadeEasyTips,
  },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

import { Platform } from "react-native";

export function getTipContent(tip: DailyTip): string {
  if (Platform.OS === "android" && tip.androidContent) {
    return tip.androidContent;
  }
  return tip.content;
}

/**
 * Get today's tip for a category based on day of year
 * Cycles through all tips automatically
 */
export function getTodaysTip(category: LearningCategory): DailyTip {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  const tipIndex = dayOfYear % category.tips.length;
  return category.tips[tipIndex];
}

/**
 * Get a featured tip of the day (rotates through all categories)
 */
export function getFeaturedTipOfDay(): { category: LearningCategory; tip: DailyTip } {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  const categoryIndex = dayOfYear % LEARNING_CATEGORIES.length;
  const category = LEARNING_CATEGORIES[categoryIndex];
  const tip = getTodaysTip(category);
  return { category, tip };
}

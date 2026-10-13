export type SeedHabit = {
  name: string;
  icon: string;
  description: string;
  defaultFrequency: "DAILY" | "WEEKLY";
  defaultTargetDaysPerWeek: number;
  // Multi-step habits: all three are set together
  defaultDailyGoal?: number;
  defaultUnit?: string;
  defaultStepSize?: number;
};

export type SeedCategory = {
  name: string;
  icon: string;
  habits: SeedHabit[];
};

type Goal = { goal: number; unit: string; step: number };

const daily = (name: string, icon: string, description: string, g?: Goal): SeedHabit => ({
  name,
  icon,
  description,
  defaultFrequency: "DAILY",
  defaultTargetDaysPerWeek: 7,
  ...(g && { defaultDailyGoal: g.goal, defaultUnit: g.unit, defaultStepSize: g.step }),
});

const weekly = (name: string, icon: string, description: string, days: number): SeedHabit => ({
  name,
  icon,
  description,
  defaultFrequency: "WEEKLY",
  defaultTargetDaysPerWeek: days,
});

export const seedCategories: SeedCategory[] = [
  {
    name: "health",
    icon: "💚",
    habits: [
      daily("Drink 2L of water", "💧", "Stay hydrated through the day", { goal: 2000, unit: "ml", step: 250 }),
      daily("Take vitamins", "💊", "Take your daily vitamins"),
      daily("Eat a serving of vegetables", "🥦", "Get at least one serving of veg"),
      daily("No sugary drinks", "🥤", "Skip soda, juice and sweetened drinks"),
      daily("Eat breakfast", "🍳", "Start the day with a proper meal"),
      daily("Stretch", "🤸", "Loosen up with a few minutes of stretching"),
      daily("Floss", "🦷", "Floss before bed"),
      daily("Take a walk after meals", "🚶", "A short walk helps digestion"),
      daily("Limit alcohol", "🚫", "Keep drinks to a minimum"),
      weekly("Cook a healthy meal", "🥗", "Make a nutritious meal at home", 4),
    ],
  },
  {
    name: "fitness",
    icon: "💪",
    habits: [
      weekly("Morning run", "🏃", "Start the day with a run", 3),
      weekly("Strength training", "🏋️", "Lift weights or do bodyweight work", 3),
      daily("10,000 steps", "👟", "Hit your daily step count", { goal: 10000, unit: "steps", step: 1000 }),
      weekly("Yoga", "🧘", "Flow through a yoga session", 3),
      weekly("Cycle", "🚴", "Go for a ride", 3),
      weekly("Swim", "🏊", "Get some laps in", 2),
      daily("Do 20 push-ups", "💥", "Build upper-body strength", { goal: 20, unit: "reps", step: 5 }),
      daily("Plank for 1 minute", "⏱️", "Hold a plank to work your core"),
      daily("Take the stairs", "🪜", "Skip the lift whenever you can"),
      weekly("Play a sport", "⚽", "Join a game or practice a sport", 2),
    ],
  },
  {
    name: "learning",
    icon: "📚",
    habits: [
      daily("Read 20 minutes", "📖", "Read a book for a while", { goal: 20, unit: "min", step: 5 }),
      daily("Learn a new word", "🔤", "Add one word to your vocabulary"),
      daily("Practice a language", "🌍", "Keep your language skills sharp", { goal: 15, unit: "min", step: 5 }),
      weekly("Listen to a podcast", "🎧", "Learn something new on the go", 3),
      weekly("Online course lesson", "🎓", "Finish a lesson of an online course", 3),
      daily("Practice an instrument", "🎸", "Put in some practice time", { goal: 20, unit: "min", step: 5 }),
      weekly("Watch an educational video", "📺", "Learn something from a good video", 3),
      daily("Study for 30 minutes", "✏️", "Focused study time", { goal: 30, unit: "min", step: 10 }),
      weekly("Write a summary of what I learned", "📝", "Put what you learned into your own words", 2),
      daily("Practice coding", "💻", "Write some code, however small"),
    ],
  },
  {
    name: "mindfulness",
    icon: "🧠",
    habits: [
      daily("Meditate", "🧘", "Sit quietly and focus on your breath", { goal: 10, unit: "min", step: 5 }),
      daily("Journal", "📓", "Write down your thoughts"),
      daily("Gratitude list", "🙏", "Note three things you are grateful for"),
      daily("Deep breathing", "🌬️", "Take a few slow, deep breaths"),
      weekly("Digital detox hour", "📵", "Spend an hour away from screens", 5),
      weekly("Mindful walk", "🌳", "Walk slowly and notice your surroundings", 3),
      weekly("Body scan", "🫶", "Check in with each part of your body", 3),
      daily("Positive affirmation", "✨", "Start the day with a kind word to yourself"),
      daily("Screen-free meal", "🍽️", "Eat without a screen in front of you"),
      daily("Reflect on the day", "🌙", "Look back on what went well"),
    ],
  },
  {
    name: "productivity",
    icon: "🎯",
    habits: [
      daily("Plan tomorrow", "🗓️", "Set up tomorrow before you finish today"),
      daily("Top 3 priorities", "🥇", "Pick the three things that matter most"),
      daily("Inbox zero", "📥", "Clear out your inbox"),
      daily("Deep work block", "🔒", "Focus without interruptions", { goal: 60, unit: "min", step: 15 }),
      daily("Tidy workspace", "🧹", "Reset your desk for tomorrow"),
      weekly("Review weekly goals", "🔍", "Check progress against your weekly goals", 1),
      daily("No social media before noon", "🚫", "Keep your mornings free of scrolling"),
      daily("Do the hardest task first", "🐸", "Eat the frog before anything else"),
      daily("Time-block the day", "⏰", "Give every task a slot in your calendar"),
      daily("Clear one to-do", "✅", "Finish one task you have been putting off"),
    ],
  },
  {
    name: "sleep",
    icon: "😴",
    habits: [
      daily("Sleep 8 hours", "🛌", "Get a full night of sleep"),
      daily("In bed by 10:30 pm", "🕥", "Keep a consistent bedtime"),
      daily("Wake up at the same time", "⏰", "Keep your wake-up time steady"),
      daily("Wind-down routine", "🕯️", "Relax before bed"),
      daily("No caffeine after 2 pm", "☕", "Cut caffeine early so you can sleep"),
      daily("No screens before bed", "📱", "Switch off an hour before sleep"),
      daily("Cool dark bedroom", "🌑", "Set up your room for good sleep"),
      daily("Read before bed", "📚", "Read a few pages to wind down"),
      daily("Evening stretch", "🧎", "Gentle stretching before bed"),
      daily("Morning sunlight", "🌅", "Get some daylight soon after waking"),
    ],
  },
  {
    name: "social",
    icon: "🤝",
    habits: [
      weekly("Call a friend or family", "📞", "Catch up with someone you care about", 3),
      daily("Send a kind message", "💌", "Brighten someone's day with a message"),
      weekly("Quality time with loved ones", "👨‍👩‍👧", "Be fully present with the people you love", 3),
      weekly("Do a random act of kindness", "🎁", "Do something nice for someone", 3),
      weekly("Reach out to someone new", "👋", "Start a conversation with someone new", 2),
      weekly("Plan a get-together", "🎉", "Organise a catch-up with friends", 1),
      daily("Give a compliment", "😊", "Say something kind and genuine"),
      weekly("Write a thank-you note", "✉️", "Tell someone you appreciate them", 2),
      weekly("Volunteer", "🤲", "Give some of your time to a cause", 1),
      daily("Put the phone away at dinner", "🍴", "Be present at the table"),
    ],
  },
];

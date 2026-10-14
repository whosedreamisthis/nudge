import { cookies } from "next/headers";
import { AI_OFF_COOKIE, parseAiOff, type AiSettings } from "@/lib/settings";

interface AiUser {
  isDemo: boolean;
  aiWeeklyReport: boolean;
  aiMotivation: boolean;
  aiHabitSuggestions: boolean;
}

// Which AI features are on for this user. A demo's choices come from a cookie, everyone else's from the row.
export async function getAiSettings(user: AiUser): Promise<AiSettings> {
  if (user.isDemo) {
    const off = parseAiOff((await cookies()).get(AI_OFF_COOKIE)?.value);
    return {
      weeklyReport: !off.includes("weeklyReport"),
      motivation: !off.includes("motivation"),
      habitSuggestions: !off.includes("habitSuggestions"),
    };
  }
  return {
    weeklyReport: user.aiWeeklyReport,
    motivation: user.aiMotivation,
    habitSuggestions: user.aiHabitSuggestions,
  };
}

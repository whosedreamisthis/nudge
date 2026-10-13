"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { msUntilNextDay, todayKey, type DateKey } from "@/lib/dates";

// Refreshes the page once the user's local day is no longer the one it was rendered for, so an
// open tab starts the new day at zero. One timer fires just after local midnight; the check also
// runs when the tab comes back into view, because timers are late after the computer sleeps.
export function DayRollover({ today, timezone }: { today: DateKey; timezone: string }) {
  const router = useRouter();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    function check() {
      if (todayKey(timezone) !== today) router.refresh();
    }

    function schedule() {
      // A second past midnight; the refresh re-runs this effect with the new day
      timer = setTimeout(
        () => {
          check();
          schedule();
        },
        msUntilNextDay(timezone) + 1000,
      );
    }

    function onVisible() {
      if (document.visibilityState === "visible") check();
    }

    schedule();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", check);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", check);
    };
  }, [today, timezone, router]);

  return null;
}

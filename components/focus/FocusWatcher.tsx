"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useFocusTimer } from "@/components/focus/useFocusTimer";
import { finishTimer } from "@/lib/focus";
import { alertFinished } from "@/lib/focus-alert";
import { writeTimer } from "@/lib/focus-store";

// Mounted in the app layout so a session ends with a chime on any page,
// and with a toast anywhere except the Focus page (which shows its own finish card)
export function FocusWatcher() {
  const router = useRouter();
  const pathname = usePathname();
  const { timer, status } = useFocusTimer();

  // The effect below should not re-run on navigation, only read where the user is
  const onFocusPage = useRef(pathname === "/focus");
  useEffect(() => {
    onFocusPage.current = pathname === "/focus";
  }, [pathname]);

  // Store the finish once, chime once and toast once, whether the end came live or while the tab was away
  const finishedFor = useRef<number | null>(null);
  useEffect(() => {
    if (!timer || status !== "finished" || timer.status !== "running") return;
    if (finishedFor.current === timer.endsAt) return;
    finishedFor.current = timer.endsAt;
    writeTimer(finishTimer(timer));
    alertFinished(Math.round(timer.durationMs / 60_000));
    if (!onFocusPage.current) {
      toast.success("Focus session complete", {
        action: { label: "View", onClick: () => router.push("/focus") },
      });
    }
  }, [timer, status, router]);

  return null;
}

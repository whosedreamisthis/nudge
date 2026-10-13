"use client";

import { useEffect } from "react";
import { captureTimezone } from "@/actions/user";

// Renders nothing; reports the browser timezone to the server on first load.
export function TimezoneSync() {
  useEffect(() => {
    void captureTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  return null;
}

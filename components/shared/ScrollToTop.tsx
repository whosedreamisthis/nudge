"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

// Next keeps the scroll position when the new page's top is already on screen; switching pages
// should always start at the top. Only the path counts, so ?week= and filter changes stay put.
export function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

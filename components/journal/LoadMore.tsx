"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

// Loads the next page of History when it scrolls into view. The link stays as the way to do it
// by keyboard or without scripts.
export function LoadMore({ href }: { href: string }) {
  const router = useRouter();
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) router.replace(href, { scroll: false });
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [href, router]);

  return (
    <Link
      ref={ref}
      href={href}
      replace
      scroll={false}
      className="self-center rounded-sm px-4 py-2 text-sm font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
    >
      Show more
    </Link>
  );
}

"use client";

import Link from "next/link";

import { useEffect, useState } from "react";

import GithubSlugger from "github-slugger";

import { cn } from "@/lib/utils";

export default function TableOfContents({
  items,
}: {
  items: {
    text: string;
    level: number;
  }[];
}) {
  const currentAnchor = useCurrentAnchor();
  const slugger = new GithubSlugger();

  return (
    <div className="-ml-[2.55rem] grid gap-4 border-l border-orange-500 pl-10">
      <p className="text-sm font-medium">Table of Contents</p>
      {items &&
        items.map((item, idx) => {
          const itemId = slugger.slug(item.text);
          return (
            <Link
              key={itemId}
              href={`#${itemId}`}
              className={cn("text-sm text-gray-500 ", {
                "-ml-[2.6rem]  border-l-2 border-black pl-10 text-black":
                  currentAnchor ? currentAnchor === itemId : idx === 0,
              })}
            >
              {item.text}
            </Link>
          );
        })}
    </div>
  );
}

function useCurrentAnchor() {
  const [currentAnchor, setCurrentAnchor] = useState<string | null>(null);

  useEffect(() => {
    const mdxContainer: HTMLElement | null = document.querySelector(
      "[data-mdx-container]",
    );

    if (!mdxContainer) return;

    const offsetTop = 0;

    const observer = new IntersectionObserver(
      (entries) => {
        let currentEntry = entries[0];
        if (!currentEntry) return;

        const offsetBottom =
          (currentEntry.rootBounds?.height || 0) * 0.3 + offsetTop;

        for (let i = 1; i < entries.length; i++) {
          const entry = entries[i];
          if (!entry) break;

          if (
            entry.boundingClientRect.top <
              currentEntry.boundingClientRect.top ||
            currentEntry.boundingClientRect.bottom < offsetTop
          ) {
            currentEntry = entry;
          }
        }

        let target: Element | undefined = currentEntry.target;

        // if the target is too high up, we need to find the next sibling
        while (target && target.getBoundingClientRect().bottom < offsetTop) {
          target = siblings.get(target)?.next;
        }

        // if the target is too low, we need to find the previous sibling
        while (target && target.getBoundingClientRect().top > offsetBottom) {
          target = siblings.get(target)?.prev;
        }
        if (target) setCurrentAnchor(target.id);
      },
      {
        threshold: 1,
        rootMargin: `-${offsetTop}px 0px 0px 0px`,
      },
    );

    const siblings = new Map();

    const anchors = mdxContainer?.querySelectorAll("[data-mdx-heading]");
    anchors.forEach((anchor) => observer.observe(anchor));

    return () => {
      observer.disconnect();
    };
  }, []);

  return currentAnchor?.replace("#", "");
}

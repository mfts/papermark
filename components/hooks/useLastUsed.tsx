"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { localStorage } from "@/lib/webstorage";

type LoginType = "passkey" | "google" | "credentials" | "linkedin";

export function useLastUsed() {
  const [lastUsed, setLastUsed] = useState<LoginType>();

  useEffect(() => {
    const storedValue = localStorage.getItem("last_papermark_login");
    if (storedValue) {
      setLastUsed(storedValue as LoginType);
    }
  }, []);

  useEffect(() => {
    if (lastUsed) {
      localStorage.setItem("last_papermark_login", lastUsed);
    } else {
      localStorage.removeItem("last_papermark_login");
    }
  }, [lastUsed]);

  return [lastUsed, setLastUsed] as const;
}

export const LastUsed = ({ className }: { className?: string | undefined }) => {
  return (
    <div className="absolute right-2 top-1/2 w-fit -translate-y-1/2 sm:right-[-50px]">
      <div
        className={cn(
          "relative z-[999] rounded-md bg-input px-2 py-1 text-xs text-foreground",
          className,
        )}
      >
        Last used
        <div className="absolute -left-1 top-1/2 hidden h-0 w-0 -translate-y-1/2 border-b-4 border-l-0 border-r-4 border-t-4 border-transparent border-r-input sm:block" />
      </div>
    </div>
  );
};

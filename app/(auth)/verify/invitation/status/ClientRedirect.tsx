"use client";

import { useEffect } from "react";

export default function CleanUrlOnExpire({
  shouldClean,
}: {
  shouldClean: boolean;
}) {
  useEffect(() => {
    if (shouldClean && typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.search = "";
      window.history.replaceState({}, "", url.toString());
    }
  }, [shouldClean]);

  return null;
}

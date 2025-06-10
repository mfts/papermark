"use client";

import { useRouter } from "next/navigation";

import { useEffect } from "react";

import { useSession } from "next-auth/react";

interface CleanUrlProps {
  shouldClean?: boolean;
  redirectOnAuth?: boolean;
  redirectPath?: string;
}

export default function CleanUrl({
  shouldClean = false,
  redirectOnAuth = false,
  redirectPath = "/dashboard",
}: CleanUrlProps): null {
  const { status } = useSession();
  console.log("status", status);
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (shouldClean) {
      const url = new URL(window.location.href);
      url.search = "";
      window.history.replaceState({}, "", url.toString());
    }

    if (redirectOnAuth && status === "authenticated") {
      router.replace(redirectPath);
    }
  }, [shouldClean, redirectOnAuth, status, router, redirectPath]);

  return null;
}

"use client";

import { useRouter } from "next/navigation";

import { useEffect, useRef } from "react";

import { useSession } from "next-auth/react";
import { toast } from "sonner";

import LoadingSpinner from "@/components/ui/loading-spinner";

export default function ConfirmEmailChangePageClient() {
  const router = useRouter();
  const { update, status } = useSession();
  const hasUpdatedSession = useRef(false);

  useEffect(() => {
    if (status !== "authenticated" || hasUpdatedSession.current) {
      return;
    }

    async function updateSession() {
      hasUpdatedSession.current = true;
      await update();
      toast.success("Email update successful!");
      router.replace("/account/general");
    }

    updateSession();
  }, [status, update]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <LoadingSpinner className="h-20 w-20 text-foreground" />
    </div>
  );
}

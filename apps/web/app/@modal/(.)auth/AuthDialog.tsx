"use client";

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "ui";
import { GoogleAuth } from "@/app/auth/GoogleAuth";

export const AuthDialog = () => {
  const router = useRouter();

  return (
    <Dialog
      defaultOpen
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          router.back();
        }
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Sign in</DialogTitle>
          <DialogDescription>
            You can add multiple authentication providers. Add Google Auth
            credentials to the codebase and test signing in right away.
          </DialogDescription>
        </DialogHeader>
        <GoogleAuth />
      </DialogContent>
    </Dialog>
  );
};

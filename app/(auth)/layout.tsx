"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";

import { ThemeProvider } from "@/components/theme-provider";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <main>
          <Toaster closeButton richColors theme="system" />
          <div>{children}</div>
        </main>
      </ThemeProvider>
    </SessionProvider>
  );
}

"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "./ThemeProvider";

export const Providers = ({ children }: React.PropsWithChildren) => (
  <SessionProvider>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  </SessionProvider>
);

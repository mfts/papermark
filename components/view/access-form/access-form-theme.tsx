import { createContext, useContext } from "react";
import type { ReactNode } from "react";

import { createAdaptiveSurfacePalette } from "@/lib/utils/create-adaptive-surface-palette";

export type AccessFormTheme = ReturnType<typeof createAdaptiveSurfacePalette>;

const defaultTheme = createAdaptiveSurfacePalette(undefined);

const AccessFormThemeContext = createContext<AccessFormTheme>(defaultTheme);

export function createAccessFormTheme(accentColor: string | null | undefined) {
  return createAdaptiveSurfacePalette(accentColor || "#000000");
}

export function AccessFormThemeProvider({
  value,
  children,
}: {
  value: AccessFormTheme;
  children: ReactNode;
}) {
  return (
    <AccessFormThemeContext.Provider value={value}>
      {children}
    </AccessFormThemeContext.Provider>
  );
}

export function useAccessFormTheme() {
  return useContext(AccessFormThemeContext);
}

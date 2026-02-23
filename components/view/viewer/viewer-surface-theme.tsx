import { createContext, useContext } from "react";
import type { ReactNode } from "react";

import {
  AdaptiveSurfacePalette,
  createAdaptiveSurfacePalette,
} from "@/lib/utils/create-adaptive-surface-palette";

type ViewerSurfaceTextTone = "light" | "dark";

export type ViewerSurfaceTheme = {
  palette: AdaptiveSurfacePalette;
  textTone: ViewerSurfaceTextTone;
  usesLightText: boolean;
};

const DEFAULT_VIEWER_SURFACE_THEME: ViewerSurfaceTheme =
  createViewerSurfaceTheme(null);

const ViewerSurfaceThemeContext = createContext<ViewerSurfaceTheme>(
  DEFAULT_VIEWER_SURFACE_THEME,
);

export function createViewerSurfaceTheme(
  backgroundColor: string | null | undefined,
): ViewerSurfaceTheme {
  const palette = createAdaptiveSurfacePalette(backgroundColor || "#ffffff");

  return {
    palette,
    textTone: palette.usesLightText ? "light" : "dark",
    usesLightText: palette.usesLightText,
  };
}

export function ViewerSurfaceThemeProvider({
  value,
  children,
}: {
  value: ViewerSurfaceTheme;
  children: ReactNode;
}) {
  return (
    <ViewerSurfaceThemeContext.Provider value={value}>
      {children}
    </ViewerSurfaceThemeContext.Provider>
  );
}

export function useViewerSurfaceTheme() {
  return useContext(ViewerSurfaceThemeContext);
}

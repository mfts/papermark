import { useFeatureFlags } from "@/lib/hooks/use-feature-flags";

/**
 * Returns the display name with hierarchical index if enabled
 */
export function useHierarchicalDisplayName(
  name: string,
  hierarchicalIndex?: string | null,
): string {
  const { isFeatureEnabled } = useFeatureFlags();
  const isDataroomIndexEnabled = isFeatureEnabled("dataroomIndex");

  if (isDataroomIndexEnabled && hierarchicalIndex) {
    return `${hierarchicalIndex} ${name}`;
  }

  return name;
}

/**
 * Non-hook version for use in non-React contexts
 */
export function getHierarchicalDisplayName(
  name: string,
  hierarchicalIndex?: string | null,
  isFeatureEnabled: boolean = false,
): string {
  if (isFeatureEnabled && hierarchicalIndex) {
    return `${hierarchicalIndex} ${name}`;
  }

  return name;
}

/**
 * CSS class for tabular numbers styling
 */
export const HIERARCHICAL_DISPLAY_STYLE = {
  fontVariantNumeric: "tabular-nums" as const,
};

import { useMemo } from "react";

import {
  FOLDER_COLORS,
  FolderColorId,
  getFolderColorClasses,
} from "@/lib/constants/folder-constants";
import { cn } from "@/lib/utils";

interface FolderColorPickerProps {
  value: FolderColorId | null | undefined;
  onChange: (colorId: FolderColorId) => void;
}

export function FolderColorPicker({ value, onChange }: FolderColorPickerProps) {
  const selectedColor = useMemo(() => {
    return value || "gray";
  }, [value]);

  return (
    <div className="flex flex-wrap gap-2">
      {FOLDER_COLORS.map((colorOption) => {
        const isSelected = selectedColor === colorOption.id;

        return (
          <button
            key={colorOption.id}
            type="button"
            onClick={() => onChange(colorOption.id)}
            className={cn(
              "flex h-8 items-center gap-2 rounded-full border px-3 text-sm transition-all",
              colorOption.bg,
              colorOption.border,
              colorOption.text,
              isSelected ? "ring-2 ring-offset-1" : "hover:scale-105",
            )}
            style={
              isSelected
                ? {
                    ringColor: `var(--${colorOption.id === "gray" ? "slate" : colorOption.id}-500)`,
                  }
                : undefined
            }
            title={colorOption.label}
          >
            <span
              className={cn(
                "h-3 w-3 rounded-full",
                colorOption.id === "gray"
                  ? "bg-gray-500"
                  : `bg-${colorOption.id}-500`,
              )}
              style={{
                backgroundColor:
                  colorOption.id === "gray"
                    ? "#6b7280"
                    : colorOption.id === "red"
                      ? "#ef4444"
                      : colorOption.id === "orange"
                        ? "#f97316"
                        : colorOption.id === "yellow"
                          ? "#eab308"
                          : colorOption.id === "green"
                            ? "#10b981"
                            : colorOption.id === "blue"
                              ? "#3b82f6"
                              : colorOption.id === "purple"
                                ? "#a855f7"
                                : colorOption.id === "pink"
                                  ? "#ec4899"
                                  : "#6b7280",
              }}
            />
            {colorOption.label}
          </button>
        );
      })}
    </div>
  );
}

// Helper component to get color preview dot
interface FolderColorDotProps {
  colorId: FolderColorId | null | undefined;
  className?: string;
}

export function FolderColorDot({ colorId, className }: FolderColorDotProps) {
  const colorClasses = getFolderColorClasses(colorId);

  const colorHex =
    colorId === "gray"
      ? "#6b7280"
      : colorId === "red"
        ? "#ef4444"
        : colorId === "orange"
          ? "#f97316"
          : colorId === "yellow"
            ? "#eab308"
            : colorId === "green"
              ? "#10b981"
              : colorId === "blue"
                ? "#3b82f6"
                : colorId === "purple"
                  ? "#a855f7"
                  : colorId === "pink"
                    ? "#ec4899"
                    : "#6b7280";

  return (
    <span
      className={cn("h-3 w-3 rounded-full", className)}
      style={{ backgroundColor: colorHex }}
    />
  );
}

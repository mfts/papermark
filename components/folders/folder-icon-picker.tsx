import { useMemo } from "react";

import {
  FOLDER_ICONS,
  FolderIconId,
  getFolderIcon,
} from "@/lib/constants/folder-constants";
import { cn } from "@/lib/utils";

import { ScrollArea } from "@/components/ui/scroll-area";

interface FolderIconPickerProps {
  value: FolderIconId | null | undefined;
  onChange: (iconId: FolderIconId) => void;
  colorClass?: string;
}

export function FolderIconPicker({
  value,
  onChange,
  colorClass = "text-gray-600",
}: FolderIconPickerProps) {
  const selectedIcon = useMemo(() => {
    return value || "folder";
  }, [value]);

  return (
    <ScrollArea className="h-[200px] rounded-md border p-2">
      <div className="grid grid-cols-6 gap-2">
        {FOLDER_ICONS.map((iconOption) => {
          const IconComponent = iconOption.icon;
          const isSelected = selectedIcon === iconOption.id;

          return (
            <button
              key={iconOption.id}
              type="button"
              onClick={() => onChange(iconOption.id)}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-md border transition-all hover:bg-muted",
                isSelected
                  ? "border-primary bg-primary/10 ring-2 ring-primary"
                  : "border-transparent",
              )}
              title={iconOption.label}
            >
              <IconComponent
                className={cn("h-5 w-5", isSelected ? colorClass : "text-muted-foreground")}
                strokeWidth={1.5}
              />
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}

// Preview component for displaying selected icon with color
interface FolderIconPreviewProps {
  iconId: FolderIconId | null | undefined;
  colorClass?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function FolderIconPreview({
  iconId,
  colorClass = "text-gray-600",
  className,
  size = "md",
}: FolderIconPreviewProps) {
  const IconComponent = getFolderIcon(iconId);

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <IconComponent
      className={cn(sizeClasses[size], colorClass, className)}
      strokeWidth={1.5}
    />
  );
}

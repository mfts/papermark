import { useMemo, useState } from "react";

import {
  FOLDER_COLORS,
  FOLDER_ICONS,
  FolderColorId,
  FolderIconId,
  getFolderColorClasses,
  getFolderIcon,
} from "@/lib/constants/folder-constants";
import { cn } from "@/lib/utils";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
                className={cn(
                  "h-5 w-5",
                  isSelected ? colorClass : "text-muted-foreground",
                )}
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

// Color hex values for color picker dots
const COLOR_HEX_VALUES: Record<FolderColorId, string> = {
  gray: "#6b7280",
  red: "#ef4444",
  orange: "#f97316",
  yellow: "#eab308",
  green: "#10b981",
  blue: "#3b82f6",
  black: "#000000",
};

// Combined Icon and Color Picker Popover
interface FolderIconColorPickerProps {
  iconValue: FolderIconId;
  colorValue: FolderColorId;
  onIconChange: (iconId: FolderIconId) => void;
  onColorChange: (colorId: FolderColorId) => void;
}

export function FolderIconColorPicker({
  iconValue,
  colorValue,
  onIconChange,
  onColorChange,
}: FolderIconColorPickerProps) {
  const [open, setOpen] = useState(false);
  const colorClasses = getFolderColorClasses(colorValue);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-muted/50 transition-colors hover:bg-muted"
          aria-label="Choose folder icon and color"
        >
          <FolderIconPreview
            iconId={iconValue}
            colorClass={colorClasses.iconClass}
            size="md"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-3" align="start">
        {/* Color Picker Row */}
        <div className="mb-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Colors
          </p>
          <div className="flex flex-wrap gap-2">
            {FOLDER_COLORS.map((colorOption) => {
              const isSelected = colorValue === colorOption.id;
              const hex = COLOR_HEX_VALUES[colorOption.id as FolderColorId];

              return (
                <button
                  key={colorOption.id}
                  type="button"
                  onClick={() => onColorChange(colorOption.id as FolderColorId)}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full transition-all",
                    isSelected
                      ? "ring-2 ring-offset-2 ring-offset-background"
                      : "hover:scale-110",
                  )}
                  style={{
                    backgroundColor: hex,
                    ...(isSelected && { '--tw-ring-color': hex }),
                  } as React.CSSProperties}
                  title={colorOption.label}
                  aria-label={`Select ${colorOption.label} color`}
                />
              );
            })}
          </div>
        </div>

        {/* Icon Picker Grid */}
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Icons
          </p>
          <ScrollArea className="h-[200px]">
            <div className="m-1 grid grid-cols-7 gap-1.5">
              {FOLDER_ICONS.map((iconOption) => {
                const IconComponent = iconOption.icon;
                const isSelected = iconValue === iconOption.id;

                return (
                  <button
                    key={iconOption.id}
                    type="button"
                    onClick={() => onIconChange(iconOption.id)}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-md transition-all hover:bg-muted",
                      isSelected && "bg-muted ring-1 ring-primary",
                    )}
                    title={iconOption.label}
                    aria-label={`Select ${iconOption.label} icon`}
                  >
                    <IconComponent
                      className={cn(
                        "h-5 w-5",
                        isSelected
                          ? colorClasses.iconClass
                          : "text-muted-foreground",
                      )}
                      strokeWidth={1.5}
                    />
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}

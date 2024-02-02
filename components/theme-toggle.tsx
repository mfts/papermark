"use client";

import * as React from "react";
import Sun from "@/components/shared/icons/sun";
import Moon from "@/components/shared/icons/moon";
import { Monitor, Palette } from "lucide-react";
import { useTheme } from "next-themes";
import {
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";

export function ModeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="w-full flex items-center px-3 !py-2 text-sm hover:!bg-gray-200 dark:hover:!bg-muted duration-200 rounded-none pr-2">
        <Palette className="w-4 h-4 mr-2" /> Themes
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent className="w-[180px]">
          <DropdownMenuRadioGroup
            value={theme}
            onValueChange={setTheme}
            className="*:flex *:items-center space-y-1"
          >
            <DropdownMenuRadioItem value="light">
              <Sun className="h-4 w-4 mr-2" />
              Light
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark">
              <Moon className="h-4 w-4 mr-2" />
              Dark
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="system">
              <Monitor className="h-4 w-4 mr-2" />
              System
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
}

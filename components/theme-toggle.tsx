"use client";

import * as React from "react";

import { Monitor, Palette } from "lucide-react";
import { useTheme } from "next-themes";

import Moon from "@/components/shared/icons/moon";
import Sun from "@/components/shared/icons/sun";
import {
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";

export function ModeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="flex w-full items-center rounded-none !py-2 px-3 pr-2 text-sm duration-200 hover:!bg-gray-200 dark:hover:!bg-muted">
        <Palette className="mr-2 h-4 w-4" /> Themes
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent className="w-[180px]">
          <DropdownMenuRadioGroup
            value={theme}
            onValueChange={setTheme}
            className="space-y-1 *:flex *:items-center"
          >
            <DropdownMenuRadioItem value="light">
              <Sun className="mr-2 h-4 w-4" />
              Light
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark">
              <Moon className="mr-2 h-4 w-4" />
              Dark
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="system">
              <Monitor className="mr-2 h-4 w-4" />
              System
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
}

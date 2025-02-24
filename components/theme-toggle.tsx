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
      <DropdownMenuSubTrigger>
        <Palette /> Change Theme
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent className="w-fit">
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

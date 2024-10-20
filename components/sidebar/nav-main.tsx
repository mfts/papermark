"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

export function NavMain({
  items,
}: {
  items: {
    name: string;
    href: string;
    icon: LucideIcon;
    current?: boolean;
    active?: boolean;
    disabled?: boolean;
  }[];
}) {
  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => {
          if (item.name === "Documents") {
            return (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton asChild tooltip={item.name} isActive>
                  <a href={item.href}>
                    <item.icon />
                    <span>{item.name}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          } else {
            return null;
          }
        })}
        
      </SidebarMenu>
    </SidebarGroup>
  );
}

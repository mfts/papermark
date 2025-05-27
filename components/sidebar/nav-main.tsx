"use client";

import Link from "next/link";

import { PlanEnum } from "@/ee/stripe/constants";
import { ChevronRight, CrownIcon, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

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

import { UpgradePlanModal } from "../billing/upgrade-plan-modal";

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  current?: boolean;
  isActive?: boolean;
  disabled?: boolean;
  plan?: PlanEnum;
  trigger?: string;
  highlightItem?: string[];
  items?: {
    title: string;
    url: string;
    current?: boolean;
  }[];
}

export function NavMain({ items }: { items: NavItem[] }) {
  return (
    <SidebarGroup>
      <SidebarMenu className="space-y-0.5 text-foreground">
        {items.map((item) => (
          <Collapsible key={item.title} asChild defaultOpen={item.isActive}>
            <SidebarMenuItem
              className={cn(
                item.current &&
                  "rounded-md bg-gray-200 font-semibold dark:bg-secondary",
              )}
            >
              <SidebarMenuButton asChild tooltip={item.title}>
                {item.disabled ? (
                  <UpgradePlanModal
                    key={item.title}
                    clickedPlan={item.plan as PlanEnum}
                    trigger={item.trigger}
                    highlightItem={item.highlightItem}
                  >
                    <div className="peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm text-muted-foreground outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0">
                      <item.icon />
                      <span
                        className="flex flex-row items-center gap-2 group-data-[collapsible=icon]:hidden"
                        id={item.plan}
                      >
                        {item.title}
                        <CrownIcon className="!size-4" />
                      </span>
                    </div>
                  </UpgradePlanModal>
                ) : (
                  <Link href={item.url} className="p-2">
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                )}
              </SidebarMenuButton>
              {item.items?.length ? (
                <>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuAction className="data-[state=open]:rotate-90">
                      <ChevronRight />
                      <span className="sr-only">Toggle</span>
                    </SidebarMenuAction>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => (
                        <SidebarMenuSubItem
                          key={subItem.title}
                          className={cn(
                            subItem.current &&
                              "rounded-md bg-gray-200 font-semibold dark:bg-secondary",
                          )}
                        >
                          <SidebarMenuSubButton asChild>
                            <a href={subItem.url}>
                              <span>{subItem.title}</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </>
              ) : null}
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

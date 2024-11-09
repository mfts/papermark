"use client";

import Link from "next/link";
import { useRouter } from "next/router";

import * as React from "react";

import { Separator } from "@/components/ui/separator";

import { cn } from "@/lib/utils";

type Props = {
  navigation: {
    label: string;
    href: string;
    segment: string | null;
    tag?: string;
    disabled?: boolean;
  }[];
  className?: string;
};

export const NavMenu: React.FC<React.PropsWithChildren<Props>> = ({
  navigation,
  className,
}) => {
  return (
    <nav
      className={cn("sticky top-0 bg-background dark:bg-gray-900", className)}
    >
      <div className="flex w-full items-center overflow-x-auto pl-1">
        <ul className="flex flex-row gap-4">
          {navigation.map(({ label, href, segment, tag, disabled }) => (
            <NavItem
              key={label}
              label={label}
              href={href}
              segment={segment}
              tag={tag}
              disabled={disabled}
            />
          ))}
        </ul>
      </div>
      <Separator />
    </nav>
  );
};

const NavItem: React.FC<Props["navigation"][0]> = ({
  label,
  href,
  segment,
  tag,
  disabled,
}) => {
  const router = useRouter();
  // active is true if the segment included in the pathname, but not if it's the root pathname. unless the segment is the root pathname.
  let active =
    router.pathname.includes(segment as string) &&
    segment !== "/datarooms/[id]";

  if (segment === "/datarooms/[id]") {
    active = router.pathname === "/datarooms/[id]";
  }

  return (
    <li
      className={cn(
        "flex shrink-0 list-none border-b-2 border-transparent p-2",
        {
          "border-primary": active,
          // "animate-pulse": isPending,
          hidden: disabled,
        },
      )}
    >
      <Link
        href={href}
        className={cn(
          "text-content-subtle hover:bg-background-subtle -mx-3 flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted hover:text-primary",
          {
            "text-primary": active,
          },
        )}
      >
        {label}
        {tag ? (
          <div className="text-content-subtle rounded border bg-background px-1 py-0.5 font-mono text-xs">
            {tag}
          </div>
        ) : null}
      </Link>
    </li>
  );
};

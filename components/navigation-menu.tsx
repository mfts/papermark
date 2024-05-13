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
  }[];
  className?: string;
};

export const NavMenu: React.FC<React.PropsWithChildren<Props>> = ({
  navigation,
  className,
}) => {
  return (
    <nav className={cn("sticky top-0 bg-background", className)}>
      <div className="flex w-full items-center overflow-x-auto pl-1">
        <ul className="flex flex-row gap-4">
          {navigation.map(({ label, href, segment, tag }) => (
            <NavItem
              key={label}
              label={label}
              href={href}
              segment={segment}
              tag={tag}
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
}) => {
  const router = useRouter();
  const active = segment === router.asPath.split("/").pop();

  return (
    <li
      className={cn(
        "flex shrink-0 list-none border-b-2 border-transparent p-2",
        {
          "border-primary": active,
          // "animate-pulse": isPending,
        },
      )}
    >
      <Link
        href={href}
        className={cn(
          "text-content-subtle hover:bg-background-subtle -mx-3 flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium hover:text-primary",
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

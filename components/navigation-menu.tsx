"use client";

import Link from "next/link";
import * as React from "react";

import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useRouter } from "next/router";

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
      <div className="flex items-center w-full pl-1 overflow-x-auto">
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
          "text-sm flex items-center gap-1 font-medium py-2 px-3 -mx-3 text-content-subtle hover:bg-background-subtle rounded-md hover:text-primary",
          {
            "text-primary": active,
          },
        )}
      >
        {label}
        {tag ? (
          <div className="bg-background border text-content-subtle rounded text-xs px-1 py-0.5 font-mono">
            {tag}
          </div>
        ) : null}
      </Link>
    </li>
  );
};

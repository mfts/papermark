import Link from "next/link";

import { cn } from "@/lib/utils";

const tabs = [
  { name: "General", href: "/settings/general" },
  { name: "People", href: "/settings/people" },
  { name: "Domains", href: "/settings/domains" },
  { name: "Branding", href: "/settings/branding" },
  { name: "Billing", href: "/settings/billing" },
];

export default function Navbar({ current }: { current?: string }) {
  return (
    <div className="p-4 sm:m-4 sm:p-4">
      <div className="mb-4 flex items-center justify-between md:mb-8 lg:mb-12">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Settings
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage your account settings
          </p>
        </div>
      </div>
      <div className="block">
        <div className="border-b border-gray-600">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <Link
                key={tab.name}
                href={tab.href}
                className={cn(
                  current === tab.name
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:border-foreground hover:text-foreground",
                  "whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium",
                )}
                aria-current={current === tab.name ? "page" : undefined}
              >
                {tab.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}

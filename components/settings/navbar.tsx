import { cn } from "@/lib/utils";
import Link from "next/link";

const tabs = [
  { name: "General", href: "/settings/general" },
  { name: "People", href: "/settings/people" },
  { name: "Domains", href: "/settings/domains" },
  { name: "Billing", href: "/settings/billing" },
];

export default function Navbar({ current }: { current?: string }) {
  return (
    <div className="p-4 sm:p-4 sm:m-4">
      <div className="flex items-center justify-between mb-4 md:mb-8 lg:mb-12">
        <div className="space-y-1">
          <h2 className="text-2xl text-foreground font-semibold tracking-tight">
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
                  "whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium",
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

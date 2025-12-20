import Cookies from "js-cookie";
import { useEffect, useState } from "react";

import { AppBreadcrumb } from "@/components/layouts/breadcrumb";
import TrialBanner from "@/components/layouts/trial-banner";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SIDEBAR_COOKIE_NAME,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import { usePlan } from "@/lib/swr/use-billing";
import YearlyUpgradeBanner from "@/components/billing/yearly-upgrade-banner";

import { BlockingModal } from "./blocking-modal";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  // Default to open (true) if no cookie exists, otherwise use the stored preference
  const cookieValue = Cookies.get(SIDEBAR_COOKIE_NAME);
  const isSidebarOpen =
    cookieValue === undefined ? true : cookieValue === "true";

  const { isAnnualPlan, isFree } = usePlan();
  const [showYearlyBanner, setShowYearlyBanner] = useState<boolean | null>(null);

  // Show banner only for paid monthly subscribers (not free, not yearly)
  useEffect(() => {
    // Hide banner for free users or yearly subscribers
    if (isFree || isAnnualPlan) {
      setShowYearlyBanner(false);
      return;
    }

    // Show banner for monthly paid users (if not dismissed)
    if (Cookies.get("hideYearlyUpgradeBanner") !== "yearly-upgrade-banner") {
      setShowYearlyBanner(true);
    } else {
      setShowYearlyBanner(false);
    }
  }, [isFree, isAnnualPlan]);

  return (
    <SidebarProvider defaultOpen={isSidebarOpen}>
      <div className="flex flex-1 flex-col gap-x-1 bg-gray-50 dark:bg-black md:flex-row">
        <AppSidebar />
        <SidebarInset className="ring-1 ring-gray-200 dark:ring-gray-800">
          <header className="flex h-10 shrink-0 items-center gap-2">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-1 h-4" />
              <AppBreadcrumb />
            </div>
          </header>
          <TrialBanner />
          <BlockingModal />
          <main className="flex-1">{children}</main>
        </SidebarInset>
      </div>
      {showYearlyBanner && (
        <YearlyUpgradeBanner setShowBanner={setShowYearlyBanner} />
      )}
    </SidebarProvider>
  );
}

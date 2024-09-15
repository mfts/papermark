import { useEffect, useState } from "react";

import Cookies from "js-cookie";

import TrialNavbar from "@/components/layouts/trialnavbar";

import { usePlan } from "@/lib/swr/use-billing";

import Sidebar from "../Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { trial } = usePlan(); // Get trial status]
  const [ShowTrialNavbar, setShowTrialNavbar] = useState<boolean | null>(null);

  useEffect(() => {
    if (Cookies.get("hideTrialNavbar") !== "trial-navbarr") {
      setShowTrialNavbar(true);
    } else {
      setShowTrialNavbar(false);
    }
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-black">
      <Sidebar />
      <div className="flex-1">
        {trial === "drtrial" && (
          <div className="mx-2 my-2 mb-2 rounded-xl border border-gray-900 bg-white p-1">
            {" "}
            {/* Increased margin-bottom and added horizontal margin */}
            <TrialNavbar />{" "}
            {/* Render TrialNavbar at the top of the main content */}
          </div>
        )}
        <main className="flex-1 lg:p-2">
          <div className="h-full overflow-y-auto rounded-xl bg-white ring-1 ring-gray-200 dark:border-none dark:bg-gray-900 dark:ring-gray-800">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

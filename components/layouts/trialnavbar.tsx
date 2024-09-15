import { Dispatch, SetStateAction } from "react";

// import { UpgradePlanModal } from "@/upgrade-plan-modal";
import Cookies from "js-cookie";
import { PhoneIcon, PlusIcon } from "lucide-react";
// Import the UpgradePlanModal
import { usePlausible } from "next-plausible";

import X from "@/components/shared/icons/x";
// Import the close icon
import { Button } from "@/components/ui/button";

import { usePlan } from "@/lib/swr/use-billing";
import useDatarooms from "@/lib/swr/use-datarooms";
import useLimits from "@/lib/swr/use-limits";
import { daysLeft } from "@/lib/utils";

import { UpgradePlanModal } from "../billing/upgrade-plan-modal";

export default function TrialNavbar({
  setShowTrialNavbar,
}: {
  setShowTrialNavbar: Dispatch<SetStateAction<boolean | null>>;
}) {
  // Check if the navbar should be shown based on the cookie
  const shouldShowNavbar = Cookies.get("hideTrialNavbar") !== "trial-navbar";

  const plausible = usePlausible();

  const handleCloseNavbar = () => {
    setShowTrialNavbar(false);
    plausible("clickedCloseTrialNavbar");
    // Set cookie to hide navbar for 24 hours
    Cookies.set("hideTrialNavbar", "trial-navbar", { expires: 1 }); // 1 day
  };

  const { datarooms } = useDatarooms();

  const { plan, trial } = usePlan();
  const { limits } = useLimits();

  const numDatarooms = datarooms?.length ?? 0;
  const limitDatarooms = limits?.datarooms ?? 1;

  const isBusiness = plan === "business";
  const isDatarooms = plan === "datarooms";

  isDatarooms || (isBusiness && numDatarooms < limitDatarooms);

  // Only render the navbar if it should be shown
  if (!shouldShowNavbar) return null;

  return (
    <nav className="relative flex flex-col bg-white p-4">
      <button
        type="button"
        onClick={handleCloseNavbar}
        className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none"
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </button>
      <div className="flex items-center gap-x-4">
        <div className="flex space-x-2">
          <span className="py-2 text-sm font-bold">
            Data Room trial:{" "}
            {datarooms && daysLeft(new Date(datarooms[0].createdAt), 7)} days
            left
          </span>
        </div>
      </div>

      <p className="text-sm">
        You are on a data room trial, you have access to advanced link
        permissions and data room.{" "}
        <UpgradePlanModal clickedPlan={"Data Rooms"} trigger={"trial_navbar"}>
          <span
            className="cursor-pointer font-bold text-orange-500"
            onClick={() => plausible("clickedUpgradeTrialNavbar")}
          >
            Upgrade to keep access
          </span>
        </UpgradePlanModal>
        , get more data rooms and custom domains ✨
      </p>
      <div className="flex items-center gap-x-2">
        {/* <a
          href="https://cal.com/marcseitz/papermark"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center p-2 text-muted-foreground hover:text-primary"
        >
          <PhoneIcon className="h-5 w-5" aria-hidden="true" />
        </a> */}
      </div>
    </nav>
  );
}

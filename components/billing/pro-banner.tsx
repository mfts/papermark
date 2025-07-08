import { Dispatch, SetStateAction } from "react";

import { PlanEnum } from "@/ee/stripe/constants";
import Cookies from "js-cookie";
import { usePlausible } from "next-plausible";

import X from "@/components/shared/icons/x";
import { Button } from "@/components/ui/button";

import { UpgradePlanModal } from "./upgrade-plan-modal";

export default function ProBanner({
  setShowProBanner,
}: {
  setShowProBanner: Dispatch<SetStateAction<boolean | null>>;
}) {
  const plausible = usePlausible();

  const handleHideBanner = () => {
    setShowProBanner(false);
    plausible("clickedHideBanner");
    Cookies.set("hideProBanner", "pro-banner", {
      expires: 7,
    });
  };

  return (
    <aside className="relative mb-2 flex w-full flex-col justify-center rounded-lg border border-gray-700 bg-background p-4 text-foreground">
      <button
        type="button"
        onClick={handleHideBanner}
        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </button>
      <div className="flex space-x-2">
        <span className="text-sm font-bold">✨ Papermark Business ✨</span>
      </div>
      <p className="my-4 text-sm">
        Upgrade to unlock custom branding, team members, domains and data rooms.
      </p>
      <div className="flex">
        <UpgradePlanModal
          clickedPlan={PlanEnum.Pro}
          trigger={"pro_banner"}
        >
          <Button
            type="button"
            className="grow"
            onClick={() => {
              plausible("clickedProBanner");
            }}
          >
            Upgrade
          </Button>
        </UpgradePlanModal>
      </div>
    </aside>
  );
}

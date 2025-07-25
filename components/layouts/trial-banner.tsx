import { Dispatch, SetStateAction, useEffect, useState } from "react";

import { useTeam } from "@/context/team-context";
import { PlanEnum } from "@/ee/stripe/constants";
import Cookies from "js-cookie";
import { CrownIcon } from "lucide-react";
import { usePlausible } from "next-plausible";

import { usePlan } from "@/lib/swr/use-billing";
import useDatarooms from "@/lib/swr/use-datarooms";
import { daysLeft } from "@/lib/utils";

import { UpgradePlanModal } from "@/components/billing/upgrade-plan-modal";
import {
  Alert,
  AlertClose,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

export default function TrialBanner() {
  const { trial } = usePlan();
  const isTrial = !!trial;
  const [showTrialBanner, setShowTrialBanner] = useState<boolean | null>(null);

  useEffect(() => {
    if (Cookies.get("hideTrialBanner") !== "trial-banner" && isTrial) {
      setShowTrialBanner(true);
    } else {
      setShowTrialBanner(false);
    }
  }, []);

  if (isTrial && showTrialBanner) {
    return <TrialBannerComponent setShowTrialBanner={setShowTrialBanner} />;
  }

  return null;
}

function TrialBannerComponent({
  setShowTrialBanner,
}: {
  setShowTrialBanner: Dispatch<SetStateAction<boolean | null>>;
}) {
  const teamInfo = useTeam();
  const plausible = usePlausible();

  const handleHideBanner = () => {
    setShowTrialBanner(false);
    plausible("clickedHideTrialBanner");
    Cookies.set("hideTrialBanner", "trial-banner", {
      expires: 1,
    });
  };

  const { datarooms } = useDatarooms();

  return (
    <div className="mx-2 my-2 mb-2">
      <Alert variant="default">
        <CrownIcon className="h-4 w-4" />
        <AlertTitle>
          Data Room trial:{" "}
          {datarooms &&
            daysLeft(
              new Date(
                datarooms[0]?.createdAt ??
                  teamInfo?.currentTeam?.createdAt ??
                  new Date(),
              ),
              7,
            )}{" "}
          days left
        </AlertTitle>
        <AlertDescription>
          You are on the <span className="font-bold">Data Rooms</span> plan
          trial, you have access to advanced access controls, granular file
          permissions, and data room. <br />
          <UpgradePlanModal
            clickedPlan={PlanEnum.DataRooms}
            trigger={"trial_navbar"}
          >
            <span
              className="cursor-pointer font-bold text-orange-500 underline underline-offset-4 hover:text-orange-600"
              onClick={() => plausible("clickedUpgradeTrialNavbar")}
            >
              Upgrade to keep access
            </span>
          </UpgradePlanModal>
          , unlock unlimited data rooms and custom domains ✨
        </AlertDescription>
        <AlertClose onClick={handleHideBanner} />
      </Alert>
    </div>
  );
}

import { useRouter } from "next/router";

import { Dispatch, SetStateAction, useState } from "react";

import { useTeam } from "@/context/team-context";
import { getPriceIdFromPlan } from "@/ee/stripe/functions/get-price-id-from-plan";
import Cookies from "js-cookie";
import { usePlausible } from "next-plausible";
import { toast } from "sonner";

import { usePlan } from "@/lib/swr/use-billing";

import X from "@/components/shared/icons/x";
import { Button } from "@/components/ui/button";

export default function ProAnnualBanner({
  setShowProAnnualBanner,
}: {
  setShowProAnnualBanner: Dispatch<SetStateAction<boolean | null>>;
}) {
  const plausible = usePlausible();
  const router = useRouter();
  const teamInfo = useTeam();
  const { plan: teamPlan, trial, isCustomer, isOldAccount } = usePlan();

  const [isLoading, setIsLoading] = useState(false);

  const handleHideBanner = () => {
    setShowProAnnualBanner(false);
    plausible("clickedHideProAnnualBanner");
    Cookies.set("hideProAnnualBanner", "pro-annual-banner", {
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
        <span className="text-sm font-bold">Papermark Pro Annual ✨</span>
      </div>
      <p className="my-4 text-sm">
        Lock in a better price and get 2 months free.
      </p>
      <div className="flex">
        <Button
          type="button"
          className="grow"
          loading={isLoading}
          onClick={() => {
            if (isCustomer && teamPlan === "pro") {
              setIsLoading(true);
              fetch(`/api/teams/${teamInfo?.currentTeam?.id}/billing/manage`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  priceId: getPriceIdFromPlan({
                    planSlug: "pro",
                    isOld: isOldAccount,
                    period: "yearly",
                  }),
                  upgradePlan: true,
                  proAnnualBanner: true,
                }),
              })
                .then(async (res) => {
                  const url = await res.json();
                  router.push(url);
                })
                .catch((err) => {
                  alert(err);
                  toast.error("Something went wrong");
                })
                .finally(() => {
                  setIsLoading(false);
                });
            }
          }}
        >
          {isLoading ? "Redirecting..." : "Upgrade"}
        </Button>
      </div>
    </aside>
  );
}

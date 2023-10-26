import Cookies from "js-cookie";
import { Dispatch, SetStateAction } from "react";
import { UpgradePlanModal } from "./upgrade-plan-modal";
import { Button } from "@/components/ui/button";
import { usePlausible } from "next-plausible";
import X from "@/components/shared/icons/x";

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
    <aside className="flex flex-col justify-center w-full bg-background text-foreground p-4 mb-2 rounded-lg border border-gray-700 relative">
      <button
        type="button"
        onClick={handleHideBanner}
        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
      >
        <X className="w-4 h-4" />
        <span className="sr-only">Close</span>
      </button>
      <div className="flex space-x-2">
        <span className="font-bold text-sm">✨ Papermark Pro ✨</span>
      </div>
      <p className="my-4 text-sm">
        Join the Papermark Pro plan to unlock custom domains, team members, and
        more.
      </p>
      <div className="flex">
        <UpgradePlanModal>
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

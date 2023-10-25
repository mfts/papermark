import Cookies from "js-cookie";
import { Dispatch, SetStateAction } from "react";
import { UpgradePlanModal } from "./upgrade-plan-modal";
import { Button } from "../ui/button";
import { usePlausible } from "next-plausible";

export default function ProBanner({
  setShowProBanner,
}: {
  setShowProBanner: Dispatch<SetStateAction<boolean | null>>;
}) {
  const plausible = usePlausible();
  return (
    <div className="fixed bottom-5 z-20 mx-5 flex flex-col space-y-4 rounded-lg border border-gray-700 bg-background p-5 shadow-lg sm:right-5 sm:mx-auto sm:max-w-sm">
      <h3 className="text-lg font-semibold">Product Hunt Special ✨😻</h3>
      <p className="text-sm text-gray-500">
        To celebrate the launch of Papermark on Product Hunt, we are offering a{" "}
        <span className="font-bold">30% discount</span> on Pro plans today only.
        The coupon code is{" "}
        <span className="font-bold text-emerald-500">30YEARLYPH</span>.
      </p>
      <div className="flex space-x-5">
        <Button
          variant="secondary"
          onClick={() => {
            setShowProBanner(false);
            plausible("clickedHideBanner");
            Cookies.set("hideProBanner", "producthunt-banner", { expires: 7 });
          }}
        >
          Don&apos;t show again
        </Button>
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
    </div>
  );
}

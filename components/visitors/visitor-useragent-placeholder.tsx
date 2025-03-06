import { PlanEnum } from "@/ee/stripe/constants";
import { CrownIcon } from "lucide-react";

import { UpgradePlanModal } from "@/components/billing/upgrade-plan-modal";
import { Button } from "@/components/ui/button";
import UAIcon from "@/components/user-agent-icon";

export default function VisitorUserAgentPlaceholder() {
  return (
    <div className="relative">
      <div className="blur-[2px]">
        <div className="inline-flex items-center gap-x-1 pb-0.5 pl-1.5 text-sm text-muted-foreground md:pb-1 md:pl-2">
          <div className="flex items-center gap-x-1 px-1 opacity-50">
            <img
              alt="Preview"
              src="https://flag.vercel.app/m/US.svg"
              className="h-3 w-4"
            />
            <span className="text-muted-foreground">
              San Francisco, United States
            </span>
          </div>
        </div>
        <div className="flex items-center gap-x-1 pb-0.5 pl-1.5 opacity-50">
          <div className="flex items-center gap-x-1 px-1">
            <UAIcon display="Mobile" type="devices" className="size-4" />
            <span className="text-muted-foreground">iPhone,</span>
          </div>
          <div className="flex items-center gap-x-1 px-1">
            <UAIcon display="Chrome" type="browsers" className="size-4" />
            <span className="text-muted-foreground">Chrome,</span>
          </div>
          <div className="flex items-center gap-x-1 px-1">
            <UAIcon display="iOS" type="os" className="size-4" />
            <span className="text-muted-foreground">iOS</span>
          </div>
        </div>
      </div>
      <div className="absolute left-8 top-3">
        <UpgradePlanModal
          clickedPlan={PlanEnum.Pro}
          trigger="visitor-table-user-agent"
        >
          <Button
            variant="outline"
            size="sm"
            className="h-6 gap-x-1 px-1.5 py-0.5"
          >
            <CrownIcon className="size-4" />
            <span>See more visitor info</span>
          </Button>
        </UpgradePlanModal>
      </div>
    </div>
  );
}

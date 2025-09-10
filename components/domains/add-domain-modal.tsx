import { useState } from "react";

import { useTeam } from "@/context/team-context";
import { PlanEnum } from "@/ee/stripe/constants";
import { toast } from "sonner";
import { z } from "zod";

import { useAnalytics } from "@/lib/analytics";
import { usePlan } from "@/lib/swr/use-billing";
import useLimits from "@/lib/swr/use-limits";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { UpgradePlanModal } from "../billing/upgrade-plan-modal";
import { UpgradeButton } from "../ui/upgrade-button";

export function AddDomainModal({
  open,
  setOpen,
  onAddition,
  linkType,
  children,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onAddition?: (newDomain: string) => void;
  linkType?: "DOCUMENT_LINK" | "DATAROOM_LINK";
  children?: React.ReactNode;
}) {
  const [domain, setDomain] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const teamInfo = useTeam();
  const { isFree, isPro, isBusiness } = usePlan();
  const { limits } = useLimits();
  const analytics = useAnalytics();
  const addDomainSchema = z.object({
    name: z
      .string()
      .min(3, {
        message: "Please provide a domain name with at least 3 characters.",
      })
      // Add validation for papermark
      .refine((name) => !name.toLowerCase().includes("papermark"), {
        message: "Domain cannot contain 'papermark'",
      }),
  });

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    event.stopPropagation();

    const validation = addDomainSchema.safeParse({ name: domain });
    if (!validation.success) {
      return toast.error(validation.error.errors[0].message);
    }

    setLoading(true);
    const response = await fetch(
      `/api/teams/${teamInfo?.currentTeam?.id}/domains`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          domain: domain,
        }),
      },
    );

    if (!response.ok) {
      const { message } = await response.json();
      setLoading(false);
      setOpen(false);
      toast.error(message);
      return;
    }

    const newDomain = await response.json();

    analytics.capture("Domain Added", { slug: domain });
    toast.success("Domain added successfully! 🎉");

    // Update local data with the new link
    onAddition && onAddition(newDomain);

    setOpen(false);

    setLoading(false);

    !onAddition && window.open("/settings/domains", "_blank");
  };

  // If the team is
  // - on a free plan
  // - on pro plan and has custom domain on pro plan disabled
  // - on business plan and has custom domain in dataroom disabled
  // => then show the upgrade modal
  if (
    isFree ||
    (isPro && !limits?.customDomainOnPro) ||
    (linkType === "DATAROOM_LINK" &&
      isBusiness &&
      !limits?.customDomainInDataroom)
  ) {
    if (children) {
      return (
        <UpgradeButton
          text="Add Domain"
          clickedPlan={
            linkType === "DATAROOM_LINK"
              ? PlanEnum.DataRooms
              : PlanEnum.Business
          }
          highlightItem={["custom-domain"]}
          trigger="add_domain_overview"
        />
      );
    } else {
      return (
        <UpgradePlanModal
          clickedPlan={
            linkType === "DATAROOM_LINK"
              ? PlanEnum.DataRooms
              : PlanEnum.Business
          }
          open={open}
          setOpen={setOpen}
          trigger={"add_domain_link_sheet"}
          highlightItem={["custom-domain"]}
        />
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="text-start">
          <DialogTitle>Add Domain</DialogTitle>
          <DialogDescription>
            You can easily add a custom domain.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Label htmlFor="domain" className="opacity-80">
            Domain
          </Label>
          <Input
            id="domain"
            placeholder="docs.yourdomain.com"
            className="mb-8 mt-1 w-full"
            onChange={(e) => setDomain(e.target.value)}
          />
          <DialogFooter>
            <Button type="submit" className="h-9 w-full">
              Add domain
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

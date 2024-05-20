import { useEffect, useMemo, useState } from "react";
import React from "react";

import { useTeam } from "@/context/team-context";
import { motion } from "framer-motion";
import { CheckIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useAnalytics } from "@/lib/analytics";
import { STAGGER_CHILD_VARIANTS } from "@/lib/constants";
import { getStripe } from "@/lib/stripe/client";
import { PLANS } from "@/lib/stripe/utils";
import { capitalize } from "@/lib/utils";

import { DataroomTrialModal } from "../datarooms/dataroom-trial-modal";
import { Badge } from "../ui/badge";

export function UpgradePlanModal({
  clickedPlan,
  trigger,
  open,
  setOpen,
  children,
}: {
  clickedPlan: "Data Rooms" | "Business" | "Pro";
  trigger?: string;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  children?: React.ReactNode;
}) {
  const [plan, setPlan] = useState<"Pro" | "Business" | "Data Rooms">(
    clickedPlan,
  );
  const [period, setPeriod] = useState<"monthly" | "yearly">("monthly");
  const [clicked, setClicked] = useState<boolean>(false);
  const teamInfo = useTeam();
  const analytics = useAnalytics();

  const features = useMemo(() => {
    if (plan === "Pro") {
      return [
        "2 users",
        "Custom branding",
        "1-year analytics retention",
        "Advanced access controls",
        "Folder organization",
      ];
    }

    if (plan === "Business") {
      return [
        "3 users",
        "1 dataroom",
        "Multi-file sharing",
        "Custom domain for documents",
        "Unlimited documents",
        "Unlimited subfolder levels",
        "Large file uploads",
        "48h priority support",
      ];
    }
    if (plan === "Data Rooms") {
      return [
        "5 users included",
        "Unlimited data rooms",
        "Custom domain for data rooms",
        "Unlimited documents",
        "Unlimited folders and subfolders",
        "User groups permissions",
        "Advanced data rooms analytics",
        "24h priority support",
        "Custom onboarding",
      ];
    }

    return [
      "2 users",
      "Custom branding",
      "1-year analytics retention",
      "Advanced access controls",
      "Folders",
    ];
  }, [plan]);

  // Track analytics event when modal is opened
  useEffect(() => {
    if (open) {
      analytics.capture("Upgrade Button Clicked", {
        trigger: trigger,
        teamId: teamInfo?.currentTeam?.id,
      });
    }
  }, [open, trigger]);

  // Track analytics event when child button is present
  const handleUpgradeClick = () => {
    analytics.capture("Upgrade Button Clicked", {
      trigger: trigger,
      teamId: teamInfo?.currentTeam?.id,
    });
  };

  // If button is present, clone it and add onClick handler
  const buttonChild = React.isValidElement<{
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
  }>(children)
    ? React.cloneElement(children, { onClick: handleUpgradeClick })
    : children;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{buttonChild}</DialogTrigger>
      <DialogContent className="bg-background text-foreground">
        <motion.div
          variants={{
            show: {
              transition: {
                staggerChildren: 0.15,
              },
            },
          }}
          initial="hidden"
          animate="show"
          className="flex flex-col items-center justify-center space-y-3 border-b border-border py-8 sm:px-12"
        >
          <motion.div variants={STAGGER_CHILD_VARIANTS}>
            <p className="text-2xl font-bold tracking-tighter text-foreground">
              Papermark
            </p>
          </motion.div>
          <motion.h3
            className="text-lg font-medium"
            variants={STAGGER_CHILD_VARIANTS}
          >
            Upgrade to {plan}
          </motion.h3>
          <motion.p
            className="text-center text-sm text-muted-foreground"
            variants={STAGGER_CHILD_VARIANTS}
          >
            Enjoy higher limits and extra features with our {plan} plan.
          </motion.p>
        </motion.div>

        <div className="bg-background pb-8 text-left sm:px-8">
          <Tabs className="pb-4" defaultValue={plan}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="Pro" onClick={() => setPlan("Pro")}>
                Pro
              </TabsTrigger>
              <TabsTrigger value="Business" onClick={() => setPlan("Business")}>
                Business
              </TabsTrigger>
              <TabsTrigger
                value="Data Rooms"
                onClick={() => setPlan("Data Rooms")}
              >
                Data Rooms
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <motion.div
            className="flex flex-col space-y-3"
            variants={STAGGER_CHILD_VARIANTS}
            initial="hidden"
            animate="show"
          >
            <div className="mb-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium text-foreground">
                    {plan} {capitalize(period)}
                  </h4>
                  <Badge
                    variant="outline"
                    className="text-sm font-normal normal-case"
                  >
                    {`€${
                      PLANS.find((p) => p.name === plan)!.price[period].amount
                    }/month`}{" "}
                    {period === "yearly" ? (
                      <span className="ml-1 text-xs">(billed yearly)</span>
                    ) : null}
                  </Badge>
                </div>
                <button
                  onClick={() => {
                    setPeriod(period === "monthly" ? "yearly" : "monthly");
                  }}
                  className="text-xs text-muted-foreground underline underline-offset-4 transition-colors hover:text-gray-800 hover:dark:text-muted-foreground/80"
                >
                  {period === "monthly"
                    ? ["Business", "Data Rooms"].includes(plan)
                      ? "Want 25% off?"
                      : "Want 35% off?"
                    : "Switch to monthly"}
                </button>
              </div>
              <motion.div
                variants={{
                  show: {
                    transition: {
                      staggerChildren: 0.08,
                    },
                  },
                }}
                initial="hidden"
                animate="show"
                className="flex flex-col space-y-2"
              >
                {features.map((feature, i) => (
                  <motion.div
                    key={i}
                    variants={STAGGER_CHILD_VARIANTS}
                    className="flex items-center gap-x-3 text-sm text-muted-foreground"
                  >
                    <CheckIcon
                      className="h-5 w-5 flex-none text-[#fb7a00]"
                      aria-hidden="true"
                    />
                    <span>{feature}</span>
                  </motion.div>
                ))}
              </motion.div>
            </div>
            <Button
              loading={clicked}
              onClick={() => {
                setClicked(true);
                fetch(
                  `/api/teams/${
                    teamInfo?.currentTeam?.id
                  }/billing/upgrade?priceId=${
                    PLANS.find((p) => p.name === plan)!.price[period].priceIds[
                      process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
                        ? "production"
                        : "test"
                    ]
                  }`,
                  {
                    method: "POST",
                  },
                )
                  .then(async (res) => {
                    const data = await res.json();
                    const { id: sessionId } = data;
                    const stripe = await getStripe();
                    stripe?.redirectToCheckout({ sessionId });
                  })
                  .catch((err) => {
                    alert(err);
                    setClicked(false);
                  });
              }}
            >{`Upgrade to ${plan} ${capitalize(period)}`}</Button>
            <div className="flex items-center justify-center space-x-2">
              {plan === "Business" ? (
                <DataroomTrialModal>
                  <button
                    className="text-center text-xs text-muted-foreground underline-offset-4 transition-all hover:text-gray-800 hover:underline hover:dark:text-muted-foreground/80"
                    onClick={() => analytics.capture("Dataroom Trial Clicked")}
                  >
                    Looking for a dataroom trial?
                  </button>
                </DataroomTrialModal>
              ) : (
                <a
                  href="https://cal.com/marcseitz/papermark"
                  target="_blank"
                  className="text-center text-xs text-muted-foreground underline-offset-4 transition-all hover:text-gray-800 hover:underline hover:dark:text-muted-foreground/80"
                >
                  Looking for Papermark Enterprise?
                </a>
              )}
            </div>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

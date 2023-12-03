import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { STAGGER_CHILD_VARIANTS } from "@/lib/constants";
import CheckCircle2 from "@/components/shared/icons/check-cirlce-2";
import { capitalize } from "@/lib/utils";
import { PLANS } from "@/lib/stripe/utils";
import { getStripe } from "@/lib/stripe/client";
import { Badge } from "../ui/badge";
import { useTeam } from "@/context/team-context";

export function UpgradePlanModal({ children }: { children: React.ReactNode }) {
  const [plan, setPlan] = useState<"Pro">("Pro");
  const [period, setPeriod] = useState<"monthly" | "yearly">("monthly");
  const [clicked, setClicked] = useState<boolean>(false);
  const teamInfo = useTeam();

  const features = useMemo(() => {
    return [
      "Custom domain",
      "Unlimited link views",
      "Unlimited documents",
      "Unlimited team members (ETA Nov 2023)",
    ];
  }, [plan]);

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="text-foreground bg-background">
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
          className="flex flex-col items-center justify-center space-y-3 border-b border-border px-4 py-8 sm:px-16"
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
        <div className="bg-background px-4 py-8 text-left sm:px-16">
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
                  >{`$${
                    PLANS.find((p) => p.name === plan)!.price[period].amount
                  }/${period.replace("ly", "")}`}</Badge>
                </div>
                <button
                  onClick={() => {
                    setPeriod(period === "monthly" ? "yearly" : "monthly");
                  }}
                  className="text-xs text-muted-foreground underline underline-offset-4 transition-colors hover:text-gray-800 hover:dark:text-muted-foreground/80"
                >
                  {period === "monthly"
                    ? "Get 2 months free 🎁"
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
                    className="flex items-center space-x-2 text-sm text-muted-foreground"
                  >
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <span>{feature}</span>
                  </motion.div>
                ))}
              </motion.div>
            </div>
            <Button
              disabled={clicked}
              onClick={() => {
                setClicked(true);
                fetch(
                  `/api/teams/${teamInfo?.currentTeam
                    ?.id}/billing/upgrade?priceId=${
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
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

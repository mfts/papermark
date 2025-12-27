import { NextPage } from "next";
import { useEffect, useState } from "react";

import { useSession } from "next-auth/react";
import { toast } from "sonner";

import { AccountHeader } from "@/components/account/account-header";
import { UpdateMailSubscribe } from "@/components/account/update-subscription";
import UploadAvatar from "@/components/account/upload-avatar";
import { UpgradePlanModalWithDiscount } from "@/components/billing/upgrade-plan-modal-with-discount";
import AppLayout from "@/components/layouts/app";
import { Form } from "@/components/ui/form";
import { PlanEnum } from "@/ee/stripe/constants";

import { usePlan } from "@/lib/swr/use-billing";
import { validateEmail } from "@/lib/utils/validate-email";

const ProfilePage: NextPage = () => {
  const { data: session, update } = useSession();
  const { plan: teamPlan, isAnnualPlan, isFree } = usePlan();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Determine the next plan to highlight
  const getNextPlan = () => {
    if (isFree) return PlanEnum.Pro;
    if (teamPlan === "pro") return PlanEnum.Business;
    if (teamPlan === "business") return PlanEnum.DataRooms;
    return PlanEnum.Business; // Default
  };

  const nextPlan = getNextPlan();

  // Show modal for monthly subscribers and free users when opening account
  useEffect(() => {
    if (!isAnnualPlan) {
      // Show modal for monthly subscribers and free users
      setShowUpgradeModal(true);
    }
  }, [isAnnualPlan]);

  return (
    <AppLayout>
      <UpgradePlanModalWithDiscount
        clickedPlan={nextPlan}
        trigger="account_page"
        open={showUpgradeModal}
        setOpen={setShowUpgradeModal}
      />
      <main className="relative mx-2 mb-10 mt-4 space-y-8 overflow-hidden px-1 sm:mx-3 md:mx-5 md:mt-5 lg:mx-7 lg:mt-8 xl:mx-10">
        <AccountHeader />
        <div className="space-y-6">
          <Form
            title="Your Name"
            description="This will be your display name on Papermark."
            inputAttrs={{
              name: "name",
              placeholder: "Dino Hems",
              maxLength: 32,
            }}
            defaultValue={session?.user?.name ?? ""}
            helpText="Max 32 characters."
            handleSubmit={(data) =>
              fetch("/api/account", {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
              }).then(async (res) => {
                if (res.status === 200) {
                  update();
                  toast.success("Successfully updated your name!");
                } else {
                  const { error } = await res.json();
                  toast.error(error?.message);
                }
              })
            }
          />
          <Form
            title="Your Email"
            description="This will be the email you use to log in to Papermark and receive notifications. A confirmation is required for changes."
            inputAttrs={{
              name: "email",
              placeholder: "name@example.com",
              maxLength: 52,
              type: "email",
            }}
            defaultValue={session?.user?.email ?? ""}
            validate={validateEmail}
            helpText={<UpdateMailSubscribe />}
            handleSubmit={(data) =>
              fetch("/api/account", {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
              }).then(async (res) => {
                if (res.status === 200) {
                  toast.success(
                    `A confirmation email has been sent to ${session?.user?.email}.`,
                  );
                } else {
                  const { error } = await res.json();
                  toast.error(error);
                }
              })
            }
          />
          <UploadAvatar
            title="Your Avatar"
            description="This is your avatar image on Papermark."
            helpText="Square image recommended. Accepted file types: .png, .jpg. Max file
          size: 2MB."
          />
        </div>
      </main>
    </AppLayout>
  );
};

export default ProfilePage;

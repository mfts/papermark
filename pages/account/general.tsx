import { NextPage } from "next";
import { useEffect, useState } from "react";

import { signOut, useSession } from "next-auth/react";
import { toast } from "sonner";

import { AccountHeader } from "@/components/account/account-header";
import { UpdateMailSubscribe } from "@/components/account/update-subscription";
import UploadAvatar from "@/components/account/upload-avatar";
import { UpgradePlanModal } from "@/components/billing/upgrade-plan-modal";
import AppLayout from "@/components/layouts/app";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { PlanEnum } from "@/ee/stripe/constants";

import { usePlan } from "@/lib/swr/use-billing";
import { validateEmail } from "@/lib/utils/validate-email";

const ProfilePage: NextPage = () => {
  const { data: session, update } = useSession();
  const { plan: teamPlan, isAnnualPlan, isFree } = usePlan();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isRevokingSessions, setIsRevokingSessions] = useState(false);

  // Determine the next plan to highlight
  const getNextPlan = () => {
    if (isFree) return PlanEnum.Pro;
    if (teamPlan === "pro") return PlanEnum.Business;
    if (teamPlan === "business") return PlanEnum.DataRooms;
    return PlanEnum.Business; // Default
  };

  const nextPlan = getNextPlan();

  const handleRevokeAllSessions = async () => {
    setIsRevokingSessions(true);
    try {
      const res = await fetch("/api/account/revoke-sessions", {
        method: "POST",
      });

      if (res.ok) {
        toast.success(
          "All sessions have been revoked. You will be logged out now.",
        );
        // Sign out the current session after a short delay
        setTimeout(() => {
          signOut({ callbackUrl: "/login" });
        }, 1500);
      } else {
        const { error } = await res.json();
        toast.error(error || "Failed to revoke sessions");
      }
    } catch (error) {
      toast.error("Failed to revoke sessions. Please try again.");
    } finally {
      setIsRevokingSessions(false);
    }
  };

  // Show modal for monthly subscribers and free users when opening account
  useEffect(() => {
    if (!isAnnualPlan) {
      // Show modal for monthly subscribers and free users
      setShowUpgradeModal(true);
    }
  }, [isAnnualPlan]);

  return (
    <AppLayout>
      <UpgradePlanModal
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

          {/* Session Management Section */}
          <Card className="bg-transparent">
            <CardHeader>
              <CardTitle>Session Management</CardTitle>
              <CardDescription>
                Sign out of all devices where you are currently logged in. This
                will immediately terminate all active sessions across all
                browsers and devices.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Use this if you believe your account may have been compromised
                or if you want to ensure no other devices have access to your
                account.
              </p>
            </CardContent>
            <CardFooter className="flex items-center justify-between rounded-b-lg border-t bg-muted px-6 py-3">
              <p className="text-sm text-muted-foreground">
                You will need to sign in again after revoking all sessions.
              </p>
              <div className="shrink-0">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isRevokingSessions}>
                      Sign out all devices
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Sign out of all devices?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This will immediately sign you out from all devices and
                        browsers where you are currently logged in, including
                        this one. You will need to sign in again.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleRevokeAllSessions}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {isRevokingSessions
                          ? "Signing out..."
                          : "Sign out all devices"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardFooter>
          </Card>
        </div>
      </main>
    </AppLayout>
  );
};

export default ProfilePage;

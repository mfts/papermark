import { NextPage } from "next";
import { useEffect, useState } from "react";

import {
  GlobeIcon,
  Laptop2Icon,
  MonitorIcon,
  SmartphoneIcon,
  TabletIcon,
  Trash2Icon,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
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
import { useSessions, UserSessionData } from "@/lib/swr/use-sessions";
import { validateEmail } from "@/lib/utils/validate-email";

// Helper function to format relative time
function formatLastActive(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
  if (diffHours < 24)
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

// Helper function to get device icon
function getDeviceIcon(device: string | null) {
  switch (device?.toLowerCase()) {
    case "mobile":
      return <SmartphoneIcon className="h-5 w-5" />;
    case "tablet":
      return <TabletIcon className="h-5 w-5" />;
    case "desktop":
      return <MonitorIcon className="h-5 w-5" />;
    default:
      return <Laptop2Icon className="h-5 w-5" />;
  }
}

const ProfilePage: NextPage = () => {
  const { data: session, update } = useSession();
  const { plan: teamPlan, isAnnualPlan, isFree } = usePlan();
  const { sessions, loading: sessionsLoading, mutate: mutateSessions } = useSessions();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isRevokingSessions, setIsRevokingSessions] = useState(false);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);

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

  const handleRevokeSession = async (sessionId: string, isCurrent: boolean) => {
    setRevokingSessionId(sessionId);
    try {
      const res = await fetch("/api/account/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      if (res.ok) {
        toast.success("Session revoked successfully");
        mutateSessions();
        // If current session was revoked, sign out
        if (isCurrent) {
          setTimeout(() => {
            signOut({ callbackUrl: "/login" });
          }, 1000);
        }
      } else {
        const { error } = await res.json();
        toast.error(error || "Failed to revoke session");
      }
    } catch (error) {
      toast.error("Failed to revoke session. Please try again.");
    } finally {
      setRevokingSessionId(null);
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

          {/* Active Sessions List */}
          <Card className="bg-transparent">
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>
                These are the devices that are currently logged into your
                account. You can revoke access to any session you don&apos;t
                recognize.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sessionsLoading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
                        <div className="space-y-2">
                          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                          <div className="h-3 w-48 animate-pulse rounded bg-muted" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No active sessions found. Your session will appear here after
                  your next page refresh.
                </p>
              ) : (
                <div className="space-y-3">
                  {sessions.map((sess) => (
                    <div
                      key={sess.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                          {getDeviceIcon(sess.device)}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {sess.browser || "Unknown Browser"}
                              {sess.os ? ` on ${sess.os}` : ""}
                            </span>
                            {sess.isCurrent && (
                              <Badge
                                variant="secondary"
                                className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              >
                                Current
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                            {(sess.city || sess.country) && (
                              <span className="flex items-center gap-1">
                                <GlobeIcon className="h-3 w-3" />
                                {[sess.city, sess.country]
                                  .filter(Boolean)
                                  .join(", ")}
                              </span>
                            )}
                            {sess.ipAddress && (
                              <span className="font-mono text-xs">
                                {sess.ipAddress}
                              </span>
                            )}
                            <span>
                              {formatLastActive(sess.lastActiveAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            disabled={revokingSessionId === sess.id}
                          >
                            <Trash2Icon className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Revoke this session?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {sess.isCurrent
                                ? "This is your current session. Revoking it will sign you out immediately."
                                : "This will sign out this device. The user will need to sign in again to access the account."}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                handleRevokeSession(sess.id, sess.isCurrent)
                              }
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Revoke session
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sign Out All Devices Section */}
          <Card className="bg-transparent">
            <CardHeader>
              <CardTitle>Sign Out All Devices</CardTitle>
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

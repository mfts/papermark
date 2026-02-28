import { useRouter } from "next/router";

import { useEffect, useState } from "react";

import { useTeam } from "@/context/team-context";
import { CheckCircleIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

const DEAL_TYPE_OPTIONS = [
  { value: "startup-fundraising", label: "Startup Fundraising" },
  { value: "fund-management", label: "Fundraising & Reporting" },
  { value: "mergers-acquisitions", label: "Mergers & Acquisitions" },
  { value: "financial-operations", label: "Financial Operations" },
  { value: "real-estate", label: "Real Estate" },
  { value: "project-management", label: "Project Management" },
];

const DEAL_SIZE_OPTIONS = [
  { value: "0-500k", label: "$0 - $500K" },
  { value: "500k-5m", label: "$500K - $5M" },
  { value: "5m-10m", label: "$5M - $10M" },
  { value: "10m-100m", label: "$10M - $100M" },
  { value: "100m+", label: "$100M+" },
];

export function DealflowPopup() {
  const router = useRouter();
  const teamInfo = useTeam();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [dealType, setDealType] = useState<string | null>(null);
  const [dealTypeOther, setDealTypeOther] = useState<string>("");
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const teamId = teamInfo?.currentTeam?.id;
  const storageKey = `dealflow-survey-dismissed-${teamId}`;

  // Check if we're on onboarding/welcome pages
  const isOnboarding = router.pathname.startsWith("/welcome");

  useEffect(() => {
    if (isOnboarding) return;
    if (!teamId) return;

    const dismissed = localStorage.getItem(storageKey);
    if (dismissed) return;

    let timeoutId: NodeJS.Timeout;

    const checkSurvey = async () => {
      try {
        const response = await fetch(`/api/teams/${teamId}/survey`);
        if (response.ok) {
          const data = await response.json();

          if (data.dismissed) {
            localStorage.setItem(storageKey, "true");
            return;
          }

          if (!data.dealType) {
            timeoutId = setTimeout(() => {
              setStep(1);
              setIsOpen(true);
            }, 2000);
          } else if (!data.dealSize && data.dealType !== "project-management") {
            timeoutId = setTimeout(() => {
              setDealType(data.dealType);
              setDealTypeOther(data.dealTypeOther || "");
              setStep(2);
              setIsOpen(true);
            }, 2000);
          }
        }
      } catch (error) {
        console.error("Failed to check survey status:", error);
      }
    };

    checkSurvey();

    return () => clearTimeout(timeoutId);
  }, [teamId, storageKey, isOnboarding]);

  const handleDealTypeSelect = (value: string) => {
    setDealType(value);
    setShowOtherInput(false);
    if (value === "project-management") {
      // Project management doesn't need a second step - go straight to thank you
      handleSubmit(value, null, null);
    } else {
      setStep(2);
    }
  };

  const handleOtherSubmit = () => {
    if (!dealTypeOther.trim()) return;
    setDealType("other");
    setShowOtherInput(false);
    // After entering "Other" text, go to deal size question
    setStep(2);
  };

  const handleDealSizeSelect = async (value: string) => {
    await handleSubmit(dealType, value, dealTypeOther || null);
  };

  const handleSubmit = async (
    type?: string | null,
    size?: string | null,
    otherText?: string | null,
  ) => {
    const finalDealType = type || dealType;
    if (!finalDealType) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/teams/${teamInfo?.currentTeam?.id}/survey`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dealType: finalDealType,
            dealTypeOther:
              otherText !== undefined
                ? otherText
                : dealTypeOther || null,
            dealSize: size ?? null,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to save response");
      }

      localStorage.setItem(storageKey, "true");
      setStep(3); // Go to thank you screen
    } catch (error) {
      console.error("Failed to save survey response:", error);
      toast.error("Failed to save your response");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleDismiss = async () => {
    localStorage.setItem(storageKey, "true");
    setIsOpen(false);

    toast("Survey dismissed", {
      description: "You can complete it anytime from Settings → General.",
      action: {
        label: "Go to Settings",
        onClick: () => router.push("/settings/general#team-survey"),
      },
    });

    if (teamId) {
      try {
        await fetch(`/api/teams/${teamId}/survey`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dismissed: true,
            dismissedAt: new Date().toISOString(),
          }),
        });
      } catch (error) {
        console.error("Failed to save survey dismissal:", error);
      }
    }
  };

  const getDealSizeQuestion = () => {
    switch (dealType) {
      case "startup-fundraising":
      case "fund-management":
        return "How much are you raising?";
      case "mergers-acquisitions":
      case "real-estate":
      case "financial-operations":
        return "What's the deal size?";
      default:
        return "What's the typical deal size?";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="rounded-lg border-2 border-black bg-background p-4 shadow-lg">
        {step === 1 ? (
          <>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">What do you use Papermark for?</h3>
               
              </div>
              <button
                onClick={handleDismiss}
                className="rounded-full p-1 hover:bg-muted"
              >
                <XIcon className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <div className="grid gap-2">
              {DEAL_TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleDealTypeSelect(option.value)}
                  disabled={isSubmitting}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-left text-sm transition-all hover:border-primary/50 hover:bg-muted/50"
                >
                  <span className="font-medium">{option.label}</span>
                </button>
              ))}
              {/* Other - inline input */}
              {showOtherInput ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={dealTypeOther}
                    onChange={(e) => setDealTypeOther(e.target.value)}
                    placeholder="Please specify..."
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && dealTypeOther.trim()) {
                        handleOtherSubmit();
                      }
                    }}
                  />
                  <button
                    onClick={handleOtherSubmit}
                    disabled={!dealTypeOther.trim() || isSubmitting}
                    className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                  >
                    →
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowOtherInput(true)}
                  disabled={isSubmitting}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-left text-sm transition-all hover:border-primary/50 hover:bg-muted/50"
                >
                  <span className="font-medium">Other</span>
                </button>
              )}
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              This will help us tailor your Papermark experience
            </p>
          </>
        ) : step === 2 ? (
          <>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  {getDealSizeQuestion()}
                </h3>
              </div>
              <button
                onClick={handleDismiss}
                className="rounded-full p-1 hover:bg-muted"
              >
                <XIcon className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <div className="grid gap-2">
              {DEAL_SIZE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleDealSizeSelect(option.value)}
                  disabled={isSubmitting}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-left text-sm transition-all hover:border-primary/50 hover:bg-muted/50"
                >
                  <span className="font-medium">{option.label}</span>
                </button>
              ))}
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              This will help us tailor your Papermark experience
            </p>
          </>
        ) : (
          <>
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <CheckCircleIcon className="h-6 w-6 text-green-500" />
                <h3 className="text-lg font-semibold">Thanks for sharing!</h3>
              </div>
              <button
                onClick={handleClose}
                className="rounded-full p-1 hover:bg-muted"
              >
                <XIcon className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <p className="mb-4 text-sm text-muted-foreground">
              You can find and update your responses in settings.
            </p>

            <button
              onClick={() => {
                router.push("/settings/general#team-survey");
                handleClose();
              }}
              className="w-full rounded-lg border border-black bg-white px-3 py-2 text-sm font-medium text-black transition-colors hover:bg-gray-50"
            >
              Go to Team Survey
            </button>
          </>
        )}
      </div>
    </div>
  );
}

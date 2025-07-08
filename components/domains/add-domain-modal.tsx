import { useEffect, useState } from "react";

import { useTeam } from "@/context/team-context";
import { PlanEnum } from "@/ee/stripe/constants";
import { BadgeInfoIcon, Loader } from "lucide-react";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce";
import { z } from "zod";

import { useAnalytics } from "@/lib/analytics";
import { usePlan } from "@/lib/swr/use-billing";
import useLimits from "@/lib/swr/use-limits";
import { cn } from "@/lib/utils";
import { isValidDomain } from "@/lib/utils/domain-validation";

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
import { StatusBadge } from "@/components/ui/status-badge";

import { UpgradePlanModal } from "../billing/upgrade-plan-modal";
import { BadgeTooltip } from "../ui/tooltip";

type DomainCheckStatus =
  | "invalid"
  | "conflict"
  | "available"
  | "has site"
  | "error";

interface DomainCheckResponse {
  status: DomainCheckStatus;
  message?: string;
  error?: string;
}

type UIOnlyStatus = "idle" | "checking";
type DomainStatus = DomainCheckStatus | UIOnlyStatus;

const STATUS_VARIANT: Record<
  DomainStatus,
  "neutral" | "success" | "pending" | "error"
> = {
  idle: "neutral",
  checking: "pending",
  available: "success",
  conflict: "error",
  "has site": "error",
  invalid: "error",
  error: "error",
};

const STATUS_LABEL: Record<DomainStatus, string> = {
  idle: "",
  checking: "Checking",
  available: "Available",
  conflict: "In use",
  "has site": "Has site",
  invalid: "Invalid",
  error: "Error",
};

const getValidationMessage = (status: DomainStatus, domain: string) => {
  switch (status) {
    case "checking":
      return `Checking availability for ${domain}...`;
    case "available":
      return `${domain} is ready to connect to Papermark.`;
    case "conflict":
      return `${domain} is already in use.`;
    case "has site":
      return `${domain} is currently pointing to an existing website. Only proceed if you're sure you want to use this domain with Papermark.`;
    case "invalid":
      return "Please enter a valid domain format (e.g., docs.yourdomain.com)";
    case "error":
      return "Failed to validate domain. Please try again.";
    default:
      return "Enter a domain to check its availability.";
  }
};

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
  const [redirect, setRedirect] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [domainStatus, setDomainStatus] = useState<DomainStatus>("idle");
  const [validationMessage, setValidationMessage] = useState<string>("");

  const teamInfo = useTeam();
  const { isFree, isPro, isBusiness } = usePlan();
  const { limits } = useLimits();
  const analytics = useAnalytics();

  useEffect(() => {
    if (!open) {
      resetState();
    }
  }, [open]);

  const resetState = () => {
    setDomain("");
    setRedirect("");
    setDomainStatus("idle");
    setValidationMessage("");
    setLoading(false);
  };

  const validateDomain = useDebouncedCallback(async (value: string) => {
    if (!value.trim()) {
      setDomainStatus("idle");
      setValidationMessage("");
      return;
    }

    const sanitizedDomain = value.trim().toLowerCase();

    if (!isValidDomain(sanitizedDomain)) {
      setDomainStatus("invalid");
      setValidationMessage(getValidationMessage("invalid", sanitizedDomain));
      return;
    }
    setDomainStatus("checking");
    setValidationMessage(getValidationMessage("checking", sanitizedDomain));

    try {
      const response = await fetch(
        `/api/teams/${teamInfo?.currentTeam?.id}/domains/check?domain=${encodeURIComponent(sanitizedDomain)}`,
      );

      if (response.ok) {
        const data: DomainCheckResponse = await response.json();
        setDomainStatus(data.status);
        setValidationMessage(
          getValidationMessage(data.status, sanitizedDomain),
        );
      } else {
        setDomainStatus("error");
        setValidationMessage(getValidationMessage("error", sanitizedDomain));
      }
    } catch (error) {
      setDomainStatus("error");
      setValidationMessage(getValidationMessage("error", sanitizedDomain));
    }
  }, 500);

  useEffect(() => {
    return () => {
      validateDomain.cancel();
    };
  }, [validateDomain]);

  const handleDomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDomain(e.target.value);
    validateDomain(e.target.value);
  };

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
    redirect: z
      .string()
      .optional()
      .refine((data) => !data || z.string().url().safeParse(data).success, {
        message: "Please enter a valid URL (https:// or http://)",
      })
      .refine(
        (data) =>
          !data || data.startsWith("http://") || data.startsWith("https://"),
        {
          message: "URL must start with http:// or https://",
        },
      ),
  });

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    event.stopPropagation();

    const validation = addDomainSchema.safeParse({
      name: domain,
      redirect,
    });
    if (!validation.success) {
      return toast.error(validation.error.errors[0].message);
    }

    if (!["available"].includes(domainStatus)) {
      return toast.error("Please enter a valid and available domain");
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
          redirect: redirect,
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
    toast.success("Domain added successfully!");

    // Update local data with the new link
    onAddition && onAddition(newDomain);
    resetState();
    setOpen(false);

    !onAddition && window.open("/settings/domains", "_blank");
  };

  const badgeVariant = STATUS_VARIANT[domainStatus];
  const badgeLabel = STATUS_LABEL[domainStatus];

  const isSubmitDisabled =
    loading || !["available", "has site"].includes(domainStatus);

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
        <UpgradePlanModal
          clickedPlan={
            linkType === "DATAROOM_LINK"
              ? PlanEnum.DataRooms
              : PlanEnum.Business
          }
          trigger={"add_domain_overview"}
          highlightItem={["custom-domain"]}
        >
          <Button>Upgrade to Add Domain</Button>
        </UpgradePlanModal>
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
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          resetState();
        }
        setOpen(isOpen);
      }}
    >
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
          <div className="mb-2 mt-1">
            <Input
              id="domain"
              placeholder={
                linkType === "DATAROOM_LINK"
                  ? "dataroom.yourdomain.com"
                  : "docs.yourdomain.com"
              }
              className={cn(
                "w-full",
                domainStatus === "invalid" &&
                  "border-destructive focus:border-destructive focus:ring-destructive",
              )}
              value={domain}
              onChange={handleDomainChange}
            />
          </div>
          {domainStatus !== "idle" && (
            <div className="mb-4 flex items-center gap-2">
              <StatusBadge
                variant={badgeVariant}
                icon={domainStatus === "checking" ? Loader : undefined}
                className="shrink-0"
                iconClassName={
                  domainStatus === "checking" ? "animate-spin" : ""
                }
              >
                {badgeLabel}
              </StatusBadge>
              {validationMessage && (
                <p className="text-xs leading-snug text-muted-foreground">
                  {validationMessage}
                </p>
              )}
            </div>
          )}
          <div className="flex items-center gap-1">
            <Label htmlFor="redirect" className="opacity-80">
              Root Redirect URL (optional)
            </Label>
            <BadgeTooltip
              content="The URL to redirect to when a user visits the root of your domain (e.g., docs.yourdomain.com)"
              key="redirect"
            >
              <BadgeInfoIcon className="h-4 w-4 text-blue-500 hover:text-blue-600" />
            </BadgeTooltip>
          </div>
          <Input
            id="redirect"
            placeholder="https://your-link.com"
            className="mb-4 mt-1 w-full"
            value={redirect}
            onChange={(e) => setRedirect(e.target.value)}
          />
          <DialogFooter>
            <Button
              type="submit"
              className="h-9 w-full"
              disabled={isSubmitDisabled}
              loading={loading}
            >
              Add domain
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
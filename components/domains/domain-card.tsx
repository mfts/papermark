import { useRef, useState } from "react";

import { useTeam } from "@/context/team-context";
import {
  ChevronDownIcon,
  CircleCheckIcon,
  ExternalLinkIcon,
  FlagIcon,
  GlobeIcon,
  MoreVertical,
  RefreshCwIcon,
  SettingsIcon,
  TrashIcon,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { mutate } from "swr";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";

import { useDeleteDomainModal } from "./delete-domain-modal";
import DomainConfiguration from "./domain-configuration";
import { useDomainStatus } from "./use-domain-status";

export default function DomainCard({
  domain,
  isDefault,
  redirectUrl: initialRedirectUrl,
  onDelete,
}: {
  domain: string;
  isDefault: boolean;
  redirectUrl?: string | null;
  onDelete: (deletedDomain: string) => void;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [groupHover, setGroupHover] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState(initialRedirectUrl || "");
  const [savingRedirect, setSavingRedirect] = useState(false);

  const domainRef = useRef<HTMLDivElement>(null);

  const {
    status,
    loading,
    domainJson,
    configJson,
    mutate: mutateDomain,
  } = useDomainStatus({
    domain,
  });
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  const isInvalid =
    status && !["Valid Configuration", "Pending Verification"].includes(status);

  const { setShowDeleteDomainModal, DeleteDomainModal } = useDeleteDomainModal({
    domain,
    onDelete,
  });

  const handleSaveRedirectUrl = async () => {
    setSavingRedirect(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/domains/${domain}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ redirectUrl: redirectUrl || null }),
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data?.message || "Failed to save redirect URL");
        return;
      }

      mutate(`/api/teams/${teamId}/domains`);
      toast.success(
        redirectUrl
          ? "Root redirect URL saved"
          : "Root redirect URL removed",
      );
    } catch {
      toast.error("Failed to save redirect URL");
    } finally {
      setSavingRedirect(false);
    }
  };

  const handleMakeDefault = async () => {
    const response = await fetch(`/api/teams/${teamId}/domains/${domain}`, {
      method: "PATCH",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Update domains by refetching
    mutate(`/api/teams/${teamId}/domains`);
  };

  return (
    <>
      <div
        ref={domainRef}
        className="group rounded-xl border border-gray-200 bg-white p-4 transition-[filter] dark:border-gray-400 dark:bg-secondary sm:p-5"
        onPointerEnter={() => setGroupHover(true)}
        onPointerLeave={() => setGroupHover(false)}
      >
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <div className="hidden rounded-full border border-gray-200 dark:border-gray-400 sm:block">
              <div
                className={cn(
                  "rounded-full",
                  "border border-white bg-gradient-to-t from-gray-100 p-1 md:p-3",
                )}
              >
                <GlobeIcon className="size-5" />
              </div>
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center gap-1.5 truncate text-sm font-medium sm:gap-2.5">
                {domain}

                {isDefault ? (
                  <span className="xs:px-3 xs:py-1 flex items-center gap-1 rounded-full bg-sky-400/[.15] px-1.5 py-0.5 text-xs font-medium text-sky-600">
                    <FlagIcon className="hidden h-3 w-3 sm:block" />
                    Default
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 sm:gap-3">
            {/* Status */}
            <div className="hidden sm:block">
              {status && !loading ? (
                <StatusBadge
                  variant={
                    status === "Valid Configuration"
                      ? "success"
                      : status === "Pending Verification"
                        ? "pending"
                        : "error"
                  }
                >
                  {status === "Valid Configuration"
                    ? "Active"
                    : status === "Pending Verification"
                      ? "Pending"
                      : "Invalid"}
                </StatusBadge>
              ) : (
                <div className="h-6 w-16 animate-pulse rounded-md bg-gray-200 dark:bg-gray-400" />
              )}
            </div>
            <Button
              variant="secondary"
              className={cn(
                "h-8 w-auto px-2 opacity-100 transition-opacity lg:h-9",
                !showDetails &&
                  !isInvalid &&
                  "sm:opacity-0 sm:group-hover:opacity-100",
              )}
              onClick={() => setShowDetails((s) => !s)}
              data-state={showDetails ? "open" : "closed"}
            >
              <div className="flex items-center gap-1">
                <div className="relative">
                  <SettingsIcon
                    className={cn(
                      "h-4 w-4",
                      showDetails
                        ? "text-gray-800 dark:text-gray-200"
                        : "text-gray-600 dark:text-gray-400",
                    )}
                  />
                  {/* Error indicator */}
                  {status && isInvalid && (
                    <div className="absolute -right-px -top-px h-[5px] w-[5px] rounded-full bg-destructive">
                      <div className="h-full w-full animate-pulse rounded-full ring-2 ring-destructive/30" />
                    </div>
                  )}
                </div>
                <ChevronDownIcon
                  className={cn(
                    "hidden h-4 w-4 text-gray-400 transition-transform sm:block",
                    showDetails && "rotate-180",
                  )}
                />
              </div>
            </Button>
            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  // size="icon"
                  variant="outline"
                  className="z-20 h-8 w-8 border-gray-200 bg-transparent p-0 hover:bg-gray-200 dark:border-gray-400 hover:dark:border-gray-400 hover:dark:bg-gray-700 lg:h-9 lg:w-9"
                >
                  <span className="sr-only">Open menu</span>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  disabled={isDefault}
                  onClick={handleMakeDefault}
                >
                  <FlagIcon className="mr-2 h-4 w-4" />
                  Make default
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => mutateDomain()}
                  disabled={loading}
                >
                  <RefreshCwIcon className="mr-2 h-4 w-4" />
                  Refresh
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive transition-colors duration-200 focus:bg-destructive focus:text-destructive-foreground"
                  onClick={() => setShowDeleteDomainModal(true)}
                >
                  <TrashIcon className="mr-2 h-4 w-4" />
                  Delete domain
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <motion.div
          initial={false}
          animate={{ height: showDetails ? "auto" : 0 }}
          className="overflow-hidden"
        >
          {status ? (
            status === "Valid Configuration" ? (
              <div className="mt-6 flex items-center gap-2 text-pretty rounded-lg bg-green-100/80 p-3 text-sm text-green-600">
                <CircleCheckIcon className="h-5 w-5 shrink-0" />
                <div>
                  Good news! Your DNS records are set up correctly, but it can
                  take some time for them to propagate globally.
                </div>
              </div>
            ) : (
              <DomainConfiguration
                status={status}
                response={{ domainJson, configJson }}
              />
            )
          ) : (
            <div className="mt-6 h-6 w-32 animate-pulse rounded-md bg-gray-200 dark:bg-gray-400" />
          )}

          {/* Root domain redirect */}
          <div className="mt-4 rounded-lg border border-gray-200 p-4 dark:border-gray-400">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <ExternalLinkIcon className="h-4 w-4" />
              Root Domain Redirect
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Redirect visitors who land on{" "}
              <span className="font-medium">{domain}</span> to a specific URL.
              Leave empty to redirect to papermark.com.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <Input
                type="url"
                placeholder="https://example.com"
                value={redirectUrl}
                onChange={(e) => setRedirectUrl(e.target.value)}
                className="h-9 flex-1"
              />
              <Button
                size="sm"
                onClick={handleSaveRedirectUrl}
                disabled={savingRedirect}
                className="h-9 shrink-0"
              >
                {savingRedirect ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
      <DeleteDomainModal />
    </>
  );
}

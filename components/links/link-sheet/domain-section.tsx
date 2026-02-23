import Link from "next/link";

import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";

import { useTeam } from "@/context/team-context";
import { PlanEnum } from "@/ee/stripe/constants";
import { Domain, LinkType } from "@prisma/client";
import { ShuffleIcon } from "lucide-react";
import { customAlphabet } from "nanoid";
import { mutate } from "swr";

import { BLOCKED_PATHNAMES } from "@/lib/constants";
import { BasePlan, usePlan } from "@/lib/swr/use-billing";
import useLimits from "@/lib/swr/use-limits";
import { cn } from "@/lib/utils";

import { UpgradePlanModal } from "@/components/billing/upgrade-plan-modal";
import { AddDomainModal } from "@/components/domains/add-domain-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ButtonTooltip } from "@/components/ui/tooltip";

import { DEFAULT_LINK_TYPE } from ".";

// Unambiguous alphabet: excludes easily confused characters (0/O, 1/l/I)
const generateRandomSlug = customAlphabet(
  "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz",
  10,
);

export default function DomainSection({
  data,
  setData,
  domains,
  linkType,
  editLink,
}: {
  data: DEFAULT_LINK_TYPE;
  setData: Dispatch<SetStateAction<DEFAULT_LINK_TYPE>>;
  domains?: Domain[];
  linkType: Omit<LinkType, "WORKFLOW_LINK">;
  editLink?: boolean;
}) {
  const [isModalOpen, setModalOpen] = useState(false);
  const [isUpgradeModalOpen, setUpgradeModalOpen] = useState(false);
  // Initialize displayValue from data.domain when editing, otherwise "papermark.com"
  const [displayValue, setDisplayValue] = useState<string>(
    editLink && data.domain ? data.domain : "papermark.com",
  );
  const teamInfo = useTeam();
  const { limits } = useLimits();

  const { isBusiness, isDatarooms, isDataroomsPlus } = usePlan();

  // Check plan eligibility for custom domains
  const canUseCustomDomainForDocument =
    isBusiness || isDatarooms || isDataroomsPlus || limits?.customDomainOnPro;
  const canUseCustomDomainForDataroom =
    isDatarooms || isDataroomsPlus || limits?.customDomainInDataroom;

  // Check if we're editing a link with a custom domain
  const isEditingCustomDomain =
    editLink && data.domain && data.domain !== "papermark.com" ? true : false;

  const generateAndSetSlug = useCallback(() => {
    const newSlug = generateRandomSlug();
    setData((prev) => ({ ...prev, slug: newSlug }));
  }, [setData]);

  const handleDomainChange = (value: string) => {
    const canChangeCustomDomain =
      linkType === "DOCUMENT_LINK"
        ? canUseCustomDomainForDocument
        : canUseCustomDomainForDataroom;

    if (isEditingCustomDomain && !canChangeCustomDomain) {
      setDisplayValue(data.domain ?? "papermark.com");
      return;
    }

    // Handle opening the add domain modal
    if (value === "add_domain" || value === "add_dataroom_domain") {
      setModalOpen(true);
      setData((prev) => ({ ...prev, domain: "papermark.com" }));
      setDisplayValue("papermark.com");
      return;
    }

    // Check if this is a custom domain selection (not papermark.com)
    if (value !== "papermark.com") {
      // Show upgrade modal if user doesn't have the right plan
      if (
        (linkType === "DOCUMENT_LINK" && !canUseCustomDomainForDocument) ||
        (linkType === "DATAROOM_LINK" && !canUseCustomDomainForDataroom)
      ) {
        setUpgradeModalOpen(true);
        setData((prev) => ({ ...prev, domain: "papermark.com" }));
        setDisplayValue("papermark.com");
        return;
      }

      // Auto-generate a slug if there isn't one yet
      setData((prev) => ({
        ...prev,
        domain: value,
        ...(!prev.slug && { slug: generateRandomSlug() }),
      }));
      setDisplayValue(value);
      return;
    }

    // Update domain normally if allowed
    setData((prev) => ({ ...prev, domain: value }));
    setDisplayValue(value);
  };

  const handleSelectFocus = () => {
    // Assuming your fetcher key for domains is '/api/teams/:teamId/domains'
    mutate(`/api/teams/${teamInfo?.currentTeam?.id}/domains`);
  };

  useEffect(() => {
    if (domains && !editLink) {
      const defaultDomain = domains.find((domain) => domain.isDefault);

      // Only set a custom domain if the plan allows it
      const canUseCustomDomain =
        (linkType === "DOCUMENT_LINK" && canUseCustomDomainForDocument) ||
        (linkType === "DATAROOM_LINK" && canUseCustomDomainForDataroom);

      const domainValue = canUseCustomDomain
        ? (defaultDomain?.slug ?? "papermark.com")
        : "papermark.com";

      // Auto-generate a slug when a custom domain is auto-selected as default
      const isCustomDomain =
        domainValue !== "papermark.com" && canUseCustomDomain;

      setData((prev) => ({
        ...prev,
        domain: domainValue,
        ...(isCustomDomain && !prev.slug && { slug: generateRandomSlug() }),
      }));

      setDisplayValue(domainValue);
    }
  }, [
    domains,
    editLink,
    linkType,
    isBusiness,
    isDatarooms,
    isDataroomsPlus,
    limits,
  ]);

  // Set defaultDomain based on plan type and link type
  const defaultDomain = editLink
    ? (data.domain ?? "papermark.com")
    : (linkType === "DOCUMENT_LINK" && canUseCustomDomainForDocument) ||
        (linkType === "DATAROOM_LINK" && canUseCustomDomainForDataroom)
      ? (domains?.find((domain) => domain.isDefault)?.slug ?? "papermark.com")
      : "papermark.com";

  // Set the initial display value when component mounts
  useEffect(() => {
    setDisplayValue(defaultDomain);
  }, [defaultDomain, editLink]);

  const currentDomain = domains?.find((domain) => domain.slug === data.domain);
  const isDomainVerified = currentDomain?.verified;

  const isSlugInvalid =
    !!data.slug &&
    (!/^[a-zA-Z0-9-]+$/.test(data.slug) ||
      BLOCKED_PATHNAMES.includes(`/${data.slug}`));

  const isDisabled =
    linkType === "DOCUMENT_LINK"
      ? isEditingCustomDomain && !canUseCustomDomainForDocument
      : isEditingCustomDomain && !canUseCustomDomainForDataroom;

  return (
    <>
      <Label htmlFor="link-domain">Domain</Label>
      <div className="flex">
        <Select
          value={displayValue}
          onValueChange={handleDomainChange}
          onOpenChange={handleSelectFocus}
          disabled={isDisabled}
        >
          <SelectTrigger
            className={cn(
              "flex h-10 w-full rounded-none rounded-l-md border border-input bg-white text-foreground placeholder-muted-foreground focus:border-muted-foreground focus:outline-none focus:ring-inset focus:ring-muted-foreground dark:border-gray-500 dark:bg-gray-800 focus:dark:bg-transparent sm:text-sm",
              data.domain && data.domain !== "papermark.com"
                ? ""
                : "border-r-1 rounded-r-md",
            )}
          >
            <SelectValue placeholder="Select a domain" />
          </SelectTrigger>
          <SelectContent className="flex w-full rounded-md border border-input bg-white text-foreground placeholder-muted-foreground focus:border-muted-foreground focus:outline-none focus:ring-inset focus:ring-muted-foreground dark:border-gray-500 dark:bg-gray-800 focus:dark:bg-transparent sm:text-sm">
            <SelectItem value="papermark.com" className="hover:bg-muted">
              papermark.com
            </SelectItem>
            {linkType === "DOCUMENT_LINK" && (
              <>
                {domains?.map(({ slug }) => (
                  <SelectItem
                    key={slug}
                    value={slug}
                    className={cn(
                      "hover:bg-muted hover:dark:bg-gray-700",
                      !canUseCustomDomainForDocument && "opacity-50",
                    )}
                  >
                    {slug}
                    {canUseCustomDomainForDocument || isEditingCustomDomain
                      ? ""
                      : " (upgrade to use)"}
                  </SelectItem>
                ))}
              </>
            )}
            {linkType === "DATAROOM_LINK" && (
              <>
                {domains?.map(({ slug }) => (
                  <SelectItem
                    key={slug}
                    value={slug}
                    className={cn(
                      "hover:bg-muted hover:dark:bg-gray-700",
                      !canUseCustomDomainForDataroom && "opacity-50",
                    )}
                  >
                    {slug}
                    {canUseCustomDomainForDataroom || isEditingCustomDomain
                      ? ""
                      : " (upgrade to use)"}
                  </SelectItem>
                ))}
              </>
            )}
            <SelectItem
              className="hover:bg-muted hover:dark:bg-gray-700"
              value={
                linkType === "DOCUMENT_LINK"
                  ? "add_domain"
                  : "add_dataroom_domain"
              }
            >
              Add a custom domain ✨
            </SelectItem>
          </SelectContent>
        </Select>

        {data.domain && data.domain !== "papermark.com" ? (
          <>
            <Input
              type="text"
              name="key"
              required
              value={data.slug || ""}
              disabled={isDisabled}
              pattern="^[a-zA-Z0-9-]+$"
              onKeyDown={(e) => {
                // Allow navigation keys, backspace, delete, etc.
                if (e.key.length === 1 && !/^[a-zA-Z0-9-]$/.test(e.key)) {
                  e.preventDefault();
                }
              }}
              onInvalid={(e) => {
                const currentValue = e.currentTarget.value;
                const isBlocked = BLOCKED_PATHNAMES.includes(
                  `/${currentValue}`,
                );

                if (isBlocked) {
                  e.currentTarget.setCustomValidity(
                    "This pathname is blocked. Please choose another one.",
                  );
                } else {
                  e.currentTarget.setCustomValidity(
                    "Only letters, numbers, and '-' are allowed.",
                  );
                }
              }}
              autoComplete="off"
              className={cn(
                "hidden rounded-none focus:ring-inset",
                data.domain && data.domain !== "papermark.com" ? "flex" : "",
                isDisabled ? "opacity-50" : "",
              )}
              placeholder="deck"
              onChange={(e) => {
                if (isDisabled) return;

                const currentValue = e.target.value.replace(
                  /[^a-zA-Z0-9-]/g,
                  "",
                );
                const isBlocked = BLOCKED_PATHNAMES.includes(
                  `/${currentValue}`,
                );

                if (isBlocked) {
                  e.currentTarget.setCustomValidity(
                    "This pathname is blocked. Please choose another one.",
                  );
                } else {
                  e.currentTarget.setCustomValidity("");
                }
                setData((prev) => ({ ...prev, slug: currentValue }));
              }}
              aria-invalid={isSlugInvalid}
            />
            <ButtonTooltip content="Generate random slug">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 min-w-10 rounded-l-none border-l-0"
                disabled={isDisabled}
                onClick={(e) => {
                  e.preventDefault();
                  generateAndSetSlug();
                }}
              >
                <ShuffleIcon className="h-4 w-4" />
              </Button>
            </ButtonTooltip>
          </>
        ) : null}
      </div>

      {isDisabled && (
        <div
          className="mt-2 text-sm text-muted-foreground"
          onClick={() => {
            setUpgradeModalOpen(true);
          }}
        >
          Custom domain and path cannot be changed on an unsupported plan.
        </div>
      )}

      {data.domain && data.domain !== "papermark.com" && !isDomainVerified ? (
        <div className="mt-4 text-sm text-red-500">
          Your domain is not verified yet!{" "}
          <Link
            className="underline hover:text-red-500/80"
            href="/settings/domains"
            target="_blank"
          >
            Verify now
          </Link>
        </div>
      ) : null}

      {/* Add domain modal for custom domains */}
      <AddDomainModal
        open={isModalOpen}
        setOpen={setModalOpen}
        linkType={linkType}
      />

      {/* Upgrade plan modal when trying to use custom domains without the right plan */}
      <UpgradePlanModal
        clickedPlan={
          linkType === "DATAROOM_LINK" ? PlanEnum.DataRooms : PlanEnum.Business
        }
        open={isUpgradeModalOpen}
        setOpen={setUpgradeModalOpen}
        trigger={
          linkType === "DATAROOM_LINK"
            ? "select_custom_domain_dataroom"
            : "select_custom_domain_document"
        }
        highlightItem={["custom-domain"]}
      />
    </>
  );
}

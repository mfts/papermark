import Link from "next/link";

import { Dispatch, SetStateAction, useEffect, useState } from "react";

import { useTeam } from "@/context/team-context";
import { Domain } from "@prisma/client";
import { mutate } from "swr";

import { AddDomainModal } from "@/components/domains/add-domain-modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { BLOCKED_PATHNAMES } from "@/lib/constants";
import { BasePlan, usePlan } from "@/lib/swr/use-billing";
import useLimits from "@/lib/swr/use-limits";
import { cn } from "@/lib/utils";

import { DEFAULT_LINK_TYPE } from ".";

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
  linkType: "DOCUMENT_LINK" | "DATAROOM_LINK";
  editLink?: boolean;
}) {
  const [isModalOpen, setModalOpen] = useState(false);
  const teamInfo = useTeam();
  const { limits } = useLimits();

  const { isBusiness, isDatarooms, isDataroomsPlus } = usePlan();

  const handleDomainChange = (value: string) => {
    // const value = event.target.value;

    if (value === "add_domain" || value === "add_dataroom_domain") {
      // Redirect to the add domain page
      setModalOpen(true);
      setData({ ...data, domain: "papermark.com" });
      return;
    }

    setData({ ...data, domain: value });
  };

  const handleSelectFocus = () => {
    // Assuming your fetcher key for domains is '/api/teams/:teamId/domains'
    mutate(`/api/teams/${teamInfo?.currentTeam?.id}/domains`);
  };

  useEffect(() => {
    if (domains && !editLink) {
      const defaultDomain = domains.find((domain) => domain.isDefault);
      setData({
        ...data,
        domain: defaultDomain?.slug ?? "papermark.com",
      });
    }
  }, [domains, editLink]);

  const defaultDomain = editLink
    ? (data.domain ?? "papermark.com")
    : (domains?.find((domain) => domain.isDefault)?.slug ?? "papermark.com");

  const currentDomain = domains?.find((domain) => domain.slug === data.domain);
  const isDomainVerified = currentDomain?.verified;

  return (
    <>
      <Label htmlFor="link-domain">Domain</Label>
      <div className="flex">
        <Select
          defaultValue={defaultDomain}
          onValueChange={handleDomainChange}
          onOpenChange={handleSelectFocus}
        >
          <SelectTrigger
            className={cn(
              "flex w-full rounded-none rounded-l-md border border-input bg-white text-foreground placeholder-muted-foreground focus:border-muted-foreground focus:outline-none focus:ring-inset focus:ring-muted-foreground dark:border-gray-500 dark:bg-gray-800 focus:dark:bg-transparent sm:text-sm",
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
            {linkType === "DOCUMENT_LINK" &&
              (isBusiness || (limits && limits.customDomainOnPro)) && (
                <>
                  {domains?.map(({ slug }) => (
                    <SelectItem
                      key={slug}
                      value={slug}
                      className="hover:bg-muted hover:dark:bg-gray-700"
                    >
                      {slug}
                    </SelectItem>
                  ))}
                </>
              )}
            {linkType === "DATAROOM_LINK" &&
              (isDatarooms ||
                isDataroomsPlus ||
                (limits && limits.customDomainInDataroom)) && (
                <>
                  {domains?.map(({ slug }) => (
                    <SelectItem
                      key={slug}
                      value={slug}
                      className="hover:bg-muted hover:dark:bg-gray-700"
                    >
                      {slug}
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
          <Input
            type="text"
            name="key"
            required
            value={data.slug || ""}
            pattern="^[a-zA-Z0-9-]+$"
            onKeyDown={(e) => {
              // Allow navigation keys, backspace, delete, etc.
              if (e.key.length === 1 && !/^[a-zA-Z0-9-]$/.test(e.key)) {
                e.preventDefault();
              }
            }}
            onInvalid={(e) => {
              const currentValue = e.currentTarget.value;
              const isBlocked = BLOCKED_PATHNAMES.includes(`/${currentValue}`);

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
              "hidden rounded-l-none focus:ring-inset",
              data.domain && data.domain !== "papermark.com" ? "flex" : "",
            )}
            placeholder="deck"
            onChange={(e) => {
              const currentValue = e.target.value.replace(/[^a-zA-Z0-9-]/g, "");
              const isBlocked = BLOCKED_PATHNAMES.includes(`/${currentValue}`);

              if (isBlocked) {
                e.currentTarget.setCustomValidity(
                  "This pathname is blocked. Please choose another one.",
                );
              } else {
                e.currentTarget.setCustomValidity("");
              }
              setData({ ...data, slug: currentValue });
            }}
            aria-invalid="true"
          />
        ) : null}
      </div>

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

      <AddDomainModal
        open={isModalOpen}
        setOpen={setModalOpen}
        linkType={linkType}
      />
    </>
  );
}

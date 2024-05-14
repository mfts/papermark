import Link from "next/link";

import { Dispatch, SetStateAction, useState } from "react";

import { useTeam } from "@/context/team-context";
import { Domain } from "@prisma/client";
import { mutate } from "swr";

import { AddDomainModal } from "@/components/domains/add-domain-modal";
import { Label } from "@/components/ui/label";

import { BLOCKED_PATHNAMES } from "@/lib/constants";
import { BasePlan } from "@/lib/swr/use-billing";
import useLimits from "@/lib/swr/use-limits";
import { cn } from "@/lib/utils";

import { DEFAULT_LINK_TYPE } from ".";

export default function DomainSection({
  data,
  setData,
  domains,
  plan,
  linkType,
}: {
  data: DEFAULT_LINK_TYPE;
  setData: Dispatch<SetStateAction<DEFAULT_LINK_TYPE>>;
  domains?: Domain[];
  plan?: BasePlan | null;
  linkType: "DOCUMENT_LINK" | "DATAROOM_LINK";
}) {
  const [isModalOpen, setModalOpen] = useState(false);
  const teamInfo = useTeam();
  const { limits } = useLimits();

  const handleDomainChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;

    if (value === "add_domain" || value === "add_dataroom_domain") {
      // Redirect to the add domain page
      setModalOpen(true);
      return;
    }

    setData({ ...data, domain: value });
  };

  const handleSelectFocus = () => {
    // Assuming your fetcher key for domains is '/api/teams/:teamId/domains'
    mutate(`/api/teams/${teamInfo?.currentTeam?.id}/domains`);
  };

  const currentDomain = domains?.find((domain) => domain.slug === data.domain);
  const isDomainVerified = currentDomain?.verified;

  return (
    <>
      <Label htmlFor="link-domain">Domain</Label>
      <div className="flex">
        <select
          value={data.domain || "papermark.io"}
          onChange={handleDomainChange}
          onFocus={handleSelectFocus}
          className={cn(
            "w-full rounded-l-md border border-r-0 border-border bg-secondary px-5 text-sm text-secondary-foreground focus:border-border focus:outline-none focus:ring-0",
            data.domain && data.domain !== "papermark.io"
              ? ""
              : "border-r-1 rounded-r-md",
          )}
        >
          <option key="papermark.io" value="papermark.io">
            papermark.io
          </option>
          {linkType === "DOCUMENT_LINK" &&
            (plan === "business" || (limits && limits.customDomainOnPro)) && (
              <>
                {domains?.map(({ slug }) => (
                  <option key={slug} value={slug}>
                    {slug}
                  </option>
                ))}
              </>
            )}
          {linkType === "DATAROOM_LINK" &&
            (plan === "datarooms" ||
              (limits && limits.customDomainInDataroom)) && (
              <>
                {domains?.map(({ slug }) => (
                  <option key={slug} value={slug}>
                    {slug}
                  </option>
                ))}
              </>
            )}
          <option
            value={
              linkType === "DOCUMENT_LINK"
                ? "add_domain"
                : "add_dataroom_domain"
            }
          >
            Add a custom domain ✨
          </option>
        </select>

        {data.domain && data.domain !== "papermark.io" ? (
          <input
            type="text"
            name="key"
            required
            value={data.slug || ""}
            pattern="[\p{L}\p{N}\p{Pd}]+"
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
              "hidden w-full rounded-r-md border-0 bg-background py-1.5 text-foreground shadow-sm ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-gray-400 sm:text-sm sm:leading-6",
              data.domain && data.domain !== "papermark.io" ? "flex" : "",
            )}
            placeholder="deck"
            onChange={(e) => {
              const currentValue = e.target.value;
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

      {data.domain && data.domain !== "papermark.io" && !isDomainVerified ? (
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

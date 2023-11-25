import { Dispatch, SetStateAction, useState } from "react";
import { cn } from "@/lib/utils";
import { DEFAULT_LINK_TYPE } from ".";
import { Label } from "@/components/ui/label";
import { Domain } from "@prisma/client";
import { AddDomainModal } from "@/components/domains/add-domain-modal";
import { mutate } from "swr";
import Link from "next/link";
import { useTeam } from "@/context/team-context";

export default function DomainSection({
  data,
  setData,
  domains,
}: {
  data: DEFAULT_LINK_TYPE;
  setData: Dispatch<SetStateAction<DEFAULT_LINK_TYPE>>;
  domains?: Domain[];
}) {
  const [isModalOpen, setModalOpen] = useState(false);
  const teamInfo = useTeam();

  const handleDomainChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;

    if (value === "add_domain") {
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
            "w-48 rounded-l-md border border-r-0 border-border bg-secondary px-5 text-sm text-secondary-foreground focus:border-border focus:outline-none focus:ring-0",
            data.domain && data.domain !== "papermark.io"
              ? ""
              : "rounded-r-md border-r-1",
          )}
        >
          <option key="papermark.io" value="papermark.io">
            papermark.io
          </option>
          {domains
            // ?.filter((domain) => domain.verified)
            ?.map(({ slug }) => (
              <option key={slug} value={slug}>
                {slug}
              </option>
            ))}
          <option value="add_domain">Add a custom domain ✨</option>
        </select>

        {data.domain && data.domain !== "papermark.io" ? (
          <input
            type="text"
            name="key"
            required
            value={data.slug || ""}
            pattern="[\p{L}\p{N}\p{Pd}\/]+"
            onInvalid={(e) => {
              e.currentTarget.setCustomValidity(
                "Only letters, numbers, '-', and '/' are allowed.",
              );
            }}
            autoComplete="off"
            className={cn(
              "hidden w-full rounded-r-md border-0 py-1.5 text-foreground bg-background shadow-sm ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-gray-400 sm:text-sm sm:leading-6",
              data.domain && data.domain !== "papermark.io" ? "flex" : "",
            )}
            placeholder="deck"
            onChange={(e) => {
              e.currentTarget.setCustomValidity("");
              setData({ ...data, slug: e.target.value });
            }}
            aria-invalid="true"
          />
        ) : null}
      </div>

      {data.domain && data.domain !== "papermark.io" && !isDomainVerified ? (
        <div className="text-sm text-red-500 mt-4">
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

      <AddDomainModal open={isModalOpen} setOpen={setModalOpen} />
    </>
  );
}

import { Dispatch, SetStateAction, useState } from "react";
import { cn } from "@/lib/utils";
import { DEFAULT_LINK_TYPE } from ".";
import { Label } from "@/components/ui/label";
import { Domain } from "@prisma/client";
import { AddDomainModal } from "@/components/domains/add-domain-modal";
import { mutate } from "swr";
import Link from "next/link";
import { useTeam } from "@/context/team-context";
import {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

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

  const handleDomainChange = (value: string) => {
    if (value === "add_domain") {
      // Redirect to the add domain page
      setModalOpen(true);
      return;
    }

    setData({ ...data, domain: value });
  };

  const handleSelectFocus = (open: boolean) => {
    if (open) {
      // Assuming your fetcher key for domains is '/api/teams/:teamId/domains'
      mutate(`/api/teams/${teamInfo?.currentTeam?.id}/domains`);
    }
  };

  const currentDomain = domains?.find((domain) => domain.slug === data.domain);
  const isDomainVerified = currentDomain?.verified;

  return (
    <>
      <Label htmlFor="link-domain">Domain</Label>
      <div className="px-1">
        <Select
          value={data.domain || "papermark.io"}
          onValueChange={handleDomainChange}
          onOpenChange={handleSelectFocus}
        >
          <SelectTrigger>
            <SelectValue placeholder="papermark.io" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem key="papermark.io" value="papermark.io">
                papermark.io
              </SelectItem>
              {domains?.map(({ slug }) => (
                <SelectItem key={slug} value={slug}>
                  {slug}
                </SelectItem>
              ))}
              <SelectItem value="add_domain">Add a custom domain ✨</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        {data.domain && data.domain !== "papermark.io" ? (
          <Input
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
              "hidden w-full mt-5 placeholder:text-muted-foreground",
              data.domain && data.domain !== "papermark.io" ? "flex" : "",
            )}
            placeholder="Deck"
            onChange={(e) => {
              e.currentTarget.setCustomValidity("");
              setData({ ...data, slug: e.target.value });
            }}
            aria-invalid="true"
          />
        ) : null}

        {data.domain && data.domain !== "papermark.io" && !isDomainVerified ? (
          <div className="text-sm text-red-500 mt-3">
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
      </div>

      <AddDomainModal open={isModalOpen} setOpen={setModalOpen} />
    </>
  );
}

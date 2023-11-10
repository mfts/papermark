import { Dispatch, SetStateAction, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { DEFAULT_EMAIL_TYPE } from "./invite-recipient-sheet";
import { Label } from "@/components/ui/label";
import { Domain } from "@prisma/client";
import { AddDomainModal } from "@/components/domains/add-domain-modal";
import { Button } from "@/components/ui/button";
import { mutate } from "swr";
import Link from "next/link";

export default function SenderEmailSection({
  email,
  setEmail,
  domains,
}: {
  email: DEFAULT_EMAIL_TYPE;
  setEmail: Dispatch<SetStateAction<DEFAULT_EMAIL_TYPE>>;
  domains?: Domain[];
}) {
  const [isModalOpen, setModalOpen] = useState(false);

  const handleDomainChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;

    if (value === "add_domain") {
      // Redirect to the add domain page
      setModalOpen(true);
      return;
    }

    setEmail({ ...email, domain: value });
  };

  const handleSelectFocus = () => {
    // Assuming your fetcher key for domains is '/api/domains'
    mutate("/api/domains");
  };

  const currentDomain = domains?.find(domain => domain.slug === email.domain);
  const isEmailDNSVerified = currentDomain?.emailDNSVerified;

  return (
    <>
      <Label htmlFor="link-domain">Sender's Email</Label>
      <div className="flex">
        {email.domain && email.domain !== "papermark.io" ? (
          <input
            type="text"
            name="key"
            required
            value={email.username || ""}
            pattern="^[a-zA-Z0-9_]+$"
            onInvalid={(e) => {
              e.currentTarget.setCustomValidity(
                "Only letters, numbers, and underscores are allowed for the username."
              );
            }}
            autoComplete="off"
            className={cn(
              "hidden w-60 rounded-l-md border-0 py-1.5 text-foreground bg-background shadow-sm ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-gray-400 sm:text-sm sm:leading-6",
              email.domain && email.domain !== "papermark.io" ? "flex" : ""
            )}
            placeholder="username"
            onChange={(e) => {
              e.currentTarget.setCustomValidity("");
              setEmail({ ...email, username: e.target.value });
            }}
            aria-invalid="true"
          />
        ) : (
          <input
            type="text"
            name="key"
            disabled={true}
            value={"marc"}
            className={cn(
              "hidden w-60 rounded-l-md border-0 py-1.5 text-foreground bg-background bg-gray-300 bg-opacity-20 shadow-sm ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-gray-400 sm:text-sm sm:leading-6",
              "flex"
            )}
            placeholder="username"
            aria-invalid="true"
            style={{ cursor: 'not-allowed' }}
          />)}
        <select
          value={email.domain || ""}
          onChange={handleDomainChange}
          onFocus={handleSelectFocus}
          className={cn(
            "w-48 rounded-r-md border border-r-0 border-border bg-secondary px-5 text-sm text-secondary-foreground focus:border-border focus:outline-none focus:ring-0",
            email && email.domain !== "papermark.io"
              ? ""
              : "rounded-r-md border-r-1"
          )}
        >
          <option key="papermark.io" value="papermark.io">
            @papermark.io
          </option>
          {domains
            // ?.filter((domain) => domain.verified)
            ?.map(({ slug }) => (
              <option key={slug} value={slug}>
                @{slug}
              </option>
            ))}
          <option value="add_domain">Add a custom domain ✨</option>
        </select>
      </div>
      {email && email.domain !== "papermark.io" && !isEmailDNSVerified ? (
        <div className="text-sm text-red-500 mt-4">
          Your domain email DNS is not verified yet! <Link className="underline hover:text-red-500/80" href="/settings/domains" target="_blank">Verify now</Link> to use custom email address
        </div>
      ) : null}

      <AddDomainModal
        open={isModalOpen}
        setOpen={setModalOpen}
      />
    </>
  );
}

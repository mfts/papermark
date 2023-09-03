import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import PasswordSection from "./password-section"
import ExpirationSection from "./expiration-section";
import EmailProtectionSection from "./email-protection-section";
import { useRouter } from "next/router";
import { useDocumentLinks } from "@/lib/swr/use-document";
import { useDomains } from "@/lib/swr/use-domains";
import { mutate } from "swr";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { set } from "date-fns";
import { UpgradePlanModal } from "@/components/billing/upgrade-plan-modal";

export const DEFAULT_LINK_PROPS = {
  id: null,
  name: null,
  domain: null,
  slug: null,
  expiresAt: null,
  password: null,
  emailProtected: true,
};

export type DEFAULT_LINK_TYPE = {
  id: string | null;
  name: string | null;
  domain: string | null;
  slug: string | null;
  expiresAt: Date | null;
  password: string | null;
  emailProtected: boolean;
};


export default function LinkSheet({ isOpen, setIsOpen, currentLink }: { isOpen: boolean, setIsOpen: Dispatch<SetStateAction<boolean>>, currentLink?: DEFAULT_LINK_TYPE }) {
  const { links } = useDocumentLinks();
  const { domains } = useDomains();
  const [data, setData] = useState<DEFAULT_LINK_TYPE>(DEFAULT_LINK_PROPS);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const router = useRouter();
  const documentId = router.query.id as string;

  useEffect(() => {
    setData(currentLink || DEFAULT_LINK_PROPS);
  }, [currentLink]);

  const handleSubmit = async (event: any) => {
    event.preventDefault();

    setIsLoading(true);

    let endpoint = "/api/links";
    let method = "POST";

    if (currentLink) {
      // Assuming that your endpoint to update links appends the link's ID to the URL
      endpoint = `/api/links/${currentLink.id}`;
      method = "PUT";
    }

    const response = await fetch(endpoint, {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...data,
        documentId: documentId,
      }),
    });

    if (!response.ok) {
      // handle error with toast message
      const { error } = await response.json();
      toast.error(error)
      setIsLoading(false);
      return;
    }

    const returnedLink = await response.json();

    if (currentLink) {
      setIsOpen(false);
      // Update the link in the list of links
      mutate(
        `/api/documents/${encodeURIComponent(documentId)}/links`,
        (links || []).map(link => link.id === currentLink.id ? returnedLink : link),
        false
      );
      toast.success("Link updated successfully");
    } else {
      setIsOpen(false);
      // Add the new link to the list of links
      mutate(
        `/api/documents/${encodeURIComponent(documentId)}/links`,
        [...(links || []), returnedLink],
        false
      );
      toast.success("Link created successfully");
    }

    

    setData(DEFAULT_LINK_PROPS);
    setIsLoading(false);
  }

  // console.log("current Data", data)
  

  return (
    <Sheet open={isOpen} onOpenChange={(open: boolean) => setIsOpen(open)}>
      <SheetContent className="bg-background text-foreground flex flex-col justify-between">
        <SheetHeader>
          <SheetTitle>Create a new link</SheetTitle>
          <SheetDescription>
            Customize a document link for sharing. Click save when you&apos;re
            done.
          </SheetDescription>
        </SheetHeader>
        <form className="flex flex-col grow" onSubmit={handleSubmit}>
          <div className="h-0 flex-1">
            <div className="flex flex-1 flex-col justify-between">
              <div className="divide-y divide-gray-200">
                <div className="space-y-6 pb-5 pt-6">
                  <div className="space-y-2">
                    <Label htmlFor="link-name">Link Name</Label>
                    <div className="mt-2">
                      <input
                        type="text"
                        name="link-name"
                        id="link-name"
                        placeholder="Recipient's Organization"
                        value={data.name || ""}
                        className="flex w-full rounded-md border-0 py-1.5 text-foreground bg-background shadow-sm ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-gray-400 sm:text-sm sm:leading-6"
                        onChange={(e) =>
                          setData({ ...data, name: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="link-domain">Domain</Label>
                    <div className="flex">
                      <select
                        value={data.domain || "papermark.io"}
                        onChange={(e) => {
                          setData({ ...data, domain: e.target.value });
                        }}
                        className={cn(
                          "w-48 rounded-l-md border border-r-0 border-border bg-secondary px-5 text-sm text-secondary-foreground focus:border-border focus:outline-none focus:ring-0",
                          data.domain && data.domain !== "papermark.io"
                            ? ""
                            : "rounded-r-md border-r-1"
                        )}
                      >
                        <option key="papermark.io" value="papermark.io">
                          papermark.io
                        </option>
                        {domains
                          ?.filter((domain) => domain.verified)
                          .map(({ slug }) => (
                            <option key={slug} value={slug}>
                              {slug}
                            </option>
                          ))}
                      </select>

                      {!data.domain || data.domain === "papermark.io" ? (
                        <UpgradePlanModal>
                          <Button type="button" variant="ghost" className="h-8">
                            ✨ Get a custom domain ✨
                          </Button>
                        </UpgradePlanModal>
                      ) : null}

                      {data.domain && data.domain !== "papermark.io" ? (
                        <input
                          type="text"
                          name="key"
                          required
                          value={data.slug || ""}
                          pattern="[\p{L}\p{N}\p{Pd}\/]+"
                          onInvalid={(e) => {
                            e.currentTarget.setCustomValidity(
                              "Only letters, numbers, '-', and '/' are allowed."
                            );
                          }}
                          autoComplete="off"
                          className={cn(
                            "hidden w-full rounded-r-md border-0 py-1.5 text-foreground bg-background shadow-sm ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-gray-400 sm:text-sm sm:leading-6",
                            data.domain && data.domain !== "papermark.io"
                              ? "flex"
                              : ""
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
                  </div>

                  <div className="flex items-center relative">
                    <Separator className="bg-muted-foreground absolute" />
                    <div className="relative mx-auto">
                      <span className="px-2 bg-background text-muted-foreground text-sm">
                        Optional
                      </span>
                    </div>
                  </div>

                  <div>
                    <PasswordSection {...{ data, setData }} />
                    <ExpirationSection {...{ data, setData }} />
                    <EmailProtectionSection {...{ data, setData }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <SheetFooter>
            <div className="flex items-center">
              <Button type="submit" disabled={isLoading}>
                {currentLink ? "Update Link" : "Save Link"}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

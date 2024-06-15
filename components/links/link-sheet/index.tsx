import { useRouter } from "next/router";

import { Dispatch, SetStateAction, useEffect, useState } from "react";

import { useTeam } from "@/context/team-context";
import { toast } from "sonner";
import { mutate } from "swr";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { useAnalytics } from "@/lib/analytics";
import { usePlan } from "@/lib/swr/use-billing";
import { useDocumentLinks } from "@/lib/swr/use-document";
import { useDomains } from "@/lib/swr/use-domains";
import { LinkWithViews } from "@/lib/types";
import { convertDataUrlToFile, uploadImage } from "@/lib/utils";

import DomainSection from "./domain-section";
import { LinkOptions } from "./link-options";

export const DEFAULT_LINK_PROPS = {
  id: null,
  name: null,
  domain: null,
  slug: null,
  expiresAt: null,
  password: null,
  emailProtected: true,
  emailAuthenticated: false,
  allowDownload: false,
  allowList: [],
  denyList: [],
  enableNotification: true,
  enableFeedback: true,
  enableScreenshotProtection: false,
  enableCustomMetatag: false,
  metaTitle: null,
  metaDescription: null,
  metaImage: null,
  enabledQuestion: false,
  questionText: null,
  questionType: null,
  enableAgreement: false,
  agreementId: null,
};

export type DEFAULT_LINK_TYPE = {
  id: string | null;
  name: string | null;
  domain: string | null;
  slug: string | null;
  expiresAt: Date | null;
  password: string | null;
  emailProtected: boolean;
  emailAuthenticated: boolean;
  allowDownload: boolean;
  allowList: string[];
  denyList: string[];
  enableNotification: boolean;
  enableFeedback: boolean;
  enableScreenshotProtection: boolean;
  enableCustomMetatag: boolean; // metatags
  metaTitle: string | null; // metatags
  metaDescription: string | null; // metatags
  metaImage: string | null; // metatags
  enableQuestion?: boolean; // feedback question
  questionText: string | null;
  questionType: string | null;
  enableAgreement: boolean; // agreement
  agreementId: string | null;
};

export default function LinkSheet({
  isOpen,
  setIsOpen,
  linkType,
  currentLink,
  existingLinks,
}: {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  linkType: "DOCUMENT_LINK" | "DATAROOM_LINK";
  currentLink?: DEFAULT_LINK_TYPE;
  existingLinks?: LinkWithViews[];
}) {
  const { domains } = useDomains();
  const teamInfo = useTeam();
  const { plan } = usePlan();
  const analytics = useAnalytics();
  const [data, setData] = useState<DEFAULT_LINK_TYPE>(DEFAULT_LINK_PROPS);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const router = useRouter();
  const targetId = router.query.id as string;

  useEffect(() => {
    setData(currentLink || DEFAULT_LINK_PROPS);
  }, [currentLink]);

  const handleSubmit = async (event: any) => {
    event.preventDefault();

    setIsLoading(true);

    // Upload the image if it's a data URL
    let blobUrl: string | null =
      data.metaImage && data.metaImage.startsWith("data:")
        ? null
        : data.metaImage;
    if (data.metaImage && data.metaImage.startsWith("data:")) {
      // Convert the data URL to a blob
      const blob = convertDataUrlToFile({ dataUrl: data.metaImage });
      // Upload the blob to vercel storage
      blobUrl = await uploadImage(blob);
      setData({ ...data, metaImage: blobUrl });
    }

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
        metaImage: blobUrl,
        targetId: targetId,
        linkType: linkType,
        teamId: teamInfo?.currentTeam?.id,
      }),
    });

    if (!response.ok) {
      // handle error with toast message
      const { error } = await response.json();
      toast.error(error);
      setIsLoading(false);
      return;
    }

    const returnedLink = await response.json();
    const endpointTargetType = `${linkType.replace("_LINK", "").toLowerCase()}s`; // "documents" or "datarooms"

    if (currentLink) {
      setIsOpen(false);
      // Update the link in the list of links
      mutate(
        `/api/teams/${teamInfo?.currentTeam?.id}/${endpointTargetType}/${encodeURIComponent(
          targetId,
        )}/links`,
        (existingLinks || []).map((link) =>
          link.id === currentLink.id ? returnedLink : link,
        ),
        false,
      );
      toast.success("Link updated successfully");
    } else {
      setIsOpen(false);
      // Add the new link to the list of links
      mutate(
        `/api/teams/${teamInfo?.currentTeam?.id}/${endpointTargetType}/${encodeURIComponent(
          targetId,
        )}/links`,
        [...(existingLinks || []), returnedLink],
        false,
      );

      analytics.capture("Link Added", {
        linkId: returnedLink.id,
        targetId,
        linkType,
        customDomain: returnedLink.domainSlug,
      });

      toast.success("Link created successfully");
    }

    setData(DEFAULT_LINK_PROPS);
    setIsLoading(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open: boolean) => setIsOpen(open)}>
      <SheetContent className="flex w-[90%] flex-col justify-between bg-background px-4 text-foreground sm:w-[600px] sm:max-w-2xl md:px-5">
        <SheetHeader className="text-start">
          <SheetTitle>
            {currentLink ? "Edit link" : "Create a new link"}
          </SheetTitle>
          <SheetDescription>
            Customize a document link for sharing. Click save when you&apos;re
            done.
          </SheetDescription>
        </SheetHeader>

        <form className="flex grow flex-col" onSubmit={handleSubmit}>
          <ScrollArea className="flex-grow">
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
                          className="flex w-full rounded-md border-0 bg-background py-1.5 text-foreground shadow-sm ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-gray-400 sm:text-sm sm:leading-6"
                          onChange={(e) =>
                            setData({ ...data, name: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <DomainSection
                        {...{ data, setData, domains }}
                        plan={plan}
                        linkType={linkType}
                      />
                    </div>

                    <div className="relative flex items-center">
                      <Separator className="absolute bg-muted-foreground" />
                      <div className="relative mx-auto">
                        <span className="bg-background px-2 text-sm text-muted-foreground">
                          Link Options
                        </span>
                      </div>
                    </div>

                    <LinkOptions data={data} setData={setData} />
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          <SheetFooter>
            <div className="flex items-center">
              <Button type="submit" loading={isLoading}>
                {currentLink ? "Update Link" : "Save Link"}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

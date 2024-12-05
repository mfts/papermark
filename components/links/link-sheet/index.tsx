import { useRouter } from "next/router";

import { Dispatch, SetStateAction, useEffect, useState } from "react";

import { useTeam } from "@/context/team-context";
import { LinkAudienceType, LinkType } from "@prisma/client";
import { RefreshCwIcon } from "lucide-react";
import { toast } from "sonner";
import { mutate } from "swr";

import { UpgradePlanModal } from "@/components/billing/upgrade-plan-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ButtonTooltip } from "@/components/ui/tooltip";

import { useAnalytics } from "@/lib/analytics";
import { usePlan } from "@/lib/swr/use-billing";
import useDataroomGroups from "@/lib/swr/use-dataroom-groups";
import { useDomains } from "@/lib/swr/use-domains";
import { LinkWithViews, WatermarkConfig } from "@/lib/types";
import { convertDataUrlToFile, uploadImage } from "@/lib/utils";

import DomainSection from "./domain-section";
import { LinkOptions } from "./link-options";

export const DEFAULT_LINK_PROPS = (linkType: LinkType) => ({
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
  enableFeedback: false,
  enableScreenshotProtection: false,
  enableCustomMetatag: false,
  metaTitle: null,
  metaDescription: null,
  metaImage: null,
  metaFavicon: null,
  enabledQuestion: false,
  questionText: null,
  questionType: null,
  enableAgreement: false,
  agreementId: null,
  showBanner: linkType === LinkType.DOCUMENT_LINK ? true : false,
  enableWatermark: false,
  watermarkConfig: null,
  audienceType: LinkAudienceType.GENERAL,
  groupId: null,
  screenShieldPercentage: null,
});

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
  metaFavicon: string | null; // metaFavicon
  enableQuestion?: boolean; // feedback question
  questionText: string | null;
  questionType: string | null;
  enableAgreement: boolean; // agreement
  agreementId: string | null;
  showBanner: boolean;
  enableWatermark: boolean;
  watermarkConfig: WatermarkConfig | null;
  audienceType: LinkAudienceType;
  groupId: string | null;
  screenShieldPercentage: number | null;
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
  linkType: LinkType;
  currentLink?: DEFAULT_LINK_TYPE;
  existingLinks?: LinkWithViews[];
}) {
  const { domains } = useDomains();
  const {
    viewerGroups,
    loading: isLoadingGroups,
    mutate: mutateGroups,
  } = useDataroomGroups();
  const teamInfo = useTeam();
  const { plan, trial } = usePlan();
  const analytics = useAnalytics();
  const [data, setData] = useState<DEFAULT_LINK_TYPE>(
    DEFAULT_LINK_PROPS(linkType),
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const router = useRouter();
  const targetId = router.query.id as string;

  useEffect(() => {
    setData(currentLink || DEFAULT_LINK_PROPS(linkType));
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

    // Upload meta favicon if it's a data URL
    let blobUrlFavicon: string | null =
      data.metaFavicon && data.metaFavicon.startsWith("data:")
        ? null
        : data.metaFavicon;
    if (data.metaFavicon && data.metaFavicon.startsWith("data:")) {
      const blobFavicon = convertDataUrlToFile({ dataUrl: data.metaFavicon });
      blobUrlFavicon = await uploadImage(blobFavicon);
      setData({
        ...data,
        metaFavicon: blobUrlFavicon,
      });
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
        metaFavicon: blobUrlFavicon,
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
        [returnedLink, ...(existingLinks || [])],
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

    setData(DEFAULT_LINK_PROPS(linkType));
    setIsLoading(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open: boolean) => setIsOpen(open)}>
      <SheetContent className="flex w-[90%] flex-col justify-between border-l border-gray-200 bg-background px-4 text-foreground dark:border-gray-800 dark:bg-gray-900 sm:w-[600px] sm:max-w-2xl md:px-5">
        <SheetHeader className="text-start">
          <SheetTitle>
            {currentLink
              ? `Edit ${currentLink.audienceType === LinkAudienceType.GROUP ? "group" : ""} link`
              : "Create a new link"}
          </SheetTitle>
        </SheetHeader>

        <form className="flex grow flex-col" onSubmit={handleSubmit}>
          <ScrollArea className="flex-grow">
            <div className="h-0 flex-1">
              <div className="flex flex-1 flex-col justify-between">
                <div className="divide-y divide-gray-200">
                  <Tabs
                    value={data.audienceType}
                    onValueChange={(value) =>
                      setData({
                        ...data,
                        audienceType: value as LinkAudienceType,
                      })
                    }
                  >
                    {linkType === LinkType.DATAROOM_LINK && !!!currentLink ? (
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value={LinkAudienceType.GENERAL}>
                          General
                        </TabsTrigger>
                        {plan === "datarooms" || trial ? (
                          <TabsTrigger value={LinkAudienceType.GROUP}>
                            Group
                          </TabsTrigger>
                        ) : (
                          <UpgradePlanModal
                            clickedPlan="Data Rooms"
                            trigger="add_group_link"
                          >
                            <div className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all">
                              Group
                            </div>
                          </UpgradePlanModal>
                        )}
                      </TabsList>
                    ) : null}

                    <TabsContent value={LinkAudienceType.GENERAL}>
                      {/* GENERAL LINK */}
                      <div className="space-y-6 pb-[35%] pt-2">
                        <div className="space-y-2">
                          <Label htmlFor="link-name">Link Name</Label>

                          <Input
                            type="text"
                            name="link-name"
                            id="link-name"
                            placeholder="Recipient's Organization"
                            value={data.name || ""}
                            className="focus:ring-inset"
                            onChange={(e) =>
                              setData({ ...data, name: e.target.value })
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <DomainSection
                            {...{ data, setData, domains }}
                            plan={plan}
                            linkType={linkType}
                            editLink={!!currentLink}
                          />
                        </div>

                        <div className="relative flex items-center">
                          <Separator className="absolute bg-muted-foreground" />
                          <div className="relative mx-auto">
                            <span className="bg-background px-2 text-sm text-muted-foreground dark:bg-gray-900">
                              Link Options
                            </span>
                          </div>
                        </div>

                        <LinkOptions
                          data={data}
                          setData={setData}
                          linkType={linkType}
                          editLink={!!currentLink}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value={LinkAudienceType.GROUP}>
                      {/* GROUP LINK */}
                      <div className="space-y-6 pb-[35%] pt-2">
                        <div className="space-y-2">
                          <div className="flex w-full items-center justify-between">
                            <Label htmlFor="group-id">Group </Label>
                            <ButtonTooltip content="Refresh groups">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  await mutateGroups();
                                }}
                              >
                                <RefreshCwIcon className="h-4 w-4" />
                              </Button>
                            </ButtonTooltip>
                          </div>
                          <Select
                            onValueChange={(value) => {
                              if (value === "add_group") {
                                // Open the group sheet
                                console.log("add_group redirect");
                                return;
                              }

                              setData({ ...data, groupId: value });
                            }}
                            defaultValue={data.groupId ?? undefined}
                          >
                            <SelectTrigger className="focus:ring-offset-3 flex w-full rounded-md border-0 bg-background py-1.5 text-foreground shadow-sm ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-gray-400 sm:text-sm sm:leading-6">
                              <SelectValue placeholder="Select an group" />
                            </SelectTrigger>
                            <SelectContent>
                              {isLoadingGroups ? (
                                <SelectItem value="loading" disabled>
                                  Loading groups...
                                </SelectItem>
                              ) : viewerGroups && viewerGroups.length > 0 ? (
                                viewerGroups.map(({ id, name, _count }) => (
                                  <SelectItem key={id} value={id}>
                                    {name}{" "}
                                    <span className="text-muted-foreground">
                                      ({_count.members} members)
                                    </span>
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="no-groups" disabled>
                                  No groups available
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="link-name">Link Name</Label>

                          <Input
                            type="text"
                            name="link-name"
                            id="link-name"
                            placeholder={
                              viewerGroups?.find(
                                (group) => group.id === data.groupId,
                              )?.name
                                ? `${
                                    viewerGroups?.find(
                                      (group) => group.id === data.groupId,
                                    )?.name
                                  } Link`
                                : "Group Link"
                            }
                            value={data.name || ""}
                            className="focus:ring-inset"
                            onChange={(e) =>
                              setData({ ...data, name: e.target.value })
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <DomainSection
                            {...{ data, setData, domains }}
                            plan={plan}
                            linkType={linkType}
                            editLink={!!currentLink}
                          />
                        </div>

                        <div className="relative flex items-center">
                          <Separator className="absolute bg-muted-foreground" />
                          <div className="relative mx-auto">
                            <span className="bg-background px-2 text-sm text-muted-foreground dark:bg-gray-900">
                              Link Options
                            </span>
                          </div>
                        </div>

                        <LinkOptions
                          data={data}
                          setData={setData}
                          linkType={linkType}
                          editLink={!!currentLink}
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
          </ScrollArea>

          <SheetFooter>
            <div className="flex items-center pt-2">
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

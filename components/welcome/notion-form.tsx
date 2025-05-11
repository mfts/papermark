import { useRouter } from "next/router";

import { type FormEvent, useState } from "react";

import { useTeam } from "@/context/team-context";
import { LinkType } from "@prisma/client";
import { motion } from "motion/react";
import { usePlausible } from "next-plausible";
import { parsePageId } from "notion-utils";
import { toast } from "sonner";

import { useAnalytics } from "@/lib/analytics";
import { STAGGER_CHILD_VARIANTS } from "@/lib/constants";
import {
  convertDataUrlToFile,
  copyToClipboard,
  uploadImage,
} from "@/lib/utils";

import {
  DEFAULT_LINK_PROPS,
  DEFAULT_LINK_TYPE,
} from "@/components/links/link-sheet";
import { LinkOptions } from "@/components/links/link-sheet/link-options";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import Skeleton from "../Skeleton";

export default function NotionForm() {
  const router = useRouter();
  const plausible = usePlausible();
  const analytics = useAnalytics();
  const [uploading, setUploading] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentLinkId, setCurrentLinkId] = useState<string | null>(null);
  const [currentDocId, setCurrentDocId] = useState<string | null>(null);
  const [notionLink, setNotionLink] = useState<string | null>(null);
  const [linkData, setLinkData] = useState<DEFAULT_LINK_TYPE>(
    DEFAULT_LINK_PROPS(LinkType.DOCUMENT_LINK),
  );
  const teamInfo = useTeam();

  const createNotionFileName = () => {
    // Extract Notion file name from the URL
    const urlSegments = (notionLink as string).split("/")[3];
    // Remove the last hyphen along with the Notion ID
    const extractName = urlSegments.replace(/-([^/-]+)$/, "");
    const notionFileName = extractName.replaceAll("-", " ") || "Notion Link";

    return notionFileName;
  };

  const handleNotionUpload = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    const validateNotionPageURL = parsePageId(notionLink);
    // Check if it's a valid URL or not by Regx
    const isValidURL =
      /^(https?:\/\/)?([a-zA-Z0-9-]+\.){1,}[a-zA-Z]{2,}([a-zA-Z0-9-._~:/?#[\]@!$&'()*+,;=]+)?$/;

    // Check if the field is empty or not
    if (!notionLink) {
      toast.error("Please enter a Notion link to proceed.");
      return; // prevent form from submitting
    }
    if (validateNotionPageURL === null || !isValidURL.test(notionLink)) {
      toast.error("Please enter a valid Notion link to proceed.");
      return;
    }

    try {
      setUploading(true);

      const response = await fetch(
        `/api/teams/${teamInfo?.currentTeam?.id}/documents`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: createNotionFileName(),
            url: notionLink,
            numPages: 1,
            type: "notion",
            createLink: true,
          }),
        },
      );

      if (response) {
        const document = await response.json();
        const linkId = document.links[0].id;

        // track the event
        plausible("documentUploaded");
        plausible("notionDocumentUploaded");
        analytics.capture("Document Added", {
          documentId: document.id,
          name: document.name,
          fileSize: null,
          path: router.asPath,
          type: "notion",
          teamId: teamInfo?.currentTeam?.id,
        });
        analytics.capture("Link Added", {
          linkId: document.links[0].id,
          documentId: document.id,
          customDomain: null,
          teamId: teamInfo?.currentTeam?.id,
        });

        // redirect to the document page
        setTimeout(() => {
          setCurrentDocId(document.id);
          setCurrentLinkId(linkId);
          setUploading(false);
        }, 2000);
      }
    } catch (error) {
      setUploading(false);
      toast.error(
        "Oops! Can't access the Notion page. Please double-check it's set to 'Public'.",
      );
      console.error(
        "An error occurred while processing the Notion link: ",
        error,
      );
    } finally {
      setNotionLink(null);
      setUploading(false);
    }
  };

  const handleSubmit = async (event: any) => {
    event.preventDefault();

    setIsLoading(true);

    // Upload the image if it's a data URL
    let blobUrl: string | null =
      linkData.metaImage && linkData.metaImage.startsWith("data:")
        ? null
        : linkData.metaImage;
    if (linkData.metaImage && linkData.metaImage.startsWith("data:")) {
      // Convert the data URL to a blob
      const blob = convertDataUrlToFile({ dataUrl: linkData.metaImage });
      // Upload the blob to vercel storage
      blobUrl = await uploadImage(blob);
      setLinkData({ ...linkData, metaImage: blobUrl });
    }

    const response = await fetch(`/api/links/${currentLinkId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...linkData,
        metaImage: blobUrl,
        targetId: currentDocId,
        linkType: LinkType.DOCUMENT_LINK,
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

    copyToClipboard(
      `${process.env.NEXT_PUBLIC_MARKETING_URL}/view/${currentLinkId}`,
      "Link copied to clipboard. Redirecting to document page...",
    );

    router.push(`/documents/${currentDocId}`);
    setIsLoading(false);
  };

  return (
    <>
      {!currentDocId && (
        <motion.div
          className="z-10 -mt-10 flex flex-col space-y-10"
          variants={{
            hidden: { opacity: 0, scale: 0.95 },
            show: {
              opacity: 1,
              scale: 1,
              transition: {
                staggerChildren: 0.2,
              },
            },
          }}
          initial="hidden"
          animate="show"
          exit="hidden"
          transition={{ duration: 0.3, type: "spring" }}
        >
          <motion.div
            variants={STAGGER_CHILD_VARIANTS}
            className="flex flex-col items-center space-y-10 text-center"
          >
            <h1 className="font-display text-3xl font-semibold text-foreground transition-colors sm:text-4xl">
              Share a Notion Page
            </h1>
          </motion.div>
          <motion.div variants={STAGGER_CHILD_VARIANTS}>
            <form
              encType="multipart/form-data"
              onSubmit={handleNotionUpload}
              className="flex flex-col"
            >
              <div className="space-y-1 pb-8">
                <Label htmlFor="notion-link">Add Notion Page Link</Label>
                <div className="mt-2">
                  <input
                    type="text"
                    name="notion-link"
                    id="notion-link"
                    placeholder="notion.site/..."
                    className="flex w-full rounded-md border-0 bg-background py-1.5 text-foreground shadow-sm ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-gray-400 sm:text-sm sm:leading-6"
                    value={notionLink || ""}
                    onChange={(e) => setNotionLink(e.target.value)}
                  />
                </div>
                <small className="text-xs text-muted-foreground">
                  Your Notion page needs to be shared publicly.
                </small>
              </div>
              <div className="flex justify-center">
                <Button
                  type="submit"
                  className="w-full lg:w-1/2"
                  disabled={uploading || !notionLink}
                  loading={uploading}
                >
                  {uploading ? "Saving..." : "Save Notion Link"}
                </Button>
              </div>
            </form>

            <div className="text-center text-xs text-muted-foreground">
              <span>Use our</span>{" "}
              <Button
                variant="link"
                className="px-0 text-xs font-normal text-muted-foreground underline hover:text-gray-700"
                onClick={async () => {
                  setNotionLink(
                    "https://mfts.notion.site/Papermark-7b582345016b42b6951396f6ee626121",
                  );
                }}
              >
                sample Notion link
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {currentDocId && (
        <motion.div
          className="z-10 flex flex-col space-y-10 text-center"
          variants={{
            hidden: { opacity: 0, scale: 0.95 },
            show: {
              opacity: 1,
              scale: 1,
              transition: {
                staggerChildren: 0.2,
              },
            },
          }}
          initial="hidden"
          animate="show"
          exit="hidden"
          transition={{ duration: 0.3, type: "spring" }}
        >
          <motion.div
            variants={STAGGER_CHILD_VARIANTS}
            className="flex flex-col items-center space-y-10 text-center"
          >
            <h1 className="font-display text-3xl font-semibold text-foreground transition-colors sm:text-4xl">
              Share your unique link
            </h1>
          </motion.div>

          <motion.div variants={STAGGER_CHILD_VARIANTS}>
            {!currentLinkId && (
              <main className="min-h-[300px]">
                <div className="flex flex-col justify-center">
                  <div className="flex py-8">
                    <div className="flex w-full focus-within:z-10">
                      <Skeleton className="h-6 w-full" />
                    </div>
                  </div>
                </div>
              </main>
            )}
            {currentLinkId && currentDocId && (
              <main className="max-h-[calc(100dvh-10rem)] min-h-[300px] overflow-y-scroll scrollbar-hide">
                <div className="flex flex-col justify-center">
                  <div className="relative">
                    <div className="flex py-8">
                      <div className="flex w-full max-w-xs focus-within:z-10 sm:max-w-lg">
                        <p className="block w-full overflow-y-scroll rounded-md border-0 bg-secondary px-4 py-1.5 text-left leading-6 text-secondary-foreground md:min-w-[500px]">
                          {`${process.env.NEXT_PUBLIC_MARKETING_URL}/view/${currentLinkId}`}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="w-full max-w-xs pb-8 sm:max-w-lg">
                    <Accordion type="single" collapsible>
                      <AccordionItem value="item-1" className="border-none">
                        <AccordionTrigger className="space-x-2 rounded-lg py-0">
                          <span className="text-sm font-medium leading-6 text-foreground">
                            Configure Link Options
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="first:pt-5">
                          <LinkOptions
                            data={linkData}
                            setData={setLinkData}
                            linkType={LinkType.DOCUMENT_LINK}
                          />
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                  <div className="mb-4 flex items-center justify-center">
                    <Button loading={isLoading} onClick={handleSubmit}>
                      Share document link
                    </Button>
                  </div>
                  <div className="text-center text-xs text-muted-foreground">
                    <span>You can change configurations later</span>
                  </div>
                </div>
              </main>
            )}
          </motion.div>
        </motion.div>
      )}
    </>
  );
}

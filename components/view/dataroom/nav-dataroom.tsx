import Link from "next/link";

import React, { useEffect, useState } from "react";

import { DataroomBrand } from "@prisma/client";
import { BadgeInfoIcon, Download } from "lucide-react";
import { toast } from "sonner";

import { formatDate } from "@/lib/utils";

import {
  ButtonTooltip,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TooltipProvider } from "@/components/ui/tooltip";

import { Button } from "../../ui/button";
import { ConversationSidebar } from "../conversations/sidebar";

const DEFAULT_BANNER_IMAGE = "/_static/papermark-banner.png";

export default function DataroomNav({
  allowDownload,
  allowBulkDownload,
  brand,
  viewId,
  linkId,
  dataroom,
  isPreview,
  dataroomId,
  viewerId,
  conversationsEnabled,
  isTeamMember,
}: {
  allowDownload?: boolean;
  allowBulkDownload?: boolean;
  brand?: Partial<DataroomBrand>;
  viewId?: string;
  linkId?: string;
  dataroom?: any;
  isPreview?: boolean;
  dataroomId?: string;
  viewerId?: string;
  conversationsEnabled?: boolean;
  isTeamMember?: boolean;
}) {
  const [loading, setLoading] = useState<boolean>(false);
  const [showConversations, setShowConversations] = useState<boolean>(false);

  const downloadDataroom = async () => {
    if (isPreview) {
      toast.error("You cannot download datarooms in preview mode.");
      return;
    }
    if (!allowDownload) return;
    setLoading(true);
    try {
      toast.promise(
        fetch(`/api/links/download/bulk`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ linkId, viewId }),
        }),
        {
          loading: "Downloading dataroom...",
          success: async (response) => {
            const { downloadUrl } = await response.json();

            const link = document.createElement("a");
            link.href = downloadUrl;
            link.rel = "noopener noreferrer";
            document.body.appendChild(link);
            link.click();

            setTimeout(() => {
              document.body.removeChild(link);
            }, 100);

            return "Dataroom downloaded successfully.";
          },
          error: (error) => {
            console.log(error);
            return (
              error.message || "An error occurred while downloading dataroom."
            );
          },
        },
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle conversations with 'c' key
      if (
        e.key === "c" &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        conversationsEnabled &&
        !showConversations // if conversations are already open, don't toggle them
      ) {
        e.preventDefault();
        setShowConversations((prev) => !prev);
      }

      if (e.key === "Escape" && showConversations) {
        e.preventDefault();
        setShowConversations(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [conversationsEnabled, showConversations]);

  return (
    <nav
      className="bg-black"
      style={{
        backgroundColor: brand && brand.brandColor ? brand.brandColor : "black",
      }}
    >
      <div className="mx-auto px-2 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          <div className="flex flex-1 items-center justify-start">
            <div className="relative flex h-16 w-36 flex-shrink-0 items-center">
              {brand && brand.logo ? (
                <img
                  className="h-16 w-36 object-contain"
                  src={brand.logo}
                  alt="Logo"
                />
              ) : (
                <Link
                  href={`https://www.papermark.com/home?utm_campaign=navbar&utm_medium=navbar&utm_source=papermark-${linkId}`}
                  target="_blank"
                  className="text-2xl font-bold tracking-tighter text-white"
                >
                  Papermark
                </Link>
              )}
            </div>
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center space-x-4 pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
            {isTeamMember ? (
              <TooltipProvider delayDuration={100}>
                <Tooltip defaultOpen>
                  <TooltipTrigger asChild>
                    <Button
                      className="size-8 bg-gray-900 text-white hover:bg-gray-900/80 sm:size-10"
                      size="icon"
                    >
                      <BadgeInfoIcon className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-wrap text-center">
                      Skipped verification because you are a team member; no
                      analytics will be collected
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : null}
            {conversationsEnabled && (
              <Button onClick={() => setShowConversations(!showConversations)}>
                View FAQ
              </Button>
            )}
            {allowDownload && allowBulkDownload ? (
              <ButtonTooltip content="Download Dataroom">
                <Button
                  onClick={downloadDataroom}
                  className="m-1 bg-gray-900 text-white hover:bg-gray-900/80"
                  size="icon"
                  loading={loading}
                >
                  <Download className="h-5 w-5" />
                </Button>
              </ButtonTooltip>
            ) : null}
          </div>
        </div>
      </div>

      {/* Banner section */}
      <div className="relative h-[20vh] sm:h-auto sm:max-h-80">
        <img
          className="h-full w-full object-cover sm:max-h-80 sm:object-contain xl:object-cover"
          src={brand?.banner || DEFAULT_BANNER_IMAGE}
          alt="Banner"
          width={1920}
          height={320}
        />
        <div className="absolute bottom-5 w-fit rounded-r-md bg-white/30 backdrop-blur-md">
          <div className="px-5 py-2 sm:px-10">
            <div className="text-3xl">{dataroom.name}</div>
            <time
              className="text-sm"
              dateTime={new Date(dataroom.lastUpdatedAt).toISOString()}
            >
              {`Last updated ${formatDate(dataroom.lastUpdatedAt)}`}
            </time>
          </div>
        </div>
      </div>

      {conversationsEnabled && showConversations ? (
        <ConversationSidebar
          dataroomId={dataroomId}
          viewId={viewId || ""}
          viewerId={viewerId}
          linkId={linkId!}
          isEnabled={true}
          isOpen={showConversations}
          onOpenChange={setShowConversations}
        />
      ) : null}
    </nav>
  );
}

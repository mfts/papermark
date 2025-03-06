import Image from "next/image";
import Link from "next/link";

import React, { useState } from "react";

import { DataroomBrand } from "@prisma/client";
import { ArrowUpRight, Download } from "lucide-react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { timeAgo } from "@/lib/utils";

import PapermarkSparkle from "../../shared/icons/papermark-sparkle";
import { Button } from "../../ui/button";
import { TDocumentData } from "./dataroom-view";

export default function DataroomNav({
  pageNumber,
  numPages,
  allowDownload,
  assistantEnabled,
  brand,
  viewId,
  linkId,
  type,
  embeddedLinks,
  isDataroom,
  setDocumentData,
  dataroom,
  isPreview,
}: {
  pageNumber?: number;
  numPages?: number;
  allowDownload?: boolean;
  assistantEnabled?: boolean;
  brand?: Partial<DataroomBrand>;
  embeddedLinks?: string[];
  viewId?: string;
  linkId?: string;
  type?: "pdf" | "notion";
  isDataroom?: boolean;
  setDocumentData?: React.Dispatch<React.SetStateAction<TDocumentData | null>>;
  dataroom?: any;
  isPreview?: boolean;
}) {
  const [loading, setLoading] = useState<boolean>(false);

  const downloadDataroom = async () => {
    if (isPreview) {
      toast.error("You cannot download datarooms in preview mode.");
      return;
    }
    if (!allowDownload || type === "notion") return;
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
            window.open(downloadUrl, "_blank");
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
                  // fill
                  // quality={100}
                  // priority
                />
              ) : (
                <Link
                  href="https://www.papermark.io"
                  target="_blank"
                  className="text-2xl font-bold tracking-tighter text-white"
                >
                  Papermark
                </Link>
              )}
            </div>
            {isDataroom && setDocumentData ? (
              <div>
                <Button
                  onClick={() => setDocumentData(null)}
                  className="text-sm font-medium text-white"
                  variant="link"
                >
                  Dataroom Home
                </Button>
              </div>
            ) : null}
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center space-x-4 pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
            {embeddedLinks && embeddedLinks.length > 0 ? (
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Button className="bg-gray-900 text-sm font-medium text-white hover:bg-gray-900/80">
                    Links on Page
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="space-y-2" align="end">
                  <DropdownMenuLabel>Links on current page</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {embeddedLinks.map((link, index) => (
                    <Link
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      key={index}
                    >
                      <DropdownMenuItem className="group h-10">
                        <span className="w-[200px] truncate group-focus:overflow-x-auto group-focus:text-clip">
                          {link}
                        </span>
                        <DropdownMenuShortcut className="pl-2 opacity-0 group-hover:opacity-60 group-focus:opacity-60">
                          <ArrowUpRight />
                        </DropdownMenuShortcut>
                      </DropdownMenuItem>
                    </Link>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
            {assistantEnabled ? (
              <Link href={`/view/${linkId}/chat`}>
                <Button
                  className="m-1 bg-gray-900 text-white hover:bg-gray-900/80"
                  variant={"special"}
                  size={"icon"}
                  style={{
                    backgroundSize: "200% auto",
                  }}
                  title="Open AI Document Assistant"
                >
                  <PapermarkSparkle className="h-5 w-5" />
                </Button>
              </Link>
            ) : null}
            {allowDownload ? (
              <Button
                onClick={downloadDataroom}
                className="m-1 bg-gray-900 text-white hover:bg-gray-900/80"
                size="icon"
                title="Download Dataroom"
                loading={loading}
              >
                <Download className="h-5 w-5" />
              </Button>
            ) : null}
            {pageNumber && numPages ? (
              <div className="flex h-10 items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white">
                <span>{pageNumber}</span>
                <span className="text-gray-400"> / {numPages}</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      {brand && brand.banner ? (
        <div className="relative h-[30vh]">
          <img
            className="h-[30vh] w-full object-cover"
            src={brand.banner}
            alt="Banner"
            width={1920}
            height={320}
            // quality={100}
            // priority
          />
          <div className="absolute bottom-5 w-fit rounded-r-md bg-white/30 backdrop-blur-md">
            <div className="px-5 py-2 sm:px-10">
              <div className="text-3xl">{dataroom.name}</div>
              <time
                className="text-sm"
                dateTime={new Date(dataroom.lastUpdatedAt).toISOString()}
              >
                {`Last updated ${timeAgo(dataroom.lastUpdatedAt)}`}
              </time>
            </div>
          </div>
        </div>
      ) : null}
    </nav>
  );
}

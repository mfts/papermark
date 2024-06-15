import Image from "next/image";
import Link from "next/link";

import { MutableRefObject } from "react";
import React from "react";

import { Brand, DataroomBrand } from "@prisma/client";
import {
  ArrowUpRight,
  Download,
  Slash,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react";
import { ReactZoomPanPinchContentRef } from "react-zoom-pan-pinch";
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

import { determineTextColor } from "@/lib/utils/determine-text-color";

import PapermarkSparkle from "../shared/icons/papermark-sparkle";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb";
import { Button } from "../ui/button";
import { TDocumentData } from "./dataroom/dataroom-view";

export default function Nav({
  pageNumber,
  numPages,
  allowDownload,
  assistantEnabled,
  brand,
  viewId,
  linkId,
  type,
  embeddedLinks,
  documentName,
  isDataroom,
  setDocumentData,
  documentRefs,
}: {
  pageNumber?: number;
  numPages?: number;
  allowDownload?: boolean;
  assistantEnabled?: boolean;
  brand?: Partial<Brand> | Partial<DataroomBrand> | null;
  embeddedLinks?: string[];
  viewId?: string;
  linkId?: string;
  type?: "pdf" | "notion" | "sheet";
  documentName?: string;
  isDataroom?: boolean;
  setDocumentData?: React.Dispatch<React.SetStateAction<TDocumentData | null>>;
  documentRefs?: MutableRefObject<(ReactZoomPanPinchContentRef | null)[]>;
}) {
  const downloadFile = async () => {
    if (!allowDownload || type === "notion") return;
    try {
      const response = await fetch(`/api/links/download`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ linkId, viewId }),
      });

      if (!response.ok) {
        toast.error("Error downloading file");
        return;
      }

      const { downloadUrl } = await response.json();
      window.open(downloadUrl, "_blank");
    } catch (error) {
      console.error("Error downloading file:", error);
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
                <Image
                  className="object-contain"
                  src={brand.logo}
                  alt="Logo"
                  fill
                  quality={100}
                  priority
                />
              ) : (
                <Link
                  href={`https://www.papermark.io?utm_campaign=navbar&utm_medium=navbar&utm_source=papermark-${linkId}`}
                  target="_blank"
                  className="text-2xl font-bold tracking-tighter text-white"
                >
                  Papermark
                </Link>
              )}
            </div>
            {isDataroom && setDocumentData ? (
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink
                      className="cursor-pointer underline underline-offset-4 hover:font-medium"
                      onClick={() => setDocumentData(null)}
                      style={{
                        color:
                          brand && brand.brandColor
                            ? determineTextColor(brand.brandColor)
                            : "white",
                      }}
                    >
                      Home
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator>
                    <Slash />
                  </BreadcrumbSeparator>
                  <BreadcrumbItem>
                    <BreadcrumbPage
                      className="font-medium"
                      style={{
                        color:
                          brand && brand.brandColor
                            ? determineTextColor(brand.brandColor)
                            : "white",
                      }}
                    >
                      {documentName ?? "Document"}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
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
                onClick={downloadFile}
                className="m-1 bg-gray-900 text-white hover:bg-gray-900/80"
                size="icon"
                title="Download document"
              >
                <Download className="h-5 w-5" />
              </Button>
            ) : null}
            {documentRefs ? (
              <div className="flex gap-1">
                <Button
                  onClick={() =>
                    documentRefs.current[pageNumber! - 1]?.zoomIn()
                  }
                  className=" bg-gray-900 text-white hover:bg-gray-900/80"
                  size="icon"
                  title="Zoom in"
                >
                  <ZoomInIcon className="h-5 w-5" />
                </Button>
                <Button
                  onClick={() =>
                    documentRefs.current[pageNumber! - 1]?.zoomOut()
                  }
                  className=" bg-gray-900 text-white hover:bg-gray-900/80"
                  size="icon"
                  title="Zoom out"
                >
                  <ZoomOutIcon className="h-5 w-5" />
                </Button>
              </div>
            ) : null}
            {pageNumber && numPages ? (
              <div className="flex h-10 items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white">
                <span style={{ fontVariantNumeric: "tabular-nums" }}>
                  {pageNumber}
                </span>
                <span
                  className="text-gray-400"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {" "}
                  / {numPages}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
}

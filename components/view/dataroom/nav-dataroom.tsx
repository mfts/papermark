import Link from "next/link";
import { Button } from "../../ui/button";
import PapermarkSparkle from "../../shared/icons/papermark-sparkle";
import { ArrowUpRight, Download } from "lucide-react";
import { Brand, DataroomBrand } from "@prisma/client";
import Image from "next/image";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import { timeAgo } from "@/lib/utils";

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
}: {
  pageNumber?: number;
  numPages?: number;
  allowDownload?: boolean;
  assistantEnabled?: boolean;
  brand?: DataroomBrand;
  embeddedLinks?: string[];
  viewId?: string;
  linkId?: string;
  type?: "pdf" | "notion";
  isDataroom?: boolean;
  setDocumentData?: (data: any) => void;
  dataroom?: any;
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
        <div className="relative flex h-12 items-center justify-between">
          <div className="flex flex-1 justify-start items-center">
            <div className="flex flex-shrink-0 items-center relative h-6 w-36">
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
                  className="text-white text-sm font-medium"
                  variant="link"
                >
                  Dataroom Home
                </Button>
              </div>
            ) : null}
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0 space-x-4">
            {embeddedLinks && embeddedLinks.length > 0 ? (
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Button className="text-sm font-medium text-white bg-gray-900 hover:bg-gray-900/80">
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
                        <span className="w-[200px] truncate group-focus:text-clip group-focus:overflow-x-auto">
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
                  className="text-white bg-gray-900 hover:bg-gray-900/80 m-1"
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
                className="text-white bg-gray-900 hover:bg-gray-900/80 m-1"
                size="icon"
                title="Download document"
              >
                <Download className="w-5 h-5" />
              </Button>
            ) : null}
            {pageNumber && numPages ? (
              <div className="bg-gray-900 text-white rounded-md h-10 px-4 py-2 items-center flex text-sm font-medium">
                <span>{pageNumber}</span>
                <span className="text-gray-400"> / {numPages}</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      {brand && brand.banner ? (
        <div className="relative h-[30vh]">
          <Image
            className="object-cover w-full h-[30vh]"
            src={brand.banner}
            alt="Banner"
            width={1920}
            height={320}
            quality={100}
            priority
          />
          <div className="absolute bottom-5 w-fit backdrop-blur-md bg-white/30 rounded-r-md">
            <div className="px-5 sm:px-10 py-2">
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

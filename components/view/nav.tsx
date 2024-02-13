import Link from "next/link";
import { Button } from "../ui/button";
import PapermarkSparkle from "../shared/icons/papermark-sparkle";
import { Download } from "lucide-react";
import { Brand } from "@prisma/client";
import Image from "next/image";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DropDown from "../web/alternatives/dropdownproto";

// TODO: trigger dev job start garni ani matra file upload garni ho k

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
}: {
  pageNumber?: number;
  numPages?: number;
  allowDownload?: boolean;
  assistantEnabled?: boolean;
  brand?: Brand;
  embeddedLinks?: string[];
  viewId?: string;
  linkId?: string;
  type?: "pdf" | "notion";
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
          <div className="flex flex-1 items-stretch justify-start">
            <div className="flex flex-shrink-0 items-center relative h-8 w-36">
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
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0 space-x-4">
            {embeddedLinks && embeddedLinks.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <div className="text-sm font-semibold mr-6">
                    Embedded Links
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="space-y-2 pt-2 px-4">
                  {embeddedLinks.map((link, index) => (
                    <Link
                      href={link}
                      target="_blank"
                      className="text-sm flex items-start gap-2"
                      key={index}
                    >
                      <span>{index + 1}.</span>
                      <span className="underline">{link}</span>
                    </Link>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {assistantEnabled ? (
              <Link href={`/view/${linkId}/chat`}>
                <Button
                  className="group space-x-1 bg-gradient-to-r from-[#16222A] via-emerald-500 to-[#16222A] duration-200 ease-linear hover:bg-right"
                  variant={"special"}
                  style={{
                    backgroundSize: "200% auto",
                  }}
                >
                  <PapermarkSparkle className="h-5 w-5 animate-pulse group-hover:animate-none" />{" "}
                  <span>AI Assistant</span>
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
    </nav>
  );
}

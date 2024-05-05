import { nFormatter, timeAgo } from "@/lib/utils";
import Link from "next/link";
import { type DocumentWithLinksAndLinkCountAndViewCount } from "@/lib/types";
import { TeamContextType } from "@/context/team-context";
import BarChart from "@/components/shared/icons/bar-chart";
import Image from "next/image";
import NotionIcon from "@/components/shared/icons/notion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TrashIcon, MoreVertical, FolderInputIcon } from "lucide-react";
import { mutate } from "swr";
import { useCopyToClipboard } from "@/lib/utils/use-copy-to-clipboard";
import Check from "@/components/shared/icons/check";
import Copy from "@/components/shared/icons/copy";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { MoveToFolderModal } from "@/components/documents/move-folder-modal";
import { type DataroomFolderDocument } from "@/lib/swr/use-dataroom";

type DRDocument = {
  dataroomDocumentId: string;
  id: string;
  name: string;
  versions: {
    id: string;
    type: string;
    versionNumber: number;
    hasPages: boolean;
  }[];
};

type DocumentsCardProps = {
  document: DRDocument;
  setViewType: (type: "DOCUMENT_VIEW" | "DATAROOM_VIEW") => void;
  setDocumentData: (data: {
    id: string;
    name: string;
    hasPages: boolean;
    documentType: "pdf" | "notion";
    documentVersionId: string;
    documentVersionNumber: number;
  }) => void;
};
export default function DocumentCard({
  document,
  setViewType,
  setDocumentData,
}: DocumentsCardProps) {
  const { theme, systemTheme } = useTheme();
  const isLight =
    theme === "light" || (theme === "system" && systemTheme === "light");

  return (
    <>
      <li className="group/row relative rounded-lg p-3 border-0 dark:bg-secondary ring-1 ring-gray-200 dark:ring-gray-700 transition-all hover:ring-gray-300 hover:dark:ring-gray-500 hover:bg-secondary sm:p-4 flex justify-between items-center">
        <div className="min-w-0 flex shrink items-center space-x-2 sm:space-x-4">
          <div className="w-8 mx-0.5 sm:mx-1 text-center flex justify-center items-center">
            {document.versions[0].type === "notion" ? (
              <NotionIcon className="w-8 h-8" />
            ) : (
              <Image
                src={`/_icons/pdf${isLight ? "-light" : ""}.svg`}
                alt="File icon"
                width={50}
                height={50}
              />
            )}
          </div>

          <div className="flex-col">
            <div className="flex items-center">
              <h2 className="min-w-0 text-sm font-semibold leading-6 text-foreground truncate max-w-[150px] sm:max-w-md">
                <Link
                  href="#"
                  onClick={() => {
                    setViewType("DOCUMENT_VIEW");
                    setDocumentData({
                      id: document.id,
                      name: document.name,
                      hasPages: document.versions[0].hasPages,
                      documentType: document.versions[0].type as
                        | "pdf"
                        | "notion",
                      documentVersionId: document.versions[0].id,
                      documentVersionNumber: document.versions[0].versionNumber,
                    });
                  }}
                  className="truncate w-full"
                >
                  <span>{document.name}</span>
                  <span className="absolute inset-0" />
                </Link>
              </h2>
            </div>
          </div>
        </div>
      </li>
    </>
  );
}

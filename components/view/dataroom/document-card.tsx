import Image from "next/image";
import Link from "next/link";

import { useEffect, useRef, useState } from "react";

import { TeamContextType } from "@/context/team-context";
import { FolderInputIcon, MoreVertical, TrashIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { mutate } from "swr";

import { MoveToFolderModal } from "@/components/documents/move-folder-modal";
import BarChart from "@/components/shared/icons/bar-chart";
import Check from "@/components/shared/icons/check";
import Copy from "@/components/shared/icons/copy";
import NotionIcon from "@/components/shared/icons/notion";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { type DataroomFolderDocument } from "@/lib/swr/use-dataroom";
import { type DocumentWithLinksAndLinkCountAndViewCount } from "@/lib/types";
import { nFormatter, timeAgo } from "@/lib/utils";
import { useCopyToClipboard } from "@/lib/utils/use-copy-to-clipboard";

type DRDocument = {
  dataroomDocumentId: string;
  id: string;
  name: string;
  versions: {
    id: string;
    type: string;
    versionNumber: number;
    hasPages: boolean;
    isVertical: boolean;
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
    isVertical: boolean;
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
      <li className="group/row relative flex items-center justify-between rounded-lg border-0 p-3 ring-1 ring-gray-200 transition-all hover:bg-secondary hover:ring-gray-300 dark:bg-secondary dark:ring-gray-700 hover:dark:ring-gray-500 sm:p-4">
        <div className="flex min-w-0 shrink items-center space-x-2 sm:space-x-4">
          <div className="mx-0.5 flex w-8 items-center justify-center text-center sm:mx-1">
            {document.versions[0].type === "notion" ? (
              <NotionIcon className="h-8 w-8" />
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
              <h2 className="min-w-0 max-w-[150px] truncate text-sm font-semibold leading-6 text-foreground sm:max-w-md">
                <button
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
                      isVertical: document.versions[0].isVertical,
                    });
                  }}
                  className="w-full truncate"
                >
                  <span>{document.name}</span>
                  <span className="absolute inset-0" />
                </button>
              </h2>
            </div>
          </div>
        </div>
      </li>
    </>
  );
}

import React from "react";

import { useTheme } from "next-themes";

import { fileIcon } from "@/lib/utils/get-file-icon";

import { TDocumentData, TSupportedDocumentSimpleType } from "./dataroom-view";

type DRDocument = {
  dataroomDocumentId: string;
  id: string;
  name: string;
  downloadOnly: boolean;
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
  setDocumentData: React.Dispatch<React.SetStateAction<TDocumentData | null>>;
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
            {fileIcon({
              fileType: document.versions[0].type ?? "",
              className: "h-8 w-8",
              isLight,
            })}
          </div>

          <div className="flex-col">
            <div className="flex items-center">
              <h2 className="min-w-0 max-w-[300px] truncate text-sm font-semibold leading-6 text-foreground sm:max-w-lg">
                <button
                  onClick={() => {
                    setViewType("DOCUMENT_VIEW");
                    setDocumentData({
                      id: document.id,
                      name: document.name,
                      hasPages: document.versions[0].hasPages,
                      documentType: document.versions[0]
                        .type as TSupportedDocumentSimpleType,
                      documentVersionId: document.versions[0].id,
                      documentVersionNumber: document.versions[0].versionNumber,
                      downloadOnly: document.downloadOnly,
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

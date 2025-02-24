import { useRouter } from "next/router";

import React from "react";

import { useTheme } from "next-themes";

import { fileIcon } from "@/lib/utils/get-file-icon";

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
  linkId: string;
};

export default function DocumentCard({ document, linkId }: DocumentsCardProps) {
  const { theme, systemTheme } = useTheme();
  const isLight =
    theme === "light" || (theme === "system" && systemTheme === "light");
  const router = useRouter();
  const { previewToken, domain, slug } = router.query as {
    previewToken?: string;
    domain?: string;
    slug?: string;
  };

  const handleDocumentClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Open in new tab
    if (domain && slug) {
      window.open(`/${slug}/d/${document.dataroomDocumentId}`, "_blank");
    } else {
      window.open(
        `/view/${linkId}/d/${document.dataroomDocumentId}${
          previewToken ? `?previewToken=${previewToken}&preview=1` : ""
        }`,
        "_blank",
      );
    }
  };

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
                  onClick={handleDocumentClick}
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

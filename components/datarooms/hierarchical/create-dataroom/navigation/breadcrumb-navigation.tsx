import React, { Dispatch, SetStateAction } from "react";
import Link from "next/link";
import { FolderDirectory } from "@/lib/types";
import ChevronRight from "@/components/shared/icons/chevron-right";

export const BreadcrumbNavigation = React.memo(function ({
  path,
  folderDirectory,
  dataroomId,
  setPath,
  setCurrentFolderId
}:{
  path: string[],
  folderDirectory: FolderDirectory,
  dataroomId: string,
  setPath: Dispatch<SetStateAction<string[]>>,
  setCurrentFolderId: Dispatch<SetStateAction<string>>,
}) {
  return (
    <div className="flex" >
      {path && path.map((folderId: string, index: number) => {
        const href = `/datarooms/${dataroomId}${folderDirectory[folderId].href}`;
        return (
          <React.Fragment key={index}>
            {index > 0 &&
              <div className="mt-2 mr-1 ml-1"><ChevronRight /></div>}
            <Link
              className="text-muted-foreground hover:text-foreground underline"
              href={`/datarooms/[dataroomId]/[...path]`}
              as={href}
              shallow={true}
              onClick={() => {
                setCurrentFolderId(folderId);
                setPath(folderDirectory[folderId].href.split("/").splice(1));
              }}
            >
              {folderDirectory[folderId].name}
            </Link>
          </React.Fragment>
        )
      })}
    </div>
  )
})
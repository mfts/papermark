import Link from "next/link";
import { FolderDirectory } from "@/lib/types";
import { Dataroom } from "@prisma/client";
import { ActionType } from "../state-management";
import React, { Dispatch, SetStateAction } from "react";
import { FolderActions } from "./folder-actions";

export const Subfolders = React.memo( function ({
  folderDirectory,
  currentFolderId,
  dataroom,
  path,
  updateFolderDirectory,
  setPath,
  setCurrentFolderId
}: {
  folderDirectory: FolderDirectory,
  currentFolderId: string,
  dataroom: Dataroom,
  path: string[],
  updateFolderDirectory: Dispatch<ActionType>,
  setPath: Dispatch<SetStateAction<string[]>>,
  setCurrentFolderId: Dispatch<SetStateAction<string>>
}) {
  return (
    <div>
      {folderDirectory[currentFolderId].subfolders.map((subfolderId) => {
        return (
          <div className="flex items-center justify-between border-b p-2" key={subfolderId}>
            <div className="flex items-center">
              <Link
                className="flex"
                href={`/datarooms/[dataroomId]/[...path]`}
                as={`/datarooms/${dataroom.id}/${path.join('/')}/${subfolderId}`}
                shallow={true}
                onClick={() => {
                  setCurrentFolderId(subfolderId);
                  setPath((path: string[]) => [...path, subfolderId]);
                }}
              >
                <img src="/_icons/folder.svg" alt="Folder Icon" className="w-11 h-11 mr-2" />
                <span className="mt-3"> {folderDirectory[subfolderId].name}</span>
              </Link>
            </div>
            <div className="text-center sm:text-right">
              <FolderActions
              folderDirectory={folderDirectory}
              currentFolderId={currentFolderId}
              subfolderId={subfolderId}
              updateFolderDirectory={updateFolderDirectory}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
})
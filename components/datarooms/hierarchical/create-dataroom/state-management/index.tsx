import { DataroomFolder, DataroomFile } from "@prisma/client";
import { FolderDirectory } from "@/lib/types";

export type ActionType =
  | { type: "DELETE FOLDER"; folderId: string; parentFolderId: string }
  | { type: "DELETE FILE"; parentFolderId: string; fileId: string }
  | { type: "UPDATE FOLDERNAME"; folderId: string; name: string }
  | { type: "UPDATE FILENAME"; parentFolderId: string; fileId: string; updateFileName: string }
  | { type: "CREATE FOLDER"; parentFolderId: string; folder: DataroomFolder }
  | { type: "CREATE FILE"; parentFolderId: string; file: DataroomFile };

export const reducer = (folderDirectory: FolderDirectory, action: ActionType) => {
  switch (action.type) {
    case "DELETE FOLDER":
      const deletedFolderDirectory = { ...folderDirectory };
      //Delete all subfolders
      for (let subfolderId of deletedFolderDirectory[action.folderId].subfolders) {
        delete deletedFolderDirectory[subfolderId];
      }
      //Delete folder
      delete deletedFolderDirectory[action.folderId];
      //Delete from parent's subfolder array
      deletedFolderDirectory[action.parentFolderId].subfolders =
        deletedFolderDirectory[action.parentFolderId].subfolders.filter((folderId) => folderId !== action.folderId)
      return deletedFolderDirectory;

    case "DELETE FILE":
      const deletedFileDirectory = { ...folderDirectory };
      deletedFileDirectory[action.parentFolderId].files =
        deletedFileDirectory[action.parentFolderId].files.filter((file) => file.id !== action.fileId);
      return deletedFileDirectory;

    case "CREATE FOLDER":
      const createdFolderDirectory = { ...folderDirectory };
      createdFolderDirectory[action.parentFolderId].subfolders.push(action.folder.id);
      createdFolderDirectory[action.folder.id] = {
        name: action.folder.name,
        subfolders: [],
        files: [],
        href: createdFolderDirectory[action.parentFolderId].href + `/${action.folder.id}`,
      };
      return createdFolderDirectory;

    case "CREATE FILE":
      const createFileDirectory = { ...folderDirectory };
      createFileDirectory[action.parentFolderId].files.push(action.file);
      return createFileDirectory;

    case "UPDATE FOLDERNAME":
      const updatedFolderDirectory = { ...folderDirectory };
      updatedFolderDirectory[action.folderId].name = action.name
      return updatedFolderDirectory;

    case "UPDATE FILENAME":
      const updatedFileDirectory = { ...folderDirectory };
      let file: DataroomFile = updatedFileDirectory[action.parentFolderId].files.find((file) => file.id === action.fileId) as DataroomFile;
      file.name = action.updateFileName;
      return updatedFileDirectory;

    default:
      return folderDirectory;
  }
}
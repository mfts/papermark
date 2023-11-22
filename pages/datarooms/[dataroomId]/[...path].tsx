import NavigationBar from "@/components/datarooms/create-dataroom/navigation-bar";
import AppLayout from "@/components/layouts/app";
import Image from "next/image";
import React, { useState, useRef, useEffect, useReducer } from "react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import ChevronRight from "@/components/shared/icons/chevron-right";
import { Dataroom, DataroomFile, DataroomFolder } from "@prisma/client";
import { PlusIcon } from "@heroicons/react/24/solid";
import AddFolderModal from "@/components/datarooms/create-dataroom/add-folder-modal";
import LoadingSpinner from "@/components/ui/loading-spinner";
import NotFound from "@/pages/404";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import MoreHorizontal from "@/components/shared/icons/more-horizontal";
import { FolderDirectory } from "@/lib/types";
import { GetServerSidePropsContext } from "next";
import EditObjectNameModal from "@/components/datarooms/create-dataroom/edit-object-name-modal";
import { getServerSession } from "next-auth";
import { authOptions } from "../../api/auth/[...nextauth]";
import { useRouter } from "next/router";
import Link from "next/link";
import AddFileModal from "@/components/datarooms/create-dataroom/add-file-modal";

export type ActionType =
  | { type: "DELETE FOLDER"; folderId: string; parentFolderId: string }
  | { type: "DELETE FILE"; parentFolderId: string; fileId: string }
  | { type: "UPDATE FOLDERNAME"; folderId: string; name: string }
  | { type: "UPDATE FILENAME"; parentFolderId: string; fileId: string; updateFileName: string }
  | { type: "CREATE FOLDER"; parentFolderId: string; folder: DataroomFolder }
  | { type: "CREATE FILE"; parentFolderId: string; file: DataroomFile };

const reducer = (folderDirectory: FolderDirectory, action: ActionType) => {
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

export default function Page({
  dataroom,
  directory,
  initialFolderId,
  initialPath,
  loading,
  error
}: {
  dataroom: Dataroom,
  directory: FolderDirectory,
  initialFolderId: string,
  initialPath: string[],
  loading: boolean,
  error: { status: 404, message: string }
}) {

  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [isEditingDescription, setIsEditingDescription] = useState<boolean>(false);
  const [isEditObjectNameModalOpen, setIsEditObjectNameModalOpen] = useState<boolean>(false);
  const [editObjectMetadata, setEditObjectMetadata] = useState<{
    name: string,
    id: string,
    parentFolderId: string,
    type: "FILE" | "FOLDER"
  }>({
    name: "",
    id: "",
    parentFolderId: "",
    type: "FOLDER"
  });
  const router = useRouter();
  const [folderDirectory, updateFolderDirectory] = useReducer(reducer, directory);
  const [currentFolderId, setCurrentFolderId] = useState<string>(initialFolderId);
  const [path, setPath] = useState<string[]>(initialPath);
  const currPath = router.query.path as string[];

  //In cases when user presses back in browser
  if (currPath && currPath[currPath.length - 1] !== path[path.length - 1]) {
    setPath(currPath);
    setCurrentFolderId(currPath[currPath.length - 1]);
  }

  const nameRef = useRef<HTMLHeadingElement>(null);
  const descriptionRef = useRef<HTMLHeadingElement>(null);
  const enterPressedRef = useRef<boolean>(false);

  const handleSubmit = async () => {
    if (enterPressedRef.current) {
      enterPressedRef.current = false;
      return;
    }
    if ((nameRef.current && isEditingName) ||
      (descriptionRef.current && isEditingDescription)) {
      const newName = nameRef.current?.innerText;
      const newDescription = descriptionRef.current?.innerText;

      if (newName !== dataroom!.name || newDescription !== dataroom!.description) {
        const response = await fetch(
          `/api/datarooms/hierarchical-datarooms/${dataroom!.id}/update-name`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: newName,
              description: newDescription
            }),
          }
        );

        if (response.ok) {
          const { message } = await response.json();
          toast.success(message);
        } else {
          const { message } = await response.json();
          toast.error(message);
        }
      }
      setIsEditingName(false);
      setIsEditingDescription(false);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    //Delete folder from database
    const response = await fetch(`/api/datarooms/hierarchical-datarooms/folders`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: folderId })
    })

    if (!response.ok) {
      toast.error("Failed to delete folder");
      return;
    }

    //Delete folder locally
    updateFolderDirectory({ type: "DELETE FOLDER", folderId, parentFolderId: currentFolderId });
    toast.success("Folder deleted successfully");
  }

  const handleDeleteFile = async (fileId: string) => {
    //Delete file from database
    const response = await fetch(`/api/datarooms/hierarchical-datarooms/files`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: fileId })
    })

    if (!response.ok) {
      toast.error("Failed to delete file");
      return;
    }

    //Delete file locally
    updateFolderDirectory({ type: "DELETE FILE", fileId, parentFolderId: currentFolderId });
    toast.success("File deleted successfully");
  }

  const preventEnterAndSubmit = (
    event: React.KeyboardEvent<HTMLHeadingElement>
  ) => {
    if (event.key === "Enter") {
      event.preventDefault(); // Prevent the default line break
      enterPressedRef.current = true;
      handleSubmit(); // Handle submit

      if (nameRef.current) {
        nameRef.current.blur(); // Remove focus from the h2 element
      }
      if (descriptionRef.current) {
        descriptionRef.current.blur(); // Remove focus from the p element
      }
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="h-screen flex items-center justify-center">
          <LoadingSpinner className="h-20 w-20" />
        </div>
      </AppLayout>
    )
  };

  if (error && error.status === 404) {
    return <NotFound />;
  }

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-x-8 gap-y-4 p-4 sm:flex-row sm:items-center sm:m-4">
        <div className="flex space-y-2 justify-between w-full h-12">
          <div className="flex space-x-4 items-center">
            <div className="w-8">
              <Image
                src={`/_icons/dataroom.svg`}
                alt="File icon"
                width={50}
                height={50}
                className=""
              />
            </div>
            <div className="flex flex-col">
              <h2
                className="leading-7 text-2xl text-foreground font-semibold tracking-tight hover:cursor-text"
                ref={nameRef}
                contentEditable={true}
                onFocus={() => setIsEditingName(true)}
                onBlur={handleSubmit}
                onKeyDown={preventEnterAndSubmit}
                title="Click to edit"
                dangerouslySetInnerHTML={{ __html: dataroom?.name || "Loading..." }}
              />
              {isEditingName && (
                <p className="text-sm text-muted-foreground mt-1">
                  {`You are editing the dataroom name. Press <Enter> to save.`}
                </p>
              )}
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground md:w-96 -mr-10"
              ref={descriptionRef}
              contentEditable={true}
              onFocus={() => setIsEditingDescription(true)}
              onBlur={handleSubmit}
              onKeyDown={preventEnterAndSubmit}
              title="Click to edit"
              dangerouslySetInnerHTML={{ __html: dataroom?.description || "Loading..." }}
            />
            {isEditingDescription
              && (
                <p className="text-sm text-muted-foreground mt-1">
                  {`You are editing the dataroom description. Press <Enter> to save.`}
                </p>
              )
            }
          </div>
        </div>
      </div>
      <Separator className="mb-1 bg-gray-200 dark:bg-gray-800" />
      <NavigationBar folderDirectory={folderDirectory} />
      {/* Page */}
      <div className="md:ml-80 mt-8">
        {/* Navigation */}
        <div className="flex" >
          {path && path.map((folderId: string, index: number) => {
            const href = `/datarooms/${dataroom.id}${folderDirectory[folderId].href}`;
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
        {/* Folder Contents */}
        <div className="mt-5">
          {/* Subfolders */}
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
                        setPath((path) => [...path, subfolderId]);
                      }}
                    >
                      <img src="/_icons/folder.svg" alt="Folder Icon" className="w-11 h-11 mr-2" />
                      <span className="mt-3"> {folderDirectory[subfolderId].name}</span>
                    </Link>
                  </div>
                  <div className="text-center sm:text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => setTimeout(() => {
                            setEditObjectMetadata({
                              name: folderDirectory[subfolderId].name,
                              id: subfolderId,
                              parentFolderId: currentFolderId,
                              type: "FOLDER"
                            });
                            setIsEditObjectNameModalOpen(true);
                          }, 0)}
                        >
                          Edit Name
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                          onClick={() =>
                            handleDeleteFolder(subfolderId)
                          }
                        >
                          Delete Folder
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )
            })}
          </div>
          {/* Files */}
          <div>
            {folderDirectory[currentFolderId].files.map((file) => {
              return (
                <div className="flex items-center justify-between border-b p-2" key={file.id}>
                  <div className="flex items-center">
                    <a
                      className="flex"
                      href={file.url}
                      target="_blank"
                    >
                      <img src="/_icons/file.svg" alt="File Icon" className="w-11 h-11 mr-2" />
                      <span className="mt-3">{file.name}</span>
                    </a>
                  </div>
                  {/* Add your Tailwind CSS classes for actions here */}
                  <div className="text-center sm:text-right">
                    <DropdownMenu >
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => setTimeout(() => {
                            setEditObjectMetadata({
                              name: file.name,
                              id: file.id,
                              parentFolderId: currentFolderId,
                              type: "FILE"
                            });
                            setIsEditObjectNameModalOpen(true);
                          }, 0)}
                        >
                          Edit Name
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                          onClick={() =>
                            handleDeleteFile(file.id)
                          }
                        >
                          Delete File
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )
            })}
          </div>
          {/* Edit file/folder name modal */}
          <EditObjectNameModal
            isOpen={isEditObjectNameModalOpen}
            setIsOpen={setIsEditObjectNameModalOpen}
            objectMetadata={editObjectMetadata}
            updateFolderDirectory={updateFolderDirectory}
          />
        </div>
        {/* Add file / Create Folder Modals */}
        <div className="mt-10 sm:ml-0 lg:ml-36 xl:ml-48">
          <AddFolderModal
            updateFolderDirectory={updateFolderDirectory}
            parentFolderId={currentFolderId}
          >
            <button
              type="button"
              className="w-36 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-foreground bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Add Folder
            </button>
          </AddFolderModal>
          <AddFileModal
            updateFolderDirectory={updateFolderDirectory}
            parentFolderId={currentFolderId}
          >
            <button
              type="button"
              className="w-36 flex ml-10 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-foreground bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              <span className="ml-1.5">Add File</span>
            </button>
          </AddFileModal>
        </div>
      </div>
    </AppLayout>
  )
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { params } = context;

  if (!params) {
    // Case where params is undefined
    return {
      props: {
        dataroom: null,
        directory: null,
        initialPath: [],
        initialFolderId: "",
        error: { status: 404, message: 'Not Found' }
      },
    };
  }

  const dataroomId: string = params.dataroomId as string;
  const path: string[] = params.path as string[];
  const session = await getServerSession(context.req, context.res, authOptions);

  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/datarooms/hierarchical-datarooms/${encodeURIComponent(dataroomId)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: JSON.stringify(session),
        }
      },)
    const { dataroom, folderDirectory: directory } = await response.json();

    return {
      props: {
        dataroom,
        directory,
        initialPath: path,
        initialFolderId: path ? path[path.length - 1] : "",
        loading: false,
        error: null,
      },
    };
  } catch (error) {
    return {
      props: {
        dataroom: null,
        directory: null,
        initialPath: [],
        initialFolderId: "",
        loading: false,
        error: { status: 500, message: 'Internal Server Error' },
      },
    };
  }
}
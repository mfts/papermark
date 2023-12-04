import NavigationBar from "@/components/datarooms/hierarchical/create-dataroom/navigation/navigation-bar";
import AppLayout from "@/components/layouts/app";
import Image from "next/image";
import React, { useState, useRef, useReducer } from "react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Dataroom, DataroomFile, DataroomFolder } from "@prisma/client";
import { PlusIcon } from "@heroicons/react/24/solid";
import AddFolderModal from "@/components/datarooms/hierarchical/create-dataroom/add-folder-modal";
import LoadingSpinner from "@/components/ui/loading-spinner";
import NotFound from "@/pages/404";
import { FolderDirectory } from "@/lib/types";
import { GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../../api/auth/[...nextauth]";
import { useRouter } from "next/router";
import AddFileModal from "@/components/datarooms/hierarchical/create-dataroom/add-file-modal";
import { Subfolders } from "@/components/datarooms/hierarchical/create-dataroom/folders/subfolders";
import { Files } from "@/components/datarooms/hierarchical/create-dataroom/files/files";
import { BreadcrumbNavigation } from "@/components/datarooms/hierarchical/create-dataroom/navigation/breadcrumb-navigation";
import { reducer } from "@/components/datarooms/hierarchical/create-dataroom/state-management";
import { useTeam } from "@/context/team-context";

export default function Page({
  dataroom,
  directory,
  initialFolderId,
  initialPath,
  loading,
  error,
}: {
  dataroom: Dataroom;
  directory: FolderDirectory;
  initialFolderId: string;
  initialPath: string[];
  loading: boolean;
  error: { status: 404; message: string };
}) {
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [isEditingDescription, setIsEditingDescription] =
    useState<boolean>(false);
  const [folderDirectory, updateFolderDirectory] = useReducer(
    reducer,
    directory,
  );
  const [currentFolderId, setCurrentFolderId] =
    useState<string>(initialFolderId);
  const [path, setPath] = useState<string[]>(initialPath);
  const router = useRouter();
  const teamInfo = useTeam();
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
    if (
      (nameRef.current && isEditingName) ||
      (descriptionRef.current && isEditingDescription)
    ) {
      const newName = nameRef.current?.innerText;
      const newDescription = descriptionRef.current?.innerText;

      if (
        newName !== dataroom!.name ||
        newDescription !== dataroom!.description
      ) {
        const response = await fetch("/api/datarooms/hierarchical", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: newName,
            description: newDescription,
            id: dataroom.id,
            teamId: teamInfo?.currentTeam?.id,
          }),
        });

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

  const preventEnterAndSubmit = (
    event: React.KeyboardEvent<HTMLHeadingElement>,
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
    );
  }

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
                dangerouslySetInnerHTML={{
                  __html: dataroom?.name || "Loading...",
                }}
              />
              {isEditingName && (
                <p className="text-sm text-muted-foreground mt-1">
                  {`You are editing the dataroom name. Press <Enter> to save.`}
                </p>
              )}
            </div>
          </div>
          <div>
            <p
              className="text-sm text-muted-foreground md:w-96 -mr-10"
              ref={descriptionRef}
              contentEditable={true}
              onFocus={() => setIsEditingDescription(true)}
              onBlur={handleSubmit}
              onKeyDown={preventEnterAndSubmit}
              title="Click to edit"
              dangerouslySetInnerHTML={{
                __html: dataroom?.description || "Loading...",
              }}
            />
            {isEditingDescription && (
              <p className="text-sm text-muted-foreground mt-1">
                {`You are editing the dataroom description. Press <Enter> to save.`}
              </p>
            )}
          </div>
        </div>
      </div>
      <Separator className="mb-1 bg-gray-200 dark:bg-gray-800" />
      <NavigationBar
        folderDirectory={folderDirectory}
        updateFolderDirectory={updateFolderDirectory}
      />
      {/* Page */}
      <div className="md:ml-80 mt-8">
        {/* Breadcrumb Navigation */}
        <BreadcrumbNavigation
          folderDirectory={folderDirectory}
          dataroomId={dataroom.id}
          path={path}
          setPath={setPath}
          setCurrentFolderId={setCurrentFolderId}
        />
        {/* Folder Contents */}
        <div className="mt-5">
          {/* Subfolders */}
          <Subfolders
            folderDirectory={folderDirectory}
            currentFolderId={currentFolderId}
            dataroom={dataroom}
            path={path}
            updateFolderDirectory={updateFolderDirectory}
            setPath={setPath}
            setCurrentFolderId={setCurrentFolderId}
          />
          {/* Files */}
          <Files
            folderDirectory={folderDirectory}
            currentFolderId={currentFolderId}
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
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { params } = context;
  const dataroomId: string = params?.dataroomId as string;
  const path: string[] = params?.path as string[];
  const teamId: string = params?.teamId as string;
  const session = await getServerSession(context.req, context.res, authOptions);

  try {
    const response = await fetch(
      `${
        process.env.NEXTAUTH_URL
      }/api/datarooms/hierarchical?id=${encodeURIComponent(
        dataroomId,
      )}&teamId=${encodeURIComponent(teamId)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: JSON.stringify(session),
        },
      },
    );
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
        error: { status: 500, message: "Internal Server Error" },
      },
    };
  }
}

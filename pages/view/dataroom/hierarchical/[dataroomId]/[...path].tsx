import NavigationBar from "@/components/view/datarooms/hierarchical/navigation-bar";
import AppLayout from "@/components/layouts/app";
import Image from "next/image";
import React, { useState, useRef, useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import { Dataroom } from "@prisma/client";
import LoadingSpinner from "@/components/ui/loading-spinner";
import NotFound from "@/pages/404";
import { FolderDirectory } from "@/lib/types";
import { GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../api/auth/[...nextauth]";
import { useRouter } from "next/router";
import Link from "next/link";
import ChevronRight from "@/components/shared/icons/chevron-right";
import { usePlausible } from "next-plausible";
import { toast } from "sonner";

export default function Page({
  email,
  dataroom,
  directory: folderDirectory,
  initialFolderId,
  initialPath,
  loading,
  error
}: {
  email: string,
  dataroom: Dataroom,
  directory: FolderDirectory,
  initialFolderId: string,
  initialPath: string[],
  loading: boolean,
  error: { status: 404, message: string }
}) {

  const nameRef = useRef<HTMLHeadingElement>(null);
  const descriptionRef = useRef<HTMLHeadingElement>(null);
  const router = useRouter();
  const [currentFolderId, setCurrentFolderId] = useState<string>(initialFolderId);
  const [path, setPath] = useState<string[]>(initialPath);
  const currPath = router.query.path as string[];
  const plausible = usePlausible();

  //Enter view in database
  useEffect(() => {
    (async () => {
      const response = await fetch("/api/datarooms/views", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          dataroomId: dataroom.id,
        }),
      });

      if (response.ok) {
        plausible("dataroomViewed"); // track the event
      } else {
        const { message } = await response.json();
        toast.error(message);
      }
    })();
  }, []);

  //In cases when user presses back in browser
  if (currPath && currPath[currPath.length - 1] !== path[path.length - 1]) {
    setPath(currPath);
    setCurrentFolderId(currPath[currPath.length - 1]);
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="h-screen flex items-center justify-center">
          <LoadingSpinner className="h-20 w-20" />
        </div>
      </AppLayout>
    )
  };

  if (error) {
    if (error.status === 404) {
      return <NotFound />;
    } else if (error.status === 401) {
      return (
        <div className="min-h-screen pt-16 pb-12 flex flex-col">
          <main className="flex-grow flex flex-col justify-center max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-16">
              <div className="text-center">
                <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">
                  401 error
                </p>
                <h1 className="mt-2 text-4xl font-extrabold text-gray-100 tracking-tight sm:text-5xl">
                  Unauthorized access
                </h1>
                <p className="mt-2 text-base text-gray-600">
                  You are not authorized to access this dataroom. Please contact the owner
                </p>
              </div>
            </div>
          </main>
        </div>
      )
    }
  }

  return (
    <div>
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
                title="Dataroom Name"
                dangerouslySetInnerHTML={{ __html: dataroom?.name || "Loading..." }}
              />
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground md:w-96 -mr-10"
              ref={descriptionRef}
              title="Dataroom Description"
              dangerouslySetInnerHTML={{ __html: dataroom?.description || "Loading..." }}
            />
          </div>
        </div>
      </div>
      <Separator className="mb-1 bg-gray-200 dark:bg-gray-800" />
      <NavigationBar
        folderDirectory={folderDirectory}
      />
      {/* Page */}
      <div className="md:ml-80 mt-8">
        {/* Breadcrumb Navigation */}
        <div className="flex" >
          {path && path.map((folderId: string, index: number) => {
            const href = `/view/dataroom/hierarchical/${dataroom.id}${folderDirectory[folderId].href}`;
            return (
              <React.Fragment key={index}>
                {index > 0 &&
                  <div className="mt-2 mr-1 ml-1"><ChevronRight /></div>}
                <Link
                  className="text-muted-foreground hover:text-foreground underline"
                  href={`/view/dataroom/hierarchical/[dataroomId]/[...path]`}
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
                      href={`/view/dataroom/hierarchical/[dataroomId]/[...path]`}
                      as={`/view/dataroom/hierarchical/${dataroom.id}/${path.join('/')}/${subfolderId}`}
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
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { params, query } = context;
  const dataroomId: string = params?.dataroomId as string;
  const path: string[] = params?.path as string[];
  const authenticationCode: string = query.authenticationCode as string;
  const email = query.email as string;

  //Check if user is authorized
  const response = await fetch(`${process.env.NEXTAUTH_URL}/api/verification/email-authcode?authenticationCode=${authenticationCode}&identifier=${dataroomId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })

  if (!response.ok) {
    return {
      props: {
        email: "",
        dataroom: null,
        directory: null,
        initialPath: [],
        initialFolderId: "",
        loading: false,
        error: { status: 401, message: 'Unauthorized access' },
      }
    };
  }

  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/datarooms/hierarchical?id=${encodeURIComponent(dataroomId)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      },)
    const { dataroom, folderDirectory: directory } = await response.json();

    return {
      props: {
        email,
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
        email: "",
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
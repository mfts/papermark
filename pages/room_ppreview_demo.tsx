import { useRouter } from "next/router";

import { ViewFolderTree } from "@/components/datarooms/folders";
import DocumentCard from "@/components/view/dataroom/document-card";
import FolderCard from "@/components/view/dataroom/folder-card";

import { DEFAULT_BANNER_IMAGE } from "@/lib/utils";

export default function ViewPage() {
  const router = useRouter();
  const { brandLogo, brandColor, brandBanner } = router.query as {
    brandLogo: string;
    brandColor: string;
    brandBanner: string;
  };

  return (
    <div className="bg-white">
      {/* Nav */}
      <nav
        className="bg-black"
        style={{
          backgroundColor: brandColor,
        }}
      >
        <div className="mx-auto px-2 sm:px-6 lg:px-8">
          <div className="relative flex h-16 items-center justify-between">
            <div className="flex flex-1 items-center justify-start">
              <div className="relative flex h-16 w-36 flex-shrink-0 items-center">
                {brandLogo ? (
                  <img
                    className="h-16 w-36 object-contain"
                    src={brandLogo}
                    alt="Logo"
                  />
                ) : (
                  <div className="text-2xl font-bold tracking-tighter text-white">
                    Papermark
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Banner section */}
        <div className="relative h-[30vh]">
          <img
            className="h-[30vh] w-full object-cover"
            src={brandBanner || DEFAULT_BANNER_IMAGE}
            alt="Banner"
            width={1920}
            height={320}
          />
          <div className="absolute bottom-5 w-fit rounded-r-md bg-white/30 backdrop-blur-md">
            <div className="px-5 py-2 sm:px-10">
              <div className="text-3xl">Example Data Room</div>
              <time className="text-sm">Last updated 2 hours ago</time>
            </div>
          </div>
        </div>
      </nav>

      {/* Body */}
      <div style={{ height: "calc(100vh - 64px)" }} className="relative flex">
        {/* Tree view */}
        <div className="hidden h-full w-1/4 space-y-8 overflow-auto px-3 pb-4 pt-4 md:flex md:px-6 md:pt-6 lg:px-8 lg:pt-9 xl:px-14">
          <ViewFolderTree
            folders={[
              {
                id: "1",
                name: "Marketing",
                parentId: null,
                dataroomId: "1",
                orderIndex: 0,
                path: "/",
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              {
                id: "2",
                name: "Sales",
                parentId: null,
                dataroomId: "1",
                orderIndex: 1,
                path: "/",
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ]}
            documents={[
              {
                id: "1",
                name: "Q4 Report.pdf",
                dataroomDocumentId: "1",
                folderId: null,
                versions: [
                  {
                    id: "1",
                    versionNumber: 1,
                    hasPages: true,
                  },
                ],
              },
            ]}
            setFolderId={() => {}}
            folderId={null}
          />
        </div>

        {/* Detail view */}
        <div className="flex-grow overflow-auto">
          <div className="h-full space-y-8 px-3 pb-4 pt-4 md:px-6 md:pt-6 lg:px-8 lg:pt-9 xl:px-14">
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">Home</div>
              <ul className="grid gap-4">
                <li key="1">
                  <FolderCard
                    folder={{
                      id: "1",
                      name: "Marketing",
                      parentId: null,
                      dataroomId: "1",
                      orderIndex: 0,
                      path: "/",
                      createdAt: new Date(),
                      updatedAt: new Date(),
                    }}
                    dataroomId="1"
                    setFolderId={() => {}}
                    isPreview={false}
                    linkId="1"
                    allowDownload={false}
                  />
                </li>

                <li key="2">
                  <FolderCard
                    folder={{
                      id: "2",
                      name: "Sales",
                      parentId: null,
                      dataroomId: "1",
                      orderIndex: 1,
                      path: "/",
                      createdAt: new Date(),
                      updatedAt: new Date(),
                    }}
                    dataroomId="1"
                    setFolderId={() => {}}
                    isPreview={false}
                    linkId="1"
                    allowDownload={false}
                  />
                </li>

                <li key="3">
                  <DocumentCard
                    document={{
                      id: "1",
                      name: "Q4 Report.pdf",
                      dataroomDocumentId: "1",
                      downloadOnly: false,
                      canDownload: false,
                      versions: [
                        {
                          id: "1",
                          type: "pdf",
                          versionNumber: 1,
                          hasPages: true,
                          isVertical: true,
                          updatedAt: new Date(),
                        },
                      ],
                    }}
                    linkId="1"
                    isPreview={false}
                    allowDownload={false}
                  />
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
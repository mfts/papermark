import { useRouter } from "next/router";

import { useEffect, useState } from "react";

import { LimitProps } from "@/ee/limits/swr-handler";
import { Brand, DataroomBrand, Document } from "@prisma/client";
import { format } from "date-fns";
import { PlusIcon } from "lucide-react";

import { EmptyDocuments } from "@/components/documents/empty-document";
import { Button } from "@/components/ui/button";
import { UploadNotificationDrawer } from "@/components/upload-notification";
import UploadZoneFileRequest from "@/components/upload-zone-fileRequest";

import { isPlanTrial } from "@/lib/swr/use-billing";
import { LinkWithRequestFile } from "@/lib/types";
import { fileIcon } from "@/lib/utils/get-file-icon";

import Nav from "../nav";
import { FileRequestUploadModal } from "./upload";
import { PoweredBy } from "../powered-by";

interface FileRequestViewerProps {
  linkId: string;
  viewId?: string;
  viewerId: string;
  brand?: Partial<Brand> | Partial<DataroomBrand> | null;
  isPreview?: boolean;
  link: LinkWithRequestFile;
  document: Document[];
  limits: LimitProps | null;
}

const DocumentGrid = ({ documents }: { documents: Document[] }) => (
  <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {documents.map((doc) => (
      <div
        key={doc.id}
        className="group relative flex flex-col rounded-lg border bg-white p-4 shadow-sm transition-all hover:shadow-md dark:bg-gray-800"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {fileIcon({
              fileType: doc.type ?? "",
              className: "h-10 w-10",
              isLight: true,
            })}
            <div className="flex flex-col">
              <h3 className="max-w-[200px] truncate text-sm font-medium">
                {doc.name}
              </h3>
              <p className="text-xs text-gray-500">
                {format(new Date(doc.createdAt), "MMM d, yyyy hh:mm a")}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <span>{doc.type?.toUpperCase()}</span>
          {doc.numPages && <span>{doc.numPages} pages</span>}
        </div>
      </div>
    ))}
  </div>
);

export default function FileRequestViewer({
  linkId,
  viewId,
  viewerId,
  brand,
  isPreview,
  link,
  document: initialDocuments,
  limits,
}: FileRequestViewerProps) {
  const router = useRouter();
  const [showUploadFile, setShowUploadFile] = useState(false);
  const [documents, setDocuments] = useState<Document[]>(
    initialDocuments || [],
  );

  const [uploads, setUploads] = useState<
    { fileName: string; progress: number; documentId?: string }[]
  >([]);
  const [rejectedFiles, setRejectedFiles] = useState<
    { fileName: string; message: string }[]
  >([]);
  const [showDrawer, setShowDrawer] = useState<boolean>(false);

  const handleNewDocument = (newDocument: Document) => {
    setDocuments((prev) => [newDocument, ...prev]);
  };
  const handleCloseDrawer = () => {
    setShowDrawer(false);
  };

  const isDataroomFolder = link.uploadDataroomFolderId;
  const isFolder = link.uploadFolderId;

  // get the current folder path
  const currentFolderPath = isDataroomFolder
    ? link.dataroomFolder.path.split("/")
    : isFolder
      ? link.folder.path.split("/")
      : [];

  useEffect(() => {
    // Remove token and email query parameters on component mount
    const removeQueryParams = () => {
      const currentQuery = { ...router.query };
      const currentPath = router.asPath.split("?")[0];
      const paramsToRemove = ["token", "email", "domain", "slug", "linkId"];

      paramsToRemove.forEach((param) => delete currentQuery[param]);

      router.replace(
        {
          pathname: currentPath,
          query: currentQuery,
        },
        undefined,
        { shallow: true },
      );
    };

    if (router.query.token) {
      removeQueryParams();
    }
  }, [router]);

  const UploadSection = () => (
    <>
      <div className="flex items-center justify-center">
        <EmptyDocuments
          title="No documents uploaded"
          description="Upload a document to the document request."
        />
      </div>
      <FileRequestUploadModal
        viewId={viewId}
        limits={limits}
        openModal={showUploadFile}
        setAddDocumentModalOpen={setShowUploadFile}
        link={link}
        viewerId={viewerId}
        onUploadSuccess={handleNewDocument}
        currentFolderPath={currentFolderPath}
        isFolder={!!isFolder}
        isDataroomFolder={!!isDataroomFolder}
        remainingFileSize={
          link.maxFiles ? link.maxFiles - documents.length : 0
        }
      >
        <Button title="Upload File" type="button">
          <PlusIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span>Upload Document</span>
        </Button>
      </FileRequestUploadModal>
    </>
  );

  return (
    <>
      <Nav
        brand={brand}
        viewId={viewId}
        linkId={linkId}
        isPreview={isPreview}
      />
      <div className="min-h-[calc(100dvh-64px)] bg-gray-50 p-6 dark:bg-gray-900">
        <UploadZoneFileRequest
          folderPathName={currentFolderPath}
          onUploadStart={(newUploads) => {
            setUploads(newUploads);
            setShowDrawer(true);
          }}
          onUploadProgress={(index, progress, documentId) => {
            setUploads((prevUploads) =>
              prevUploads.map((upload, i) =>
                i === index ? { ...upload, progress, documentId } : upload,
              ),
            );
          }}
          onUploadSuccess={(document) => {
            setDocuments((prev: Document[]) => [...prev, ...document]);
          }}
          onUploadRejected={(rejected) => {
            setRejectedFiles(rejected);
            setShowDrawer(true);
          }}
          setUploads={setUploads}
          setRejectedFiles={setRejectedFiles}
          wrapperClassName="min-h-[calc(100dvh-112px)]"
          teamPlan={link.team.plan}
          isTeamTrial={isPlanTrial(link.team.plan)}
          teamId={link.teamId}
          remainingFileLength={
            link.maxFiles ? link.maxFiles - documents.length : 0
          }
          limits={limits}
          link={link}
          viewerId={viewerId}
          viewId={viewId}
        >
          <div className="mx-auto max-w-7xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Uploaded Documents</h1>
                <p className="text-sm text-gray-500">
                  {documents.length} document{documents.length !== 1 ? "s" : ""}{" "}
                  uploaded by you • Max {link.maxFiles} document
                  {link.maxFiles !== 1 ? "s" : ""} can be uploaded
                </p>
              </div>
              {link.maxFiles && link.maxFiles > documents.length ? (
                <FileRequestUploadModal
                  limits={limits}
                  openModal={showUploadFile}
                  setAddDocumentModalOpen={setShowUploadFile}
                  link={link}
                  viewerId={viewerId}
                  onUploadSuccess={handleNewDocument}
                  remainingFileSize={
                    link.maxFiles ? link.maxFiles - documents.length : 0
                  }
                  currentFolderPath={currentFolderPath}
                  isFolder={!!isFolder}
                  viewId={viewId}
                  isDataroomFolder={!!isDataroomFolder}
                >
                  <Button className="flex items-center gap-2">
                    <PlusIcon className="h-5 w-5" />
                    Upload Document
                  </Button>
                </FileRequestUploadModal>
              ) : null}
            </div>

            {documents.length ? (
              <DocumentGrid documents={documents} />
            ) : (
              <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
                <UploadSection />
              </div>
            )}
          </div>
        </UploadZoneFileRequest>
        {showDrawer ? (
          <UploadNotificationDrawer
            open={showDrawer}
            onOpenChange={setShowDrawer}
            uploads={uploads}
            handleCloseDrawer={handleCloseDrawer}
            setUploads={setUploads}
            rejectedFiles={rejectedFiles}
            setRejectedFiles={setRejectedFiles}
          />
        ) : null}
      </div>
    </>
  );
}

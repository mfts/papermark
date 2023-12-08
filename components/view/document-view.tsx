import React, { useEffect, useRef, useState } from "react";
import AccessForm, {
  DEFAULT_ACCESS_FORM_DATA,
  DEFAULT_ACCESS_FORM_TYPE,
} from "@/components/view/access-form";
import { usePlausible } from "next-plausible";
import { toast } from "sonner";
import { LinkWithDocument } from "@/lib/types";
import LoadingSpinner from "@/components/ui/loading-spinner";
import PagesViewer from "@/components/view/PagesViewer";
import PDFViewer from "@/components/view/PDFViewer";
import { NotionPage } from "../NotionPage";
import { ExtendedRecordMap } from "notion-types";

export type DEFAULT_DOCUMENT_VIEW_TYPE = {
  viewId: string;
  file: string | null;
  pages: { file: string; pageNumber: string }[] | null;
};

export default function DocumentView({
  link,
  userEmail,
  userId,
  isProtected,
  notionData,
}: {
  link: LinkWithDocument;
  userEmail: string | null | undefined;
  userId: string | null | undefined;
  isProtected: boolean;
  notionData?: {
    rootNotionPageId: string | null;
    recordMap: ExtendedRecordMap | null;
  };
}) {
  const { document, emailProtected, password: linkPassword } = link;

  const plausible = usePlausible();

  const didMount = useRef<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [viewData, setViewData] = useState<DEFAULT_DOCUMENT_VIEW_TYPE>({
    viewId: "",
    file: null,
    pages: null,
  });
  const [data, setData] = useState<DEFAULT_ACCESS_FORM_TYPE>(
    DEFAULT_ACCESS_FORM_DATA,
  );

  const handleSubmission = async (): Promise<void> => {
    setIsLoading(true);
    const response = await fetch("/api/views", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...data,
        email: data.email || userEmail,
        linkId: link.id,
        documentId: document.id,
        userId: userId || null,
        documentVersionId: document.versions[0].id || null,
        hasPages: document.versions[0].hasPages || null,
      }),
    });

    if (response.ok) {
      const { viewId, file, pages } =
        (await response.json()) as DEFAULT_DOCUMENT_VIEW_TYPE;
      plausible("documentViewed"); // track the event
      setViewData({ viewId, file, pages });
      setSubmitted(true);
      setIsLoading(false);
    } else {
      const { message } = await response.json();
      toast.error(message);
      setIsLoading(false);
    }
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (
    event: React.FormEvent,
  ): Promise<void> => {
    event.preventDefault();
    await handleSubmission();
  };

  // If link is not submitted and does not have email / password protection, show the access form
  useEffect(() => {
    if (!didMount.current) {
      if (!submitted && !isProtected) {
        handleSubmission();
      }
      didMount.current = true;
    }
  }, [submitted, isProtected]);

  // If link is not submitted and does not have email / password protection, show the access form
  if (!submitted && isProtected) {
    console.log("calling access form");
    return (
      <AccessForm
        data={data}
        email={userEmail}
        setData={setData}
        onSubmitHandler={handleSubmit}
        requireEmail={emailProtected}
        requirePassword={!!linkPassword}
        isLoading={isLoading}
      />
    );
  }

  if (isLoading) {
    console.log("loading");
    return (
      <div className="h-screen flex items-center justify-center">
        <LoadingSpinner className="h-20 w-20" />
      </div>
    );
  }

  return (
    <div className="bg-gray-950">
      {submitted ? (
        notionData && notionData.recordMap ? (
          <NotionPage
            recordMap={notionData.recordMap}
            // rootPageId={notionData.rootNotionPageId}
            viewId={viewData.viewId}
            linkId={link.id}
            documentId={document.id}
            versionNumber={document.versions[0].versionNumber}
          />
        ) : viewData.pages ? (
          <PagesViewer
            pages={viewData.pages}
            viewId={viewData.viewId}
            linkId={link.id}
            documentId={document.id}
            assistantEnabled={document.assistantEnabled}
            versionNumber={document.versions[0].versionNumber}
          />
        ) : (
          <PDFViewer
            file={viewData.file}
            viewId={viewData.viewId}
            linkId={link.id}
            documentId={document.id}
            name={document.name}
            allowDownload={link.allowDownload}
            assistantEnabled={document.assistantEnabled}
            versionNumber={document.versions[0].versionNumber}
          />
        )
      ) : (
        <div className="h-screen flex items-center justify-center">
          <LoadingSpinner className="h-20 w-20" />
        </div>
      )}
    </div>
  );
}

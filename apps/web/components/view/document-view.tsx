import React, { useEffect, useRef, useState } from "react";
import ErrorPage from "next/error";
import { useSession } from "next-auth/react";
import { usePlausible } from "next-plausible";
import { toast } from "sonner";
import { LinkWithDocument } from "@/lib/types";
import PagesViewer from "@/components/PagesViewer";
import PDFViewer from "@/components/PDFViewer";
import AccessForm from "@/components/view/access-form";
import LoadingSpinner from "../ui/loading-spinner";

export const DEFAULT_ACCESS_FORM_DATA = {
  email: null,
  password: null,
};

export type DEFAULT_ACCESS_FORM_TYPE = {
  email: string | null;
  password: string | null;
};

export type DEFAULT_DOCUMENT_VIEW_TYPE = {
  viewId: string;
  file: string | null;
  pages: { file: string; pageNumber: string }[] | null;
};

export default function DocumentView({
  link,
  error,
}: {
  link: LinkWithDocument;
  error: any;
}) {
  const { data: session } = useSession();
  const plausible = usePlausible();

  const [submitted, setSubmitted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const hasInitiatedSubmit = useRef(false);
  const [viewData, setViewData] = useState<DEFAULT_DOCUMENT_VIEW_TYPE>({
    viewId: "",
    file: null,
    pages: null,
  });

  const [data, setData] = useState<DEFAULT_ACCESS_FORM_TYPE>(
    DEFAULT_ACCESS_FORM_DATA
  );

  useEffect(() => {
    const userEmail = session?.user?.email;
    if (userEmail) {
      setData((prevData) => ({
        ...prevData,
        email: userEmail || prevData.email,
      }));
    }
  }, [session]);

  if (error && error.status === 404) {
    return <ErrorPage statusCode={404} />;
  }

  if (!link) {
    return <LoadingSpinner className="mr-1 h-5 w-5" />;
  }

  const { document, expiresAt, emailProtected, password: linkPassword } = link;

  // Check if link is expired
  const isExpired = expiresAt && new Date(expiresAt) < new Date();
  if (isExpired) {
    return <div>Link is expired</div>;
  }

  const handleSubmission = async () => {
    setIsLoading(true);
    const response = await fetch("/api/views", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...data,
        linkId: link.id,
        documentId: document.id,
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
    event: React.FormEvent
  ) => {
    event.preventDefault();
    await handleSubmission();
  };

  if ((!submitted && emailProtected) || (!submitted && linkPassword)) {
    return (
      <AccessForm
        onSubmitHandler={handleSubmit}
        data={data}
        setData={setData}
        requireEmail={emailProtected}
        requirePassword={!!linkPassword}
        isLoading={isLoading}
      />
    );
  }

  if (
    !emailProtected &&
    !linkPassword &&
    !submitted &&
    !hasInitiatedSubmit.current
  ) {
    hasInitiatedSubmit.current = true;
    handleSubmission();
  }

  return (
    <div className="bg-gray-950">
      {viewData.pages ? (
        <PagesViewer
          pages={viewData.pages}
          viewId={viewData.viewId}
          linkId={link.id}
          documentId={document.id}
        />
      ) : (
        <PDFViewer
          file={viewData.file}
          viewId={viewData.viewId}
          linkId={link.id}
          documentId={document.id}
          name={document.name}
          allowDownload={link.allowDownload}
        />
      )}
    </div>
  );
}

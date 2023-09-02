import React, { useEffect, useRef, useState } from "react";
import { getExtension } from "@/lib/utils";
import ErrorPage from "next/error";
import PDFViewer from "@/components/PDFViewer";
import AccessForm from "@/components/view/access-form";
import { useSession } from "next-auth/react";
import { usePlausible } from "next-plausible";
import { toast } from "sonner";
import { LinkWithDocument } from "@/lib/types";

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
  file: string;
};

export default function DocumentView({ link, error }: { link: LinkWithDocument; error: any }) {
  const { data: session } = useSession();
  const plausible = usePlausible();

  const [submitted, setSubmitted] = useState<boolean>(false);
  // const [viewId, setViewId] = useState<string>("");
  const hasInitiatedSubmit = useRef(false);
  const [viewData, setViewData] = useState<DEFAULT_DOCUMENT_VIEW_TYPE>({
    viewId: "",
    file: "",
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
    return <div>Loading...</div>;
  }

  const { document, expiresAt, emailProtected, password: linkPassword } = link;

  // Check if link is expired
  const isExpired = expiresAt && new Date(expiresAt) < new Date();
  if (isExpired) {
    return <div>Link is expired</div>;
  }

  const handleSubmission = async () => {
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
      const { viewId, file } = (await response.json()) as {
        viewId: string;
        file: string;
      };
      plausible("documentViewed"); // track the event
      setViewData({ viewId, file });
      setSubmitted(true);
    } else {
      const { message } = await response.json();
      toast.error(message);
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

  // get the file extension
  const extension = getExtension(viewData.file);

  if (
    extension.includes(".docx") ||
    extension.includes(".pptx") ||
    extension.includes(".xlsx") ||
    extension.includes(".xls") ||
    extension.includes(".doc") ||
    extension.includes(".ppt")
  ) {
    return (
      <div className="h-screen bg-gray-900">
        <iframe
          className="w-full h-full"
          src={`https://view.officeapps.live.com/op/embed.aspx?src=${viewData.file}`}
        ></iframe>
      </div>
    );
  }

  if (
    extension.includes(".png") ||
    extension.includes(".jpeg") ||
    extension.includes(".gif") ||
    extension.includes(".jpg")
  ) {
    return (
      <div className="h-screen bg-gray-900">
        <img className="w-full h-full" src={viewData.file} />
      </div>
    );
  }
  return (
    <div className="bg-gray-950">
      <PDFViewer
        file={viewData.file}
        viewId={viewData.viewId}
        linkId={link.id}
        documentId={document.id}
      />
    </div>
  );
}

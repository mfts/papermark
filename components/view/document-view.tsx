import React, { useEffect, useRef, useState } from "react";
import ErrorPage from "next/error";
import PDFViewer from "@/components/PDFViewer";
import AccessForm from "@/components/view/access-form";
import { useSession } from "next-auth/react";
import { usePlausible } from "next-plausible";
import { toast } from "sonner";
import { LinkWithDocument } from "@/lib/types";
import LoadingSpinner from "../ui/loading-spinner";
import PagesViewer from "@/components/PagesViewer";
import EmailVerificationMessage from "./email-verification-form";

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
  authenticationCode
}: {
  link: LinkWithDocument;
  error: any;
  authenticationCode: string | undefined;
}) {
  const { data: session } = useSession();
  const plausible = usePlausible();

  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(false);
  const [verificationRequested, setVerificationRequested] = useState<boolean>(false);
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
        email: session?.user?.email,
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
    await handleEmailVerification();
  };

  //Generates verification link from backend
  const handleEmailVerification = async () => {
    setIsLoading(true);
    const URL = `/api/documents/verification/email_authcode`;
    const response = await fetch(URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body : JSON.stringify({linkId : link.id, email: data.email})
    });
    if (response.ok) {
      setVerificationRequested(true);
      setIsLoading(false);
      return true;
    } else {
      setIsLoading(false);
      return false;
    }
  }

  //Verifies authentication code
  const handleAuthCodeVerification = async () => {
    setIsLoading(true);
    const URL = `/api/documents/verification/email_authcode?authenticationCode=${authenticationCode}`;
    const response = await fetch(URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      }
    });
    if (response.ok) {
      setIsEmailVerified(true);
      setVerificationRequested(false);
      await handleSubmission();
      return true;
    } else {
      setIsLoading(false);
      return false;
    }
  }

  //If URL contains authenticationCode
  if (authenticationCode) {
    useEffect(()=>{
      (async () => {
        setIsLoading(true);
        await handleAuthCodeVerification();
      })();
    },[])

    //Component to render if Loading
    if (isLoading) {
      return (
        <div className="h-screen flex items-center justify-center">
          <LoadingSpinner className="mr-1 h-20 w-20" />
        </div>
      )
    }

    //Component to render when verification code is invalid
    if (!isEmailVerified) {
      return (
        <div className="flex h-screen flex-1 flex-col  px-6 py-12 lg:px-8 bg-black">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <h2 className="mt-10 text-2xl font-bold leading-9 tracking-tight text-white">
              Unauthorized access
            </h2>
          </div>
        </div>
      ) 
    }
  }

  //Components to render when email is submitted but verification is pending
  if (verificationRequested) {
    return (
      <EmailVerificationMessage 
        onSubmitHandler={handleSubmit}
        data={data}
        isLoading={isLoading}
      />
    ) 
  }

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
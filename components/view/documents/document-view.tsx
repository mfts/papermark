import React, { useEffect, useRef, useState } from "react";
import PDFViewer from "@/components/PDFViewer";
import AccessForm, { DEFAULT_ACCESS_FORM_DATA, DEFAULT_ACCESS_FORM_TYPE } from "@/components/view/access-form";
import { usePlausible } from "next-plausible";
import { toast } from "sonner";
import { LinkWithDocument } from "@/lib/types";
import LoadingSpinner from "../../ui/loading-spinner";
import PagesViewer from "@/components/PagesViewer";
import EmailVerificationMessage from "../email-verification-form";
import ViewData from "./view-data";

export type DEFAULT_DOCUMENT_VIEW_TYPE = {
  viewId: string;
  file: string | null;
  pages: { file: string; pageNumber: string }[] | null;
};

export default function DocumentView({
  link,
  userEmail,
  isProtected,
  authenticationCode
}: {
  link: LinkWithDocument;
  authenticationCode: string | undefined;
  userEmail: string | null | undefined;
  isProtected: boolean;
}) {
  const { document, emailProtected, password: linkPassword } = link;

  const plausible = usePlausible();

  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(false);
  const [verificationRequested, setVerificationRequested] = useState<boolean>(false);
  const didMount = useRef<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [viewData, setViewData] = useState<DEFAULT_DOCUMENT_VIEW_TYPE>({
    viewId: "",
    file: null,
    pages: null,
  });
  const [data, setData] = useState<DEFAULT_ACCESS_FORM_TYPE>(
    DEFAULT_ACCESS_FORM_DATA
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
  ): Promise<void> => {
    event.preventDefault();
    await handleEmailVerification();
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

  //Generates verification link from backend
  const handleEmailVerification = async () => {
    setIsLoading(true);
    const URL = `/api/verification/email-authcode`;
    const response = await fetch(URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body : JSON.stringify({identifier : link.id, type: "DOCUMENT", email: data.email})
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
    const URL = `/api/verification/email-authcode?authenticationCode=${authenticationCode}&identifier=${document.id}`;
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
  //P.S: We can create separate component for links with authentication code
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

    return (
      <div className="bg-gray-950">
        <ViewData link={link} viewData={viewData}/>
      </div>
    );
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
        <ViewData link={link} viewData={viewData}/>
      ) : (
        <div className="h-screen flex items-center justify-center">
          <LoadingSpinner className="h-20 w-20" />
        </div>
      )}
    </div>
  );
}
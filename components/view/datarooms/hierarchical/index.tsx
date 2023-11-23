import React, { useEffect, useRef, useState } from "react";
import AccessForm, { DEFAULT_ACCESS_FORM_DATA, DEFAULT_ACCESS_FORM_TYPE } from "@/components/view/access-form";
import { usePlausible } from "next-plausible";
import { toast } from "sonner";
import LoadingSpinner from "../../../ui/loading-spinner";
import EmailVerificationMessage from "../../email-verification-form";
import { Dataroom } from "@prisma/client";
import ViewSinglePagedDataroom from "../paged/view-single-paged-dataroom";

export type DEFAULT_DATAROOM_VIEW_TYPE = {
  viewId: string;
};

export default function HierarchicalDataroomView({
  dataroom,
  userEmail,
  isProtected,
  authenticationCode
}: {
  dataroom: Dataroom;
  authenticationCode: string | undefined;
  userEmail: string | null | undefined;
  isProtected: boolean;
}) {
  const {
    id: dataroomId,
    emailProtected,
    password: dataroomPassword,
  } = dataroom;

  const plausible = usePlausible();

  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(false);
  const [verificationRequested, setVerificationRequested] = useState<boolean>(false);
  const didMount = useRef<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [viewData, setViewData] = useState<DEFAULT_DATAROOM_VIEW_TYPE>({
    viewId: "",
  });
  const [data, setData] = useState<DEFAULT_ACCESS_FORM_TYPE>(
    DEFAULT_ACCESS_FORM_DATA
  );

  const handleSubmission = async (): Promise<void> => {
    setIsLoading(true);
    const response = await fetch("/api/datarooms/paged/views", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...data,
        email: data.email || userEmail,
        dataroomId: dataroomId
      }),
    });

    if (response.ok) {
      const { viewId } =
        (await response.json()) as DEFAULT_DATAROOM_VIEW_TYPE;
      plausible("dataroomViewed"); // track the event
      setViewData({ viewId });
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
      body: JSON.stringify({ identifier: dataroomId, type: "HIERARCHICAL DATAROOM", email: data.email })
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

  //Component to render when email is submitted but verification is pending
  if (verificationRequested) {
    return (
      <EmailVerificationMessage
        onSubmitHandler={handleSubmit}
        data={data}
        isLoading={isLoading}
      />
    )
  }

  if ((!submitted && emailProtected) || (!submitted && dataroomPassword)) {

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
          requirePassword={!!dataroomPassword}
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
  }
}
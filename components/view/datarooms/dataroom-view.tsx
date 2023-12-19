import React, { useEffect, useRef, useState } from "react";
import AccessForm, {
  DEFAULT_ACCESS_FORM_DATA,
  DEFAULT_ACCESS_FORM_TYPE,
} from "@/components/view/access-form";
import { usePlausible } from "next-plausible";
import { toast } from "sonner";
import LoadingSpinner from "../../ui/loading-spinner";
import EmailVerificationMessage from "../email-verification-form";
import ViewSinglePagedDataroom from "./paged/view-single-paged-dataroom";
import { DataroomWithFiles } from "@/lib/types";
import { useRouter } from "next/router";

export default function DataroomView({
  dataroom,
  userEmail,
  isProtected,
  authenticationCode,
}: {
  dataroom: DataroomWithFiles;
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
  const [verificationRequested, setVerificationRequested] =
    useState<boolean>(false);
  const didMount = useRef<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [data, setData] = useState<DEFAULT_ACCESS_FORM_TYPE>(
    DEFAULT_ACCESS_FORM_DATA,
  );
  const router = useRouter();

  const handleSubmission = async (): Promise<void> => {
    if (!isLoading) {
      setIsLoading(true);
    }
    const response = await fetch("/api/datarooms/views", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...data,
        email: data.email || userEmail,
        dataroomId: dataroomId,
        password: data.password,
      }),
    });

    if (response.ok) {
      plausible("dataroomViewed"); // track the event
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
      body: JSON.stringify({
        identifier: dataroomId,
        type:
          dataroom.type === "PAGED"
            ? "PAGED DATAROOM"
            : "HIERARCHICAL DATAROOM",
        email: data.email,
        password: data.password,
        emailProtected: dataroom.emailProtected,
      }),
    });
    if (response.ok) {
      //If only password protected and response is ok concludes password is verified
      if (!dataroom.emailProtected && dataroom.password) {
        if (dataroom.type === "PAGED") {
          await handleSubmission();
        } else {
          const { URL } = await response.json();
          router.push(URL);
        }
      } else {
        setVerificationRequested(true);
      }
      setIsLoading(false);
      return true;
    } else {
      setIsLoading(false);
      return false;
    }
  };

  //Verifies authentication code
  const handleAuthCodeVerification = async () => {
    setIsLoading(true);
    const URL = `/api/verification/email-authcode?authenticationCode=${authenticationCode}&identifier=${dataroom.id}`;
    const response = await fetch(URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.ok) {
      setIsEmailVerified(true);
      setVerificationRequested(false);
      await handleSubmission();
    } else {
      setIsLoading(false);
    }
  };

  //If URL contains authenticationCode
  if (authenticationCode) {
    useEffect(() => {
      (async () => {
        await handleAuthCodeVerification();
      })();
    }, []);

    //Component to render if Loading
    if (isLoading) {
      return (
        <div className="h-screen flex items-center justify-center">
          <LoadingSpinner className="mr-1 h-20 w-20" />
        </div>
      );
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
      );
    }

    return (
      <div className="bg-gray-950">
        <ViewSinglePagedDataroom dataroom={dataroom} />
      </div>
    );
  }

  //Component to render when email is submitted but verification is pending
  if (verificationRequested) {
    return (
      <EmailVerificationMessage
        onSubmitHandler={handleSubmit}
        data={data}
        isLoading={isLoading}
      />
    );
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

  return (
    <div className="bg-gray-950">
      {submitted ? (
        <ViewSinglePagedDataroom dataroom={dataroom} />
      ) : (
        <div className="h-screen flex items-center justify-center">
          <LoadingSpinner className="h-20 w-20" />
        </div>
      )}
    </div>
  );
}

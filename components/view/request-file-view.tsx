import { useRouter } from "next/router";

import React, { useEffect, useRef, useState } from "react";

import { LimitProps } from "@/ee/limits/swr-handler";
import { Brand, Document } from "@prisma/client";
import Cookies from "js-cookie";
import { usePlausible } from "next-plausible";
import { toast } from "sonner";

import LoadingSpinner from "@/components/ui/loading-spinner";
import AccessForm, {
  DEFAULT_ACCESS_FORM_DATA,
  DEFAULT_ACCESS_FORM_TYPE,
} from "@/components/view/access-form";

import { useAnalytics } from "@/lib/analytics";
import {
  LinkWithDocument,
  LinkWithRequestFile,
  NotionTheme,
  WatermarkConfig,
} from "@/lib/types";

import EmailVerificationMessage from "./email-verification-form";
import FileRequestViewer from "./fileRequest/views";

export type DEFAULT_FILE_REQUEST_VIEW_TYPE = {
  viewId?: string;
  isPreview?: boolean;
  ipAddress?: string;
  verificationToken?: string;
  viewerId: string;
  document: Document[] | [];
  limits: LimitProps | null;
};

export default function RequestFileView({
  link,
  userEmail,
  userId,
  isProtected,
  brand,
  token,
  verifiedEmail,
  previewToken,
  disableEditEmail,
  useCustomAccessForm,
  isEmbedded,
  preview,
}: {
  link: LinkWithRequestFile;
  userEmail: string | null | undefined;
  userId: string | null | undefined;
  isProtected: boolean;
  brand?: Partial<Brand> | null;
  token?: string;
  verifiedEmail?: string;
  previewToken?: string;
  disableEditEmail?: boolean;
  useCustomAccessForm?: boolean;
  isEmbedded?: boolean;
  preview?: boolean;
}) {
  const { emailProtected, password: linkPassword, enableAgreement } = link;

  const plausible = usePlausible();
  const analytics = useAnalytics();
  const router = useRouter();

  const didMount = useRef<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [data, setData] = useState<DEFAULT_ACCESS_FORM_TYPE>(
    DEFAULT_ACCESS_FORM_DATA,
  );
  const [viewData, setViewData] = useState<DEFAULT_FILE_REQUEST_VIEW_TYPE>({
    viewId: "",
    viewerId: "",
    document: [],
    limits: null,
  });
  const [verificationRequested, setVerificationRequested] =
    useState<boolean>(false);
  const [verificationToken, setVerificationToken] = useState<string | null>(
    token ?? null,
  );
  const [code, setCode] = useState<string | null>(null);
  const [isInvalidCode, setIsInvalidCode] = useState<boolean>(false);

  const handleSubmission = async (): Promise<void> => {
    setIsLoading(true);
    const response = await fetch("/api/views-requestFile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...data,
        email: data.email ?? verifiedEmail ?? userEmail ?? null,
        linkId: link.id,
        userId: userId ?? null,
        previewToken,
        code: code ?? undefined,
        token: verificationToken ?? undefined,
        verifiedEmail: verifiedEmail ?? undefined,
        linkType: "FILE_REQUEST_LINK",
      }),
    });

    if (response.ok) {
      const fetchData = await response.json();
      if (fetchData.type === "email-verification") {
        setVerificationRequested(true);
        setIsLoading(false);
      } else {
        const {
          viewId,
          isPreview,
          ipAddress,
          verificationToken,
          viewerId,
          document,
          limits,
        } = fetchData as DEFAULT_FILE_REQUEST_VIEW_TYPE;
        plausible("fileRequestViewed"); // track the event
        analytics.identify(
          userEmail ?? verifiedEmail ?? data.email ?? undefined,
        );

        analytics.capture("Link Viewed", {
          linkId: link.id,
          linkType: "FILE_REQUEST_LINK",
          viewerId: viewId,
          viewerEmail: data.email ?? verifiedEmail ?? userEmail,
          isEmbedded,
        });

        // set the verification token to the cookie
        if (verificationToken) {
          Cookies.set("pm_vft", verificationToken, {
            path: router.asPath.split("?")[0],
            expires: 1,
            sameSite: "strict",
            secure: true,
          });
          setCode(null);
        }

        setViewData({
          viewId,
          isPreview,
          ipAddress,
          verificationToken,
          viewerId: viewerId,
          document: document,
          limits,
        });
        setSubmitted(true);
        setVerificationRequested(false);
        setIsLoading(false);
      }
    } else {
      const data = await response.json();
      toast.error(data.message);

      if (data.resetVerification) {
        const currentPath = router.asPath.split("?")[0];

        Cookies.remove("pm_vft", { path: currentPath });
        setVerificationToken(null);
        setCode(null);
        setIsInvalidCode(true);
      }
      setIsLoading(false);
    }
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (
    event: React.FormEvent,
  ): Promise<void> => {
    event.preventDefault();
    await handleSubmission();
  };

  // If token is present, run handle submit which will verify token and get document
  // If link is not submitted and does not have email / password protection, show the access form
  useEffect(() => {
    if (!didMount.current) {
      if ((!submitted && !isProtected) || token || preview) {
        handleSubmission();
      }
      didMount.current = true;
    }
  }, [submitted, isProtected, token, preview]);

  // Components to render when email is submitted but verification is pending
  if (verificationRequested) {
    return (
      <EmailVerificationMessage
        onSubmitHandler={handleSubmit}
        data={data}
        isLoading={isLoading}
        code={code}
        setCode={setCode}
        isInvalidCode={isInvalidCode}
        setIsInvalidCode={setIsInvalidCode}
      />
    );
  }

  // If link is not submitted and does not have email / password protection, show the access form
  if (!submitted && isProtected) {
    return (
      <AccessForm
        data={data}
        email={userEmail}
        setData={setData}
        onSubmitHandler={handleSubmit}
        requireEmail={emailProtected}
        requirePassword={!!linkPassword}
        requireAgreement={enableAgreement!}
        agreementName={link.agreement?.name}
        agreementContent={link.agreement?.content}
        requireName={link.agreement?.requireName}
        isLoading={isLoading}
        brand={brand}
        disableEditEmail={disableEditEmail}
        useCustomAccessForm={useCustomAccessForm}
        customFields={link.customFields}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner className="h-20 w-20" />
      </div>
    );
  }
  return (
    <div
      className="bg-gray-950"
      style={{
        backgroundColor:
          brand && brand.accentColor ? brand.accentColor : "rgb(3, 7, 18)",
      }}
    >
      {submitted ? (
        <FileRequestViewer
          linkId={link.id}
          viewId={viewData.viewId}
          viewerId={viewData.viewerId ?? ""}
          brand={brand}
          isPreview={preview}
          link={link}
          document={viewData?.document}
          limits={viewData?.limits}
        />
      ) : (
        <div className="flex h-screen items-center justify-center">
          <LoadingSpinner className="h-20 w-20" />
        </div>
      )}
    </div>
  );
}

import { useState } from "react";

import NotFound from "@/pages/404";
import { Brand, DataroomBrand } from "@prisma/client";
import { toast } from "sonner";

import AccessForm, {
  DEFAULT_ACCESS_FORM_TYPE,
} from "@/components/view/access-form";
import EmailVerificationMessage from "@/components/view/access-form/email-verification-form";

interface WorkflowAccessViewProps {
  entryLinkId: string;
  domain?: string;
  slug?: string;
  brand?: Partial<Brand> | Partial<DataroomBrand> | null;
}

export default function WorkflowAccessView({
  entryLinkId,
  domain,
  slug,
  brand,
}: WorkflowAccessViewProps) {
  const [data, setData] = useState<DEFAULT_ACCESS_FORM_TYPE>({
    email: "",
    password: "",
  });
  const [code, setCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [isInvalidCode, setIsInvalidCode] = useState(false);
  const [showNotFound, setShowNotFound] = useState(false);

  // Build API endpoints based on whether we have domain/slug or just linkId
  const verifyEndpoint =
    domain && slug
      ? `/api/workflow-entry/domains/${domain}/${slug}/verify`
      : `/api/workflow-entry/link/${entryLinkId}/verify`;

  const accessEndpoint =
    domain && slug
      ? `/api/workflow-entry/domains/${domain}/${slug}/access`
      : `/api/workflow-entry/link/${entryLinkId}/access`;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!data.email) {
      toast.error("Email is required");
      return;
    }

    // If we're in verification mode, verify the code
    if (showVerification && code) {
      await handleVerifyCode();
      return;
    }

    // Otherwise, request OTP
    await handleRequestOTP();
  };

  const handleRequestOTP = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(verifyEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Show 404 for inactive/deleted workflows
        if (response.status === 403 && result.error?.includes("inactive")) {
          setShowNotFound(true);
          return;
        }
        if (response.status === 404) {
          setShowNotFound(true);
          return;
        }
        throw new Error(result.error || "Failed to send verification code");
      }

      setShowVerification(true);
      toast.success("Verification code sent to your email");
    } catch (error) {
      console.error("Error requesting OTP:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to send verification code",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code || code.length !== 6) {
      setIsInvalidCode(true);
      return;
    }

    setIsLoading(true);
    setIsInvalidCode(false);

    try {
      const response = await fetch(accessEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          code: code,
        }),
      });

      const result = await response.json();

      console.log("--------------------------------");
      console.log("result", result);
      console.log("--------------------------------");

      if (!response.ok) {
        // Show 404 for inactive/deleted workflows
        if (response.status === 403 && result.error?.includes("inactive")) {
          setShowNotFound(true);
          return;
        }
        if (response.status === 404) {
          setShowNotFound(true);
          return;
        }
        if (result.resetVerification) {
          // Reset to email entry if verification expired/invalid
          setShowVerification(false);
          setCode(null);
        }
        throw new Error(result.error || "Failed to verify code");
      }

      // Redirect to target URL
      if (result.targetUrl) {
        window.location.href = result.targetUrl;
      } else {
        throw new Error("No target URL provided");
      }
    } catch (error) {
      console.error("Error verifying code:", error);
      setIsInvalidCode(true);
      toast.error(
        error instanceof Error ? error.message : "Failed to verify code",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (showNotFound) {
    return <NotFound message="Sorry, this workflow is no longer available." />;
  }

  if (showVerification) {
    return (
      <EmailVerificationMessage
        onSubmitHandler={handleSubmit}
        data={data}
        isLoading={isLoading}
        code={code}
        setCode={setCode}
        isInvalidCode={isInvalidCode}
        setIsInvalidCode={setIsInvalidCode}
        brand={brand}
      />
    );
  }

  return (
    <AccessForm
      data={data}
      email={data.email}
      setData={setData}
      onSubmitHandler={handleSubmit}
      brand={brand}
      requireEmail={true}
      requirePassword={false}
      isLoading={isLoading}
      linkId={entryLinkId}
      disableEditEmail={false}
      linkWelcomeMessage="Enter your email to access the workflow"
    />
  );
}

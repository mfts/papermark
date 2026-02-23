"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { useEffect, useState } from "react";

import { signIn } from "next-auth/react";

/**
 * SAML Callback Page
 *
 * This page handles IdP-initiated SSO flow:
 * 1. User clicks the app tile in their IdP dashboard
 * 2. Jackson processes the SAML response and redirects here with a `code`
 * 3. We exchange the code via the `saml-idp` CredentialsProvider
 *
 * SP-initiated SSO (user clicks "Continue with SSO" on login page) is handled
 * entirely by NextAuth's OAuth flow via the `saml` provider — it never hits this page.
 */
export default function SAMLCallbackClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const code = searchParams?.get("code");
    if (code) {
      signIn("saml-idp", {
        code,
        redirect: false,
      }).then((result) => {
        if (result?.ok) {
          router.push("/dashboard");
        } else {
          setStatus("error");
          setErrorMessage(
            result?.error || "SSO authentication failed. Please try again.",
          );
        }
      });
    } else {
      setStatus("error");
      setErrorMessage(
        "No authorization code received from your identity provider.",
      );
    }
  }, [searchParams, router]);

  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="mx-auto max-w-md text-center">
          <h2 className="text-xl font-semibold text-gray-900">
            SSO Login Failed
          </h2>
          <p className="mt-2 text-sm text-gray-600">{errorMessage}</p>
          <button
            onClick={() => router.push("/login")}
            className="mt-4 rounded-md bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        <p className="text-sm text-gray-600">Completing SSO login...</p>
      </div>
    </div>
  );
}

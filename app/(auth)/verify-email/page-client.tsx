"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { useEffect, useState } from "react";

import { CheckCircle2, Loader2, Mail, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type VerificationState = "idle" | "verifying" | "success" | "error" | "resending";

export default function VerifyEmailClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [state, setState] = useState<VerificationState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [canResend, setCanResend] = useState(true);

  // Auto-verify if token is present
  useEffect(() => {
    if (token && state === "idle") {
      verifyEmail(token);
    }
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    setState("verifying");
    setErrorMessage("");

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: verificationToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        setState("error");
        setErrorMessage(data.error || "Verification failed");
        return;
      }

      setState("success");
      toast.success("Email verified successfully!");

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (error) {
      setState("error");
      setErrorMessage("An error occurred. Please try again.");
    }
  };

  const resendVerification = async () => {
    if (!email || !canResend) return;

    setState("resending");
    setCanResend(false);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to resend verification email");
        setCanResend(true);
        setState("idle");
        return;
      }

      toast.success("Verification email sent! Please check your inbox.");
      setState("idle");

      // Allow resend after 2 minutes
      setTimeout(() => {
        setCanResend(true);
      }, 120000);
    } catch (error) {
      toast.error("An error occurred. Please try again.");
      setCanResend(true);
      setState("idle");
    }
  };

  // Show pending verification message if no token
  if (!token) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-gray-50">
        <div className="mx-4 w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="mb-2 text-2xl font-semibold text-gray-900">
              Check your email
            </h1>
            <p className="mb-6 text-gray-600">
              We&apos;ve sent a verification link to{" "}
              {email ? (
                <span className="font-medium text-gray-900">{email}</span>
              ) : (
                "your email address"
              )}
              . Click the link to verify your account.
            </p>

            <div className="w-full space-y-3">
              {email && (
                <Button
                  onClick={resendVerification}
                  disabled={!canResend || state === "resending"}
                  variant="outline"
                  className="w-full"
                >
                  {state === "resending" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : canResend ? (
                    "Resend verification email"
                  ) : (
                    "Please wait before resending"
                  )}
                </Button>
              )}
              <Link href="/login" className="block">
                <Button variant="ghost" className="w-full">
                  Back to sign in
                </Button>
              </Link>
            </div>

            <p className="mt-6 text-sm text-gray-500">
              Didn&apos;t receive the email? Check your spam folder.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show verification status
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-50">
      <div className="mx-4 w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center text-center">
          {state === "verifying" && (
            <>
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
              </div>
              <h1 className="mb-2 text-2xl font-semibold text-gray-900">
                Verifying your email...
              </h1>
              <p className="text-gray-600">Please wait while we verify your email address.</p>
            </>
          )}

          {state === "success" && (
            <>
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="mb-2 text-2xl font-semibold text-gray-900">
                Email verified!
              </h1>
              <p className="mb-6 text-gray-600">
                Your email has been verified successfully. Redirecting you to sign in...
              </p>
              <Link href="/login" className="w-full">
                <Button className="w-full bg-gray-800 hover:bg-gray-900">
                  Sign in now
                </Button>
              </Link>
            </>
          )}

          {state === "error" && (
            <>
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <h1 className="mb-2 text-2xl font-semibold text-gray-900">
                Verification failed
              </h1>
              <p className="mb-6 text-gray-600">{errorMessage}</p>

              <div className="w-full space-y-3">
                {email && (
                  <Button
                    onClick={resendVerification}
                    disabled={!canResend || state === "resending"}
                    className="w-full bg-gray-800 hover:bg-gray-900"
                  >
                    Request new verification link
                  </Button>
                )}
                <Link href="/signup" className="block">
                  <Button variant="outline" className="w-full">
                    Create new account
                  </Button>
                </Link>
                <Link href="/login" className="block">
                  <Button variant="ghost" className="w-full">
                    Back to sign in
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

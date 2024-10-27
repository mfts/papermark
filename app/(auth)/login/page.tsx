"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { signInWithPasskey } from "@teamhanko/passkeys-next-auth-provider/client";
import { signIn } from "next-auth/react";
import { toast } from "sonner";

import { LastUsed, useLastUsed } from "@/components/hooks/useLastUsed";
import Google from "@/components/shared/icons/google";
import LinkedIn from "@/components/shared/icons/linkedin";
import Passkey from "@/components/shared/icons/passkey";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { cn } from "@/lib/utils";
import { simpleEmailRegex, validateEmail } from "@/lib/utils/validate-email";

type AuthMethod = "google" | "email" | "linkedin" | "passkey";

export default function Login() {
  const { next: nextParam } = useParams() as { next?: string };
  const [lastUsed, setLastUsed] = useLastUsed();
  const [clickedMethod, setClickedMethod] = useState<AuthMethod | undefined>(undefined);
  const [email, setEmail] = useState<string>("");
  const [emailButtonText, setEmailButtonText] = useState<string>("Continue with Email");
  const [error, setError] = useState<string | null>(null);

  const isValidEmail = email.length > 0 && validateEmail(email);

  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isValidEmail) return;

    setClickedMethod("email");
    try {
      const res = await signIn("email", {
        email,
        redirect: false,
        ...(nextParam && nextParam.length > 0 ? { callbackUrl: nextParam } : {}),
      });
      if (res?.ok && !res?.error) {
        setEmail("");
        setLastUsed("credentials");
        setEmailButtonText("Email sent - check your inbox!");
        toast.success("Email sent - check your inbox!");
      } else {
        setEmailButtonText("Error sending email - try again?");
        toast.error("Error sending email - try again?");
        setError("Error sending email");
      }
    } catch (e) {
      setError("Error sending email");
    } finally {
      setClickedMethod(undefined);
    }
  };

  const handleGoogleSignIn = async () => {
    setClickedMethod("google");
    setLastUsed("google");
    try {
      const res = await signIn("google", {
        ...(nextParam && nextParam.length > 0 ? { callbackUrl: nextParam } : {}),
      });
      if (res?.status) {
        setClickedMethod(undefined);
      }
    } catch (e) {
      setError("Error signing in with Google");
    }
  };

  const handleLinkedInSignIn = async () => {
    setClickedMethod("linkedin");
    setLastUsed("linkedin");
    try {
      const res = await signIn("linkedin", {
        ...(nextParam && nextParam.length > 0 ? { callbackUrl: nextParam } : {}),
      });
      if (res?.status) {
        setClickedMethod(undefined);
      }
    } catch (e) {
      setError("Error signing in with LinkedIn");
    }
  };

  const handlePasskeySignIn = async () => {
    setLastUsed("passkey");
    setClickedMethod("passkey");
    try {
      await signInWithPasskey({
        tenantId: process.env.NEXT_PUBLIC_HANKO_TENANT_ID as string,
      });
    } catch (e) {
      setError("Error signing in with Passkey");
    } finally {
      setClickedMethod(undefined);
    }
  };

  return (
    <div className="flex h-screen w-full flex-wrap">
      {/* Left part */}
      <div className="flex w-full justify-center bg-white md:w-1/2 lg:w-2/5">
        <div
          className="absolute inset-x-0 top-10 -z-10 flex transform-gpu justify-center overflow-hidden blur-3xl"
          aria-hidden="true"
        ></div>
        <div className="z-10 mx-5 mt-[calc(20vh)] h-fit w-full max-w-md overflow-hidden rounded-lg sm:mx-0">
          <div className="flex flex-col items-center justify-center space-y-3 px-4 py-6 pt-8 text-center sm:px-16">
            <Link href="/">
              <span className="text-balance text-2xl font-semibold text-gray-800">
                Welcome to Papermark
              </span>
            </Link>
            <h3 className="text-balance text-sm text-gray-800">
              Share documents. Not attachments.
            </h3>
          </div>
          <form
            className="flex flex-col gap-4 px-4 pt-8 sm:px-16"
            onSubmit={handleEmailSubmit}
          >
            <Label className="sr-only" htmlFor="email">
              Email
            </Label>
            <Input
              id="email"
              placeholder="name@example.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={clickedMethod === "email"}
              pattern={simpleEmailRegex.source}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={cn(
                "flex h-10 w-full rounded-md border-0 bg-background bg-white px-3 py-2 text-sm text-gray-900 ring-1 ring-gray-200 transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white",
                email.length > 0 && !isValidEmail
                  ? "ring-red-500"
                  : "ring-gray-200",
              )}
            />
            {error && <p className="text-red-500">{error}</p>}
            <div className="relative">
              <Button
                type="submit"
                loading={clickedMethod === "email"}
                disabled={!isValidEmail || !!clickedMethod}
                className={cn(
                  "focus:shadow-outline w-full transform rounded px-4 py-2 text-white transition-colors duration-300 ease-in-out focus:outline-none",
                  clickedMethod === "email"
                    ? "bg-black"
                    : "bg-gray-800 hover:bg-gray-900",
                )}
              >
                {emailButtonText}
              </Button>
              {lastUsed === "credentials" && <LastUsed />}
            </div>
          </form>
          <p className="py-4 text-center">or</p>
          <div className="flex flex-col space-y-2 px-4 sm:px-16">
            <div className="relative">
              <Button
                onClick={handleGoogleSignIn}
                loading={clickedMethod === "google"}
                disabled={clickedMethod && clickedMethod !== "google"}
                className="flex w-full items-center justify-center space-x-2 border border-gray-200 bg-gray-100 font-normal text-gray-900 hover:bg-gray-200"
              >
                <Google className="h-5 w-5" />
                <span>Continue with Google</span>
                {clickedMethod !== "google" && lastUsed === "google" && (
                  <LastUsed />
                )}
              </Button>
            </div>
            <div className="relative">
              <Button
                onClick={handleLinkedInSignIn}
                loading={clickedMethod === "linkedin"}
                disabled={clickedMethod && clickedMethod !== "linkedin"}
                className="flex w-full items-center justify-center space-x-2 border border-gray-200 bg-gray-100 font-normal text-gray-900 hover:bg-gray-200"
              >
                <LinkedIn />
                <span>Continue with LinkedIn</span>
                {clickedMethod !== "linkedin" && lastUsed === "linkedin" && (
                  <LastUsed />
                )}
              </Button>
            </div>
            <div className="relative">
              <Button
                onClick={handlePasskeySignIn}
                variant="outline"
                loading={clickedMethod === "passkey"}
                disabled={clickedMethod && clickedMethod !== "passkey"}
                className="flex w-full items-center justify-center space-x-2 border border-gray-200 bg-gray-100 font-normal text-gray-900 hover:bg-gray-200 hover:text-gray-900"
              >
                <Passkey className="h-4 w-4" />
                <span>Continue with a passkey</span>
                {lastUsed === "passkey" && <LastUsed />}
              </Button>
            </div>
          </div>
          <p className="mt-10 w-full max-w-md px-4 text-xs text-muted-foreground sm:px-16">
            By clicking continue, you acknowledge that you have read and agree
            to Papermark&apos;s{" "}
            <a
              href="https://www.papermark.io/terms"
              target="_blank"
              className="underline"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="https://www.papermark.io/privacy"
              target="_blank"
              className="underline"
            >
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
      <div className="hidden w-full justify-center bg-gray-800 md:flex md:w-1/2 lg:w-3/5">
        {/* Right part content */}
      </div>
    </div>
  );
}

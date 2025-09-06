"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { useState } from "react";

import { signInWithPasskey } from "@teamhanko/passkeys-next-auth-provider/client";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { z } from "zod";

import { cn } from "@/lib/utils";
import Eye from "@/components/shared/icons/eye";
import EyeOff from "@/components/shared/icons/eye-off";

import { LastUsed, useLastUsed } from "@/components/hooks/useLastUsed";
import Google from "@/components/shared/icons/google";
import LinkedIn from "@/components/shared/icons/linkedin";
import Passkey from "@/components/shared/icons/passkey";
import { LogoCloud } from "@/components/shared/logo-cloud";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Login() {
  const { next } = useParams as { next?: string };

  const [lastUsed, setLastUsed] = useLastUsed();
  const authMethods = ["password", "google", "email", "linkedin", "passkey"] as const;
  type AuthMethod = (typeof authMethods)[number];
  const [clickedMethod, setClickedMethod] = useState<AuthMethod | undefined>(
    undefined,
  );
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [emailButtonText, setEmailButtonText] = useState<string>(
    "Continue with Email",
  );
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isPasswordMode, setIsPasswordMode] = useState<boolean>(false);

  const emailSchema = z
    .string()
    .trim()
    .toLowerCase()
    .min(3, { message: "Please enter a valid email." })
    .email({ message: "Please enter a valid email." });

  const emailValidation = emailSchema.safeParse(email);

  return (
    <div className="flex h-screen w-full flex-wrap">
      {/* Left part */}
      <div className="flex w-full justify-center bg-gray-50 md:w-1/2 lg:w-1/2">
        <div
          className="absolute inset-x-0 top-10 -z-10 flex transform-gpu justify-center overflow-hidden blur-3xl"
          aria-hidden="true"
        ></div>
        <div className="z-10 mx-5 mt-[calc(1vh)] h-fit w-full max-w-md overflow-hidden rounded-lg sm:mx-0 sm:mt-[calc(2vh)] md:mt-[calc(3vh)]">
          <div className="items-left flex flex-col space-y-3 px-4 py-6 pt-8 sm:px-12">
            <img
              src="/_static/papermark-logo.svg"
              alt="Papermark Logo"
              className="md:mb-48s -mt-8 mb-36 h-7 w-auto self-start sm:mb-32"
            />
            <Link href="/">
              <span className="text-balance text-3xl font-semibold text-gray-900">
                Welcome to Papermark
              </span>
            </Link>
            <h3 className="text-balance text-sm text-gray-800">
              Share documents. Not attachments.
            </h3>
          </div>
          <form
            className="flex flex-col gap-4 px-4 pt-8 sm:px-12"
            onSubmit={(e) => {
              e.preventDefault();
              if (!emailValidation.success) {
                toast.error(emailValidation.error.errors[0].message);
                return;
              }

              if (isPasswordMode) {
                if (!password) {
                  toast.error("Password is required");
                  return;
                }
                
                setClickedMethod("password");
                signIn("credentials", {
                  email: emailValidation.data,
                  password,
                  redirect: false,
                  ...(next && next.length > 0 ? { callbackUrl: next } : {}),
                }).then((res) => {
                  if (res?.ok && !res?.error) {
                    setLastUsed("password");
                    // Redirect will happen automatically
                  } else {
                    toast.error(res?.error || "Invalid credentials");
                  }
                  setClickedMethod(undefined);
                });
              } else {
                setClickedMethod("email");
                signIn("email", {
                  email: emailValidation.data,
                  redirect: false,
                  ...(next && next.length > 0 ? { callbackUrl: next } : {}),
                }).then((res) => {
                  if (res?.ok && !res?.error) {
                    setEmail("");
                    setLastUsed("credentials");
                    setEmailButtonText("Email sent - check your inbox!");
                    toast.success("Email sent - check your inbox!");
                  } else {
                    setEmailButtonText("Error sending email - try again?");
                    toast.error("Error sending email - try again?");
                  }
                  setClickedMethod(undefined);
                });
              }
            }}
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
              // pattern={patternSimpleEmailRegex}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={cn(
                "flex h-10 w-full rounded-md border-0 bg-background bg-white px-3 py-2 text-sm text-gray-900 ring-1 ring-gray-200 transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white",
                email.length > 0 && !emailValidation.success
                  ? "ring-red-500"
                  : "ring-gray-200",
              )}
            />
            
            {isPasswordMode && (
              <div className="relative">
                <Label className="sr-only" htmlFor="password">
                  Password
                </Label>
                <Input
                  id="password"
                  placeholder="Enter your password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  disabled={clickedMethod === "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cn(
                    "flex h-10 w-full rounded-md border-0 bg-background bg-white px-3 py-2 text-sm text-gray-900 ring-1 ring-gray-200 transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white",
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                >
                  {showPassword ? (
                    <Eye className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  )}
                </button>
              </div>
            )}

            <div className="relative">
              <Button
                type="submit"
                loading={clickedMethod === "email" || clickedMethod === "password"}
                disabled={!emailValidation.success || (isPasswordMode && !password) || !!clickedMethod}
                className={cn(
                  "focus:shadow-outline w-full transform rounded px-4 py-2 text-white transition-colors duration-300 ease-in-out focus:outline-none",
                  clickedMethod === "email" || clickedMethod === "password"
                    ? "bg-black"
                    : "bg-gray-800 hover:bg-gray-900",
                )}
              >
                {isPasswordMode ? "Sign In" : emailButtonText}
              </Button>
              {(lastUsed === "credentials" || lastUsed === "password") && <LastUsed />}
            </div>

            {isPasswordMode && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsPasswordMode(false)}
                  className="text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Use magic link instead
                </button>
                <span className="mx-2 text-gray-400">|</span>
                <Link href="/forgot-password" className="text-sm text-gray-600 hover:text-gray-800 underline">
                  Forgot password?
                </Link>
              </div>
            )}

            {!isPasswordMode && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsPasswordMode(true)}
                  className="text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Use password instead
                </button>
              </div>
            )}
          </form>
          <p className="py-4 text-center">or</p>
          <div className="flex flex-col space-y-2 px-4 sm:px-12">
            <div className="relative">
              <Button
                onClick={() => {
                  setClickedMethod("google");
                  setLastUsed("google");
                  signIn("google", {
                    ...(next && next.length > 0 ? { callbackUrl: next } : {}),
                  }).then((res) => {
                    setClickedMethod(undefined);
                  });
                }}
                loading={clickedMethod === "google"}
                disabled={clickedMethod && clickedMethod !== "google"}
                className="flex w-full items-center justify-center space-x-2 border border-gray-300 bg-gray-100 font-normal text-gray-900 hover:bg-gray-200"
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
                onClick={() => {
                  setClickedMethod("linkedin");
                  setLastUsed("linkedin");
                  signIn("linkedin", {
                    ...(next && next.length > 0 ? { callbackUrl: next } : {}),
                  }).then((res) => {
                    setClickedMethod(undefined);
                  });
                }}
                loading={clickedMethod === "linkedin"}
                disabled={clickedMethod && clickedMethod !== "linkedin"}
                className="flex w-full items-center justify-center space-x-2 border border-gray-300 bg-gray-100 font-normal text-gray-900 hover:bg-gray-200"
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
                onClick={() => {
                  setLastUsed("passkey");
                  setClickedMethod("passkey");
                  signInWithPasskey({
                    tenantId: process.env.NEXT_PUBLIC_HANKO_TENANT_ID as string,
                  }).then(() => {
                    setClickedMethod(undefined);
                  });
                }}
                variant="outline"
                loading={clickedMethod === "passkey"}
                disabled={clickedMethod && clickedMethod !== "passkey"}
                className="flex w-full items-center justify-center space-x-2 border border-gray-300 bg-gray-100 font-normal text-gray-900 hover:bg-gray-200 hover:text-gray-900"
              >
                <Passkey className="h-4 w-4" />
                <span>Continue with a passkey</span>
                {lastUsed === "passkey" && <LastUsed />}
              </Button>
            </div>
          </div>
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link href="/register" className="font-medium text-gray-900 underline hover:text-gray-700">
                Sign up
              </Link>
            </p>
          </div>
          
          <p className="mt-10 w-full max-w-md px-4 text-xs text-muted-foreground sm:px-12">
            By clicking continue, you acknowledge that you have read and agree
            to Papermark&apos;s{" "}
            <a
              href={`${process.env.NEXT_PUBLIC_MARKETING_URL}/terms`}
              target="_blank"
              className="underline"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href={`${process.env.NEXT_PUBLIC_MARKETING_URL}/privacy`}
              target="_blank"
              className="underline"
            >
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
      <div className="relative hidden w-full justify-center overflow-hidden bg-black md:flex md:w-1/2 lg:w-1/2">
        <div className="relative m-0 flex h-full min-h-[700px] w-full p-0">
          <div
            className="relative flex h-full w-full flex-col justify-between"
            id="features"
          >
            {/* Testimonial top 2/3 */}
            <div
              className="flex w-full flex-col items-center justify-center"
              style={{ height: "66.6666%" }}
            >
              {/* Image container */}
              <div className="mb-4 h-64 w-80">
                <img
                  className="h-full w-full rounded-2xl object-cover shadow-2xl"
                  src="/_static/testimonials/backtrace.jpeg"
                  alt="Backtrace Capital"
                />
              </div>
              {/* Text content */}
              <div className="max-w-xl text-center">
                <blockquote className="text-balance font-normal leading-8 text-white sm:text-xl sm:leading-9">
                  <p>
                    &quot;We raised our €30M Fund with Papermark Data Rooms.
                    Love the customization, security and ease of use.&quot;
                  </p>
                </blockquote>
                <figcaption className="mt-4">
                  <div className="text-balance font-normal text-white">
                    Michael Münnix
                  </div>
                  <div className="text-balance font-light text-gray-400">
                    Partner, Backtrace Capital
                  </div>
                </figcaption>
              </div>
            </div>
            {/* White block with logos bottom 1/3, full width/height */}
            <div
              className="absolute bottom-0 left-0 flex w-full flex-col items-center justify-center bg-white"
              style={{ height: "33.3333%" }}
            >
              <div className="mb-4 max-w-xl text-balance text-center font-semibold text-gray-900">
                Trusted by teams at
              </div>
              <LogoCloud />
              {/* <img
                src="https://assets.papermark.io/upload/file_7JEGY7zM9ZTfmxu8pe7vWj-Screenshot-2025-05-09-at-18.09.13.png"
                alt="Trusted teams illustration"
                className="mt-4 max-w-full h-auto object-contain"
                style={{maxHeight: '120px'}}
              /> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

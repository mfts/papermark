"use client";

import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";
import { signInWithPasskey } from "@teamhanko/passkeys-next-auth-provider/client";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { useParams } from "next/navigation";
import Passkey from "@/components/shared/icons/passkey";
import { useState } from "react";
import { toast } from "sonner";
import LinkedIn from "@/components/shared/icons/linkedin";
import { Loader } from "lucide-react";
import Google from "@/components/shared/icons/google";
import { Label } from "@/components/ui/label";

export default function Login() {
  const { next } = useParams as { next?: string };

  const [isLoginWithEmail, setIsLoginWithEmail] = useState<boolean>(false);
  const [isLoginWithGoogle, setIsLoginWithGoogle] = useState<boolean>(false);
  const [isLoginWithLinkedIn, setIsLoginWithLinkedIn] =
    useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [emailButtonText, setEmailButtonText] = useState<string>(
    "Continue with Email",
  );

  return (
    <div className="flex h-screen w-full flex-wrap ">
      {/* Left part */}
      <div className="flex w-full justify-center bg-white md:w-1/2 lg:w-2/5">
        <div
          className="absolute inset-x-0 top-10 -z-10 flex transform-gpu justify-center overflow-hidden blur-3xl"
          aria-hidden="true"
        ></div>
        <div className="z-10 mt-[calc(20vh)] h-fit w-full mx-5 sm:mx-0 max-w-md overflow-hidden rounded-lg">
          <div className="flex flex-col items-center justify-center space-y-3 px-4 py-6 pt-8 text-center sm:px-16">
            <Link href="/">
              <span className=" text-2xl font-semibold text-gray-800 text-balance ">
                Welcome to Papermark
              </span>
            </Link>
            <h3 className="text-sm text-gray-800 text-balance ">
              Share documents. Not attachments.
            </h3>
          </div>
          <form
            className="flex flex-col px-4 pt-8 sm:px-16 gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              setIsLoginWithEmail(true);
              signIn("email", {
                email: email,
                redirect: false,
                ...(next && next.length > 0 ? { callbackUrl: next } : {}),
              }).then((res) => {
                if (res?.ok && !res?.error) {
                  setEmail("");
                  setEmailButtonText("Email sent - check your inbox!");
                  toast.success("Email sent - check your inbox!");
                } else {
                  setEmailButtonText("Error sending email - try again?");
                  toast.error("Error sending email - try again?");
                }
                setIsLoginWithEmail(false);
              });
            }}
          >
            {/* <Input
              className="border-1 bg-white border-gray-200 hover:border-gray-200 text-gray-800"
              placeholder="jsmith@company.co"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            /> */}
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
              disabled={isLoginWithEmail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex h-10 w-full rounded-md border-0 ring-1 ring-gray-200 bg-background px-3 py-2 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 bg-white text-gray-900"
            />
            {/* <Button type="submit" disabled={isLoginWithEmail}>
              {isLoginWithEmail && (
                <Loader className="h-5 w-5 mr-2 animate-spin bg-gray-800 hover:bg-gray-900" />
              )}
              Continue with Email
            </Button> */}
            <Button
              type="submit"
              loading={isLoginWithEmail}
              className={`${
                isLoginWithEmail ? "bg-black" : "bg-gray-800 hover:bg-gray-900 "
              } text-white py-2 px-4 rounded focus:outline-none focus:shadow-outline transform transition-colors duration-300 ease-in-out`}
            >
              {emailButtonText}
            </Button>
          </form>
          <p className="text-center py-4">or</p>
          <div className="flex flex-col px-4 sm:px-16 space-y-2">
            <Button
              onClick={() => {
                setIsLoginWithGoogle(true);
                signIn("google", {
                  ...(next && next.length > 0 ? { callbackUrl: next } : {}),
                }).then((res) => {
                  if (res?.status) {
                    setIsLoginWithGoogle(false);
                  }
                });
              }}
              disabled={isLoginWithGoogle}
              className="flex justify-center items-center space-x-2  font-normal bg-gray-100 text-gray-900 border border-gray-200 hover:bg-gray-200 "
            >
              {isLoginWithGoogle ? (
                <Loader className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Google className="w-5 h-5" />
              )}
              <span>Continue with Google</span>
            </Button>
            <Button
              onClick={() => {
                setIsLoginWithLinkedIn(true);
                signIn("linkedin", {
                  ...(next && next.length > 0 ? { callbackUrl: next } : {}),
                }).then((res) => {
                  if (res?.status) {
                    setIsLoginWithLinkedIn(false);
                  }
                });
              }}
              disabled={isLoginWithLinkedIn}
              className="flex justify-center items-center space-x-2 font-normal bg-gray-100 text-gray-900 border border-gray-200 hover:bg-gray-200"
            >
              {isLoginWithLinkedIn ? (
                <Loader className="w-5 h-5 mr-2 animate-spin " />
              ) : (
                <LinkedIn />
              )}
              <span>Continue with LinkedIn</span>
            </Button>
            <Button
              onClick={() =>
                signInWithPasskey({
                  tenantId: process.env.NEXT_PUBLIC_HANKO_TENANT_ID as string,
                })
              }
              variant="outline"
              className="flex justify-center items-center space-x-2 border border-gray-200 hover:bg-gray-200  font-normal bg-gray-100 text-gray-900 hover:text-gray-900"
            >
              <Passkey className="w-4 h-4 " />
              <span>Continue with a passkey</span>
            </Button>
          </div>
          <p className=" mt-10 text-xs text-muted-foreground w-full max-w-md px-4 sm:px-16">
            By clicking continue, you acknowledge that you have read and agree
            to Papermark&apos;s{" "}
            <Link href="/terms" className="underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
      <div className="hidden w-full justify-center bg-gray-800 md:flex md:w-1/2 lg:w-3/5">
        <div className="flex w-full max-w-5xl px-4 md:px-8 py-20">
          <div
            className="flex w-full mx-auto max-w-5xl px-4 md:px-8 py-20 bg-gray-800 rounded-3xl  justify-center"
            id="features"
          >
            <div className="flex flex-col items-center">
              {/* Image container */}
              <div className="w-64 h-64 mb-4">
                <img
                  className="object-cover w-full h-full rounded-2xl shadow-2xl"
                  src="https://www.papermark.io/_static/testimonials/jaski.jpeg"
                  alt="Jaski"
                />
              </div>
              {/* Text content */}
              <div className="max-w-xl text-center">
                <blockquote className="text-l leading-8 text-gray-100 sm:text-xl sm:leading-9 text-balance">
                  <p>
                    True builders listen to their users and build what they
                    need. Thanks Papermark team for solving a big pain point.
                    DocSend monopoly will end soon!
                  </p>
                </blockquote>
                <figcaption className="mt-4">
                  <div className="font-semibold text-white text-balance ">
                    Jaski
                  </div>
                  <div className="text-gray-400 text-balance ">
                    Founder, Townhall Network
                  </div>
                </figcaption>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

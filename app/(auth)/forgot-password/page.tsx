"use client";

import Link from "next/link";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const emailSchema = z.string().email("Invalid email address").toLowerCase();
  const emailValidation = emailSchema.safeParse(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!emailValidation.success) {
      toast.error(emailValidation.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailValidation.data }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSubmitted(true);
        toast.success("If an account with this email exists, you will receive a password reset email.");
      } else {
        toast.error(data.error || "Something went wrong");
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex h-screen w-full justify-center">
        <div className="z-10 mx-5 mt-[calc(20vh)] h-fit w-full max-w-md overflow-hidden rounded-lg border border-border bg-gray-50 dark:bg-gray-900 sm:mx-0 sm:shadow-xl">
          <div className="flex flex-col items-center justify-center space-y-3 px-4 py-6 pt-8 text-center sm:px-16">
            <div className="mb-4">
              <img
                src="/_static/papermark-logo.svg"
                alt="Papermark Logo"
                className="h-8 w-auto"
              />
            </div>
            <h3 className="text-2xl font-medium text-foreground">
              Check your email
            </h3>
            <p className="text-sm text-gray-600 text-center">
              If an account with the email <strong>{email}</strong> exists, we've sent you a password reset link.
            </p>
            <p className="text-sm text-gray-600">
              The link will expire in 15 minutes for security reasons.
            </p>
            <div className="pt-4">
              <Link href="/login" className="text-sm text-gray-900 underline hover:text-gray-700">
                Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full justify-center">
      <div className="z-10 mx-5 mt-[calc(20vh)] h-fit w-full max-w-md overflow-hidden rounded-lg border border-border bg-gray-50 dark:bg-gray-900 sm:mx-0 sm:shadow-xl">
        <div className="flex flex-col items-center justify-center space-y-3 px-4 py-6 pt-8 text-center sm:px-16">
          <div className="mb-4">
            <img
              src="/_static/papermark-logo.svg"
              alt="Papermark Logo"
              className="h-8 w-auto"
            />
          </div>
          <h3 className="text-2xl font-medium text-foreground">
            Forgot your password?
          </h3>
          <p className="text-sm text-gray-600">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <form
          className="flex flex-col gap-4 p-4 pt-8 sm:px-16"
          onSubmit={handleSubmit}
        >
          <div>
            <Label htmlFor="email" className="sr-only">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className={cn(
                "border-2",
                email.length > 0 && !emailValidation.success ? "border-red-500" : ""
              )}
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading || !emailValidation.success}
            loading={isLoading}
          >
            Send reset link
          </Button>

          <div className="text-center">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-800 underline">
              Back to sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
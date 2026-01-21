"use client";

import Link from "next/link";

import { useState } from "react";

import { ArrowLeft, CheckCircle2, Mail } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Email is required")
  .email("Please enter a valid email");

export default function ForgotPasswordClient() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate email
    const validatedEmail = emailSchema.safeParse(email);
    if (!validatedEmail.success) {
      setError(validatedEmail.error.errors[0]?.message || "Invalid email");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: validatedEmail.data }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to send reset email");
        return;
      }

      setIsSubmitted(true);
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-gray-50">
        <div className="mx-4 w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="mb-2 text-2xl font-semibold text-gray-900">
              Check your email
            </h1>
            <p className="mb-6 text-gray-600">
              If an account exists for{" "}
              <span className="font-medium text-gray-900">{email}</span>, we&apos;ve
              sent instructions to reset your password.
            </p>

            <div className="w-full space-y-3">
              <Button
                onClick={() => {
                  setIsSubmitted(false);
                  setEmail("");
                }}
                variant="outline"
                className="w-full"
              >
                Try another email
              </Button>
              <Link href="/login" className="block">
                <Button variant="ghost" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to sign in
                </Button>
              </Link>
            </div>

            <p className="mt-6 text-sm text-gray-500">
              Didn&apos;t receive the email? Check your spam folder, or try again
              in a few minutes.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-50">
      <div className="mx-4 w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="mb-2 text-2xl font-semibold text-gray-900">
            Forgot your password?
          </h1>
          <p className="mb-6 text-gray-600">
            Enter your email address and we&apos;ll send you instructions to reset
            your password.
          </p>

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="space-y-1 text-left">
              <Label htmlFor="email" className="text-sm text-gray-700">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                disabled={isLoading}
                className={cn(
                  "h-10 border-0 bg-gray-50 ring-1 ring-gray-200 focus-visible:ring-1 focus-visible:ring-ring",
                  error && "ring-red-500",
                )}
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>

            <Button
              type="submit"
              loading={isLoading}
              disabled={isLoading}
              className="w-full bg-gray-800 hover:bg-gray-900"
            >
              Send reset link
            </Button>
          </form>

          <Link href="/login" className="mt-6 block">
            <Button variant="ghost" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to sign in
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

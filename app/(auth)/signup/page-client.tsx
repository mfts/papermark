"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useState } from "react";

import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { z } from "zod";

import { cn } from "@/lib/utils";

import Google from "@/components/shared/icons/google";
import LinkedIn from "@/components/shared/icons/linkedin";
import { LogoCloud } from "@/components/shared/logo-cloud";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const signupSchema = z
  .object({
    name: z.string().trim().optional(),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, "Email is required")
      .email("Please enter a valid email"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain uppercase, lowercase, and number",
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupClient() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [clickedMethod, setClickedMethod] = useState<
    "form" | "google" | "linkedin" | undefined
  >(undefined);
  const [formData, setFormData] = useState<SignupFormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Partial<SignupFormData>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof SignupFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate form
    const validatedFields = signupSchema.safeParse(formData);
    if (!validatedFields.success) {
      const fieldErrors: Partial<SignupFormData> = {};
      validatedFields.error.errors.forEach((error) => {
        const field = error.path[0] as keyof SignupFormData;
        fieldErrors[field] = error.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    setClickedMethod("form");

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name || undefined,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to create account");
        return;
      }

      toast.success("Account created! Please check your email to verify your account.");
      router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`);
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
      setClickedMethod(undefined);
    }
  };

  return (
    <div className="flex h-screen w-full flex-wrap">
      {/* Left part */}
      <div className="flex w-full justify-center bg-gray-50 md:w-1/2 lg:w-1/2">
        <div
          className="absolute inset-x-0 top-10 -z-10 flex transform-gpu justify-center overflow-hidden blur-3xl"
          aria-hidden="true"
        />
        <div className="z-10 mx-5 mt-[calc(1vh)] h-fit w-full max-w-md overflow-hidden rounded-lg sm:mx-0 sm:mt-[calc(2vh)] md:mt-[calc(3vh)]">
          <div className="items-left flex flex-col space-y-3 px-4 py-6 pt-8 sm:px-12">
            <img
              src="/_static/papermark-logo.svg"
              alt="Papermark Logo"
              className="-mt-8 mb-12 h-7 w-auto self-start sm:mb-10"
            />
            <Link href="/">
              <span className="text-balance text-3xl font-semibold text-gray-900">
                Create your account
              </span>
            </Link>
            <h3 className="text-balance text-sm text-gray-800">
              Share documents. Not attachments.
            </h3>
          </div>

          <form
            className="flex flex-col gap-4 px-4 pt-4 sm:px-12"
            onSubmit={handleSubmit}
          >
            <div className="space-y-1">
              <Label htmlFor="name" className="text-sm text-gray-700">
                Name (optional)
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="John Doe"
                type="text"
                autoComplete="name"
                disabled={isLoading}
                value={formData.name}
                onChange={handleInputChange}
                className={cn(
                  "h-10 border-0 bg-white ring-1 ring-gray-200 focus-visible:ring-1 focus-visible:ring-ring",
                  errors.name && "ring-red-500",
                )}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="email" className="text-sm text-gray-700">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                placeholder="name@example.com"
                type="email"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect="off"
                disabled={isLoading}
                value={formData.email}
                onChange={handleInputChange}
                className={cn(
                  "h-10 border-0 bg-white ring-1 ring-gray-200 focus-visible:ring-1 focus-visible:ring-ring",
                  errors.email && "ring-red-500",
                )}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="password" className="text-sm text-gray-700">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                placeholder="At least 8 characters"
                type="password"
                autoComplete="new-password"
                disabled={isLoading}
                value={formData.password}
                onChange={handleInputChange}
                className={cn(
                  "h-10 border-0 bg-white ring-1 ring-gray-200 focus-visible:ring-1 focus-visible:ring-ring",
                  errors.password && "ring-red-500",
                )}
              />
              {errors.password && (
                <p className="text-xs text-red-500">{errors.password}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="confirmPassword" className="text-sm text-gray-700">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Confirm your password"
                type="password"
                autoComplete="new-password"
                disabled={isLoading}
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={cn(
                  "h-10 border-0 bg-white ring-1 ring-gray-200 focus-visible:ring-1 focus-visible:ring-ring",
                  errors.confirmPassword && "ring-red-500",
                )}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-red-500">{errors.confirmPassword}</p>
              )}
            </div>

            <Button
              type="submit"
              loading={clickedMethod === "form"}
              disabled={!!clickedMethod}
              className="mt-2 w-full bg-gray-800 hover:bg-gray-900"
            >
              Create Account
            </Button>
          </form>

          <p className="py-4 text-center text-sm text-gray-500">or</p>

          <div className="flex flex-col space-y-2 px-4 sm:px-12">
            <Button
              onClick={() => {
                setClickedMethod("google");
                signIn("google");
              }}
              loading={clickedMethod === "google"}
              disabled={!!clickedMethod}
              className="flex w-full items-center justify-center space-x-2 border border-gray-300 bg-gray-100 font-normal text-gray-900 hover:bg-gray-200"
            >
              <Google className="h-5 w-5" />
              <span>Continue with Google</span>
            </Button>
            <Button
              onClick={() => {
                setClickedMethod("linkedin");
                signIn("linkedin");
              }}
              loading={clickedMethod === "linkedin"}
              disabled={!!clickedMethod}
              className="flex w-full items-center justify-center space-x-2 border border-gray-300 bg-gray-100 font-normal text-gray-900 hover:bg-gray-200"
            >
              <LinkedIn />
              <span>Continue with LinkedIn</span>
            </Button>
          </div>

          <p className="mt-6 px-4 text-center text-sm text-gray-600 sm:px-12">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-gray-900 underline">
              Sign in
            </Link>
          </p>

          <p className="mt-6 w-full max-w-md px-4 pb-8 text-xs text-muted-foreground sm:px-12">
            By creating an account, you acknowledge that you have read and agree
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

      {/* Right part - testimonial */}
      <div className="relative hidden w-full justify-center overflow-hidden bg-black md:flex md:w-1/2 lg:w-1/2">
        <div className="relative m-0 flex h-full min-h-[700px] w-full p-0">
          <div
            className="relative flex h-full w-full flex-col justify-between"
            id="features"
          >
            <div
              className="flex w-full flex-col items-center justify-center"
              style={{ height: "66.6666%" }}
            >
              <div className="mb-4 h-64 w-80">
                <img
                  className="h-full w-full rounded-2xl object-cover shadow-2xl"
                  src="/_static/testimonials/backtrace.jpeg"
                  alt="Backtrace Capital"
                />
              </div>
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
            <div
              className="absolute bottom-0 left-0 flex w-full flex-col items-center justify-center bg-white"
              style={{ height: "33.3333%" }}
            >
              <div className="mb-4 max-w-xl text-balance text-center font-semibold text-gray-900">
                Trusted by teams at
              </div>
              <LogoCloud />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

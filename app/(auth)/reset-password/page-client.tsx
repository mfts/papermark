"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { useEffect, useState } from "react";

import { CheckCircle2, KeyRound, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const passwordSchema = z
  .object({
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

type PasswordFormData = z.infer<typeof passwordSchema>;
type PageState = "validating" | "invalid" | "form" | "submitting" | "success";

export default function ResetPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [state, setState] = useState<PageState>("validating");
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState<PasswordFormData>({
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Partial<PasswordFormData>>({});

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setState("invalid");
      setErrorMessage("No reset token provided");
      return;
    }

    validateToken(token);
  }, [token]);

  const validateToken = async (resetToken: string) => {
    try {
      const response = await fetch(
        `/api/auth/reset-password?token=${encodeURIComponent(resetToken)}`,
      );

      const data = await response.json();

      if (!response.ok) {
        setState("invalid");
        setErrorMessage(data.error || "Invalid reset link");
        return;
      }

      setState("form");
    } catch (error) {
      setState("invalid");
      setErrorMessage("An error occurred. Please try again.");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof PasswordFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate form
    const validatedFields = passwordSchema.safeParse(formData);
    if (!validatedFields.success) {
      const fieldErrors: Partial<PasswordFormData> = {};
      validatedFields.error.errors.forEach((error) => {
        const field = error.path[0] as keyof PasswordFormData;
        fieldErrors[field] = error.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setState("submitting");

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to reset password");
        setState("form");
        return;
      }

      setState("success");
      toast.success("Password reset successfully!");

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (error) {
      toast.error("An error occurred. Please try again.");
      setState("form");
    }
  };

  // Validating token
  if (state === "validating") {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-gray-50">
        <div className="mx-4 w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
            </div>
            <h1 className="mb-2 text-2xl font-semibold text-gray-900">
              Validating reset link...
            </h1>
            <p className="text-gray-600">Please wait while we verify your reset link.</p>
          </div>
        </div>
      </div>
    );
  }

  // Invalid token
  if (state === "invalid") {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-gray-50">
        <div className="mx-4 w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="mb-2 text-2xl font-semibold text-gray-900">
              Invalid reset link
            </h1>
            <p className="mb-6 text-gray-600">{errorMessage}</p>

            <div className="w-full space-y-3">
              <Link href="/forgot-password" className="block">
                <Button className="w-full bg-gray-800 hover:bg-gray-900">
                  Request new reset link
                </Button>
              </Link>
              <Link href="/login" className="block">
                <Button variant="ghost" className="w-full">
                  Back to sign in
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success
  if (state === "success") {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-gray-50">
        <div className="mx-4 w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="mb-2 text-2xl font-semibold text-gray-900">
              Password reset!
            </h1>
            <p className="mb-6 text-gray-600">
              Your password has been reset successfully. Redirecting you to sign
              in...
            </p>
            <Link href="/login" className="w-full">
              <Button className="w-full bg-gray-800 hover:bg-gray-900">
                Sign in now
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Password form
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-50">
      <div className="mx-4 w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <KeyRound className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="mb-2 text-2xl font-semibold text-gray-900">
            Set new password
          </h1>
          <p className="mb-6 text-gray-600">
            Choose a strong password for your account.
          </p>

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="space-y-1 text-left">
              <Label htmlFor="password" className="text-sm text-gray-700">
                New Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="At least 8 characters"
                value={formData.password}
                onChange={handleInputChange}
                disabled={state === "submitting"}
                className={cn(
                  "h-10 border-0 bg-gray-50 ring-1 ring-gray-200 focus-visible:ring-1 focus-visible:ring-ring",
                  errors.password && "ring-red-500",
                )}
              />
              {errors.password && (
                <p className="text-xs text-red-500">{errors.password}</p>
              )}
            </div>

            <div className="space-y-1 text-left">
              <Label htmlFor="confirmPassword" className="text-sm text-gray-700">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                disabled={state === "submitting"}
                className={cn(
                  "h-10 border-0 bg-gray-50 ring-1 ring-gray-200 focus-visible:ring-1 focus-visible:ring-ring",
                  errors.confirmPassword && "ring-red-500",
                )}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-red-500">{errors.confirmPassword}</p>
              )}
            </div>

            <Button
              type="submit"
              loading={state === "submitting"}
              disabled={state === "submitting"}
              className="w-full bg-gray-800 hover:bg-gray-900"
            >
              Reset password
            </Button>
          </form>

          <p className="mt-4 text-sm text-gray-500">
            Password must be at least 8 characters and contain uppercase,
            lowercase, and a number.
          </p>
        </div>
      </div>
    </div>
  );
}

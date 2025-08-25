"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Eye from "@/components/shared/icons/eye";
import EyeOff from "@/components/shared/icons/eye-off";
import { cn } from "@/lib/utils";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const passwordSchema = z.string().min(8, "Password must be at least 8 characters");
  const passwordValidation = passwordSchema.safeParse(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  useEffect(() => {
    if (!token) {
      router.push("/forgot-password");
    }
  }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordValidation.success) {
      toast.error(passwordValidation.error.errors[0].message);
      return;
    }

    if (!passwordsMatch) {
      toast.error("Passwords do not match");
      return;
    }

    if (!token) {
      toast.error("Invalid reset token");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        toast.success("Password reset successfully!");
      } else {
        toast.error(data.error || "Something went wrong");
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex h-screen w-full justify-center items-center">
        <div className="text-center">
          <p className="text-gray-600">Invalid or missing reset token</p>
          <Link href="/forgot-password" className="text-blue-600 underline">
            Request a new password reset
          </Link>
        </div>
      </div>
    );
  }

  if (isSuccess) {
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
              Password reset successful!
            </h3>
            <p className="text-sm text-gray-600">
              Your password has been successfully reset. You can now sign in with your new password.
            </p>
            <div className="pt-4">
              <Button asChild>
                <Link href="/login">
                  Sign in
                </Link>
              </Button>
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
            Set new password
          </h3>
          <p className="text-sm text-gray-600">
            Enter your new password below.
          </p>
        </div>

        <form
          className="flex flex-col gap-4 p-4 pt-8 sm:px-16"
          onSubmit={handleSubmit}
        >
          <div className="relative">
            <Label htmlFor="password" className="sr-only">
              New Password
            </Label>
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password (8+ characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className={cn(
                "border-2 pr-10",
                password.length > 0 && !passwordValidation.success ? "border-red-500" : ""
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

          <div className="relative">
            <Label htmlFor="confirmPassword" className="sr-only">
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              className={cn(
                "border-2 pr-10",
                confirmPassword.length > 0 && !passwordsMatch ? "border-red-500" : ""
              )}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3"
            >
              {showConfirmPassword ? (
                <Eye className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              ) : (
                <EyeOff className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              )}
            </button>
          </div>

          <Button
            type="submit"
            disabled={isLoading || !passwordValidation.success || !passwordsMatch}
            loading={isLoading}
          >
            Reset password
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
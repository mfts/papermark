"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";

import { useState } from "react";
import { z } from "zod";

import PapermarkLogo from "@/public/_static/papermark-logo.svg";
import { signIn } from "next-auth/react";
import { toast } from "sonner";

import Eye from "@/components/shared/icons/eye";
import EyeOff from "@/components/shared/icons/eye-off";
import LinkedIn from "@/components/shared/icons/linkedin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function Register() {
  const { next } = useParams as { next?: string };

  const [email, setEmail] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [step, setStep] = useState<'signup' | 'verify'>('signup');
  const [usePassword, setUsePassword] = useState<boolean>(true);

  const emailSchema = z.string().email("Invalid email address").toLowerCase();
  const nameSchema = z.string().min(1, "Name is required").max(50, "Name too long");
  const passwordSchema = z.string().min(8, "Password must be at least 8 characters");

  const emailValidation = emailSchema.safeParse(email);
  const nameValidation = nameSchema.safeParse(name);
  const passwordValidation = passwordSchema.safeParse(password);

  return (
    <div className="flex h-screen w-full justify-center">
      <div
        className="absolute inset-x-0 top-10 -z-10 flex transform-gpu justify-center overflow-hidden blur-3xl"
        aria-hidden="true"
      >
        <div
          className="aspect-[1108/632] w-[69.25rem] flex-none bg-gradient-to-r from-[#80caff] to-[#4f46e5] opacity-20"
          style={{
            clipPath:
              "polygon(73.6% 51.7%, 91.7% 11.8%, 100% 46.4%, 97.4% 82.2%, 92.5% 84.9%, 75.7% 64%, 55.3% 47.5%, 46.5% 49.4%, 45% 62.9%, 50.3% 87.2%, 21.3% 64.1%, 0.1% 100%, 5.4% 51.1%, 21.4% 63.9%, 58.9% 0.2%, 73.6% 51.7%)",
          }}
        />
      </div>
      <div className="z-10 mx-5 mt-[calc(20vh)] h-fit w-full max-w-md overflow-hidden rounded-lg border border-border bg-gray-50 dark:bg-gray-900 sm:mx-0 sm:shadow-xl">
        <div className="flex flex-col items-center justify-center space-y-3 px-4 py-6 pt-8 text-center sm:px-16">
          <Link href="/">
            <Image
              src={PapermarkLogo}
              width={119}
              height={32}
              alt="Papermark Logo"
            />
          </Link>
          <h3 className="text-2xl font-medium text-foreground">
            Start sharing documents
          </h3>
        </div>
        {step === 'signup' && (
          <>
            {usePassword ? (
              <form
                className="flex flex-col gap-4 p-4 pt-8 sm:px-16"
                onSubmit={async (e) => {
                  e.preventDefault();
                  
                  if (!nameValidation.success) {
                    toast.error(nameValidation.error.errors[0].message);
                    return;
                  }
                  
                  if (!emailValidation.success) {
                    toast.error(emailValidation.error.errors[0].message);
                    return;
                  }
                  
                  if (!passwordValidation.success) {
                    toast.error(passwordValidation.error.errors[0].message);
                    return;
                  }

                  setIsLoading(true);

                  try {
                    const response = await fetch("/api/auth/signup", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ name, email, password }),
                    });

                    const data = await response.json();

                    if (response.ok) {
                      toast.success("Account created! Please check your email for verification code.");
                      setStep('verify');
                    } else {
                      toast.error(data.error || "Something went wrong");
                    }
                  } catch (error) {
                    toast.error("Network error. Please try again.");
                  } finally {
                    setIsLoading(false);
                  }
                }}
              >
                <div>
                  <Label htmlFor="name" className="sr-only">Name</Label>
                  <Input
                    id="name"
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                    className={cn(
                      "border-2",
                      name.length > 0 && !nameValidation.success ? "border-red-500" : ""
                    )}
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="sr-only">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="jsmith@company.co"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className={cn(
                      "border-2",
                      email.length > 0 && !emailValidation.success ? "border-red-500" : ""
                    )}
                  />
                </div>

                <div className="relative">
                  <Label htmlFor="password" className="sr-only">Password</Label>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password (8+ characters)"
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

                <Button 
                  type="submit" 
                  disabled={isLoading || !nameValidation.success || !emailValidation.success || !passwordValidation.success}
                  loading={isLoading}
                >
                  Create Account
                </Button>
              </form>
            ) : (
              <form
                className="flex flex-col gap-4 p-4 pt-8 sm:px-16"
                onSubmit={(e) => {
                  e.preventDefault();
                  signIn("email", {
                    email: email,
                    redirect: false,
                    ...(next && next.length > 0 ? { callbackUrl: next } : {}),
                  }).then((res) => {
                    if (res?.ok && !res?.error) {
                      setEmail("");
                      toast.success("Email sent - check your inbox!");
                    } else {
                      toast.error("Error sending email - try again?");
                    }
                  });
                }}
              >
                <Input
                  className="border-2"
                  placeholder="jsmith@company.co"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Button type="submit">Continue with Email</Button>
              </form>
            )}

            <div className="text-center px-4 sm:px-16">
              <button
                type="button"
                onClick={() => setUsePassword(!usePassword)}
                className="text-sm text-gray-600 hover:text-gray-800 underline"
              >
                {usePassword ? "Use magic link instead" : "Use password instead"}
              </button>
            </div>
          </>
        )}

        {step === 'verify' && (
          <div className="p-4 pt-8 sm:px-16">
            <div className="text-center mb-6">
              <h4 className="text-lg font-medium text-foreground mb-2">Verify your email</h4>
              <p className="text-sm text-gray-600">
                We sent a 6-digit code to <strong>{email}</strong>
              </p>
            </div>

            <form
              className="flex flex-col gap-4"
              onSubmit={async (e) => {
                e.preventDefault();
                
                if (verificationCode.length !== 6) {
                  toast.error("Please enter a 6-digit verification code");
                  return;
                }

                setIsLoading(true);

                try {
                  const response = await fetch("/api/auth/verify-email", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, code: verificationCode }),
                  });

                  const data = await response.json();

                  if (response.ok) {
                    toast.success("Email verified! You can now sign in.");
                    // Redirect to login page
                    window.location.href = "/login" + (next ? `?next=${encodeURIComponent(next)}` : "");
                  } else {
                    toast.error(data.error || "Invalid verification code");
                  }
                } catch (error) {
                  toast.error("Network error. Please try again.");
                } finally {
                  setIsLoading(false);
                }
              }}
            >
              <div>
                <Label htmlFor="verificationCode" className="sr-only">Verification Code</Label>
                <Input
                  id="verificationCode"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  disabled={isLoading}
                  className="border-2 text-center text-lg tracking-widest"
                  maxLength={6}
                />
              </div>

              <Button type="submit" disabled={isLoading || verificationCode.length !== 6} loading={isLoading}>
                Verify Email
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setStep('signup')}
                  className="text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Back to sign up
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 'signup' && (
          <>
            <p className="text-center">or</p>
            <div className="flex flex-col space-y-2 px-4 py-8 sm:px-16">
              <Button
                onClick={() => {
                  signIn("google", {
                    ...(next && next.length > 0 ? { callbackUrl: next } : {}),
                  });
                }}
                className="flex items-center justify-center space-x-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 488 512"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z" />
                </svg>
                <span>Continue with Google</span>
              </Button>
              <Button
                onClick={() => {
                  signIn("linkedin", {
                    ...(next && next.length > 0 ? { callbackUrl: next } : {}),
                  });
                }}
                className="flex items-center justify-center space-x-2"
              >
                <LinkedIn />
                <span>Continue with LinkedIn</span>
              </Button>
            </div>

            <div className="text-center px-4 sm:px-16">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-gray-900 underline hover:text-gray-700">
                  Sign in
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";

import { Shield } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SSOLogin() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"email" | "redirecting">("email");

  async function handleSSOLogin(e: React.FormEvent) {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your work email");
      return;
    }

    setLoading(true);

    try {
      // Step 1: Check if SAML is configured for this email domain
      const checkRes = await fetch(
        `/api/auth/saml/check?email=${encodeURIComponent(email)}`,
      );
      const checkData = await checkRes.json();

      if (!checkData.hasSaml) {
        toast.error(
          "SSO is not configured for your organization. Please contact your admin.",
        );
        setLoading(false);
        return;
      }

      setStep("redirecting");

      // Step 2: Redirect to Jackson's authorize endpoint
      const params = new URLSearchParams({
        tenant: checkData.teamId,
        product: process.env.NEXT_PUBLIC_JACKSON_PRODUCT || "papermark",
        redirect_uri: `${window.location.origin}/auth/saml`,
        state: crypto.randomUUID(),
      });

      window.location.href = `/api/auth/saml/authorize?${params.toString()}`;
    } catch (error) {
      console.error("[SSO] Login error:", error);
      toast.error("Something went wrong. Please try again.");
      setLoading(false);
      setStep("email");
    }
  }

  if (step === "redirecting") {
    return (
      <div className="flex flex-col items-center space-y-2 py-4">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        <p className="text-sm text-gray-600">
          Redirecting to your identity provider...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSSOLogin} className="flex flex-col space-y-3">
      <Label className="sr-only" htmlFor="sso-email">
        Work Email
      </Label>
      <Input
        id="sso-email"
        placeholder="work@company.com"
        type="email"
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect="off"
        disabled={loading}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="flex h-10 w-full rounded-md border-0 bg-background bg-white px-3 py-2 text-sm text-gray-900 ring-1 ring-gray-200 transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white"
      />
      <Button
        type="submit"
        loading={loading}
        disabled={!email || loading}
        className="flex w-full items-center justify-center space-x-2 border border-gray-300 bg-gray-100 font-normal text-gray-900 hover:bg-gray-200"
      >
        <Shield className="h-4 w-4" />
        <span>Continue with SSO</span>
      </Button>
    </form>
  );
}

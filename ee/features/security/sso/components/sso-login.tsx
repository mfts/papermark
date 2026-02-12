"use client";

import { useRef, useState } from "react";

import { Shield } from "lucide-react";
import { signIn } from "next-auth/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { JACKSON_PRODUCT } from "../product";

interface SSOLoginProps {
  autoExpand?: boolean;
}

export function SSOLogin({ autoExpand = false }: SSOLoginProps) {
  const [teamSlug, setTeamSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(autoExpand);
  const [step, setStep] = useState<"idle" | "redirecting">("idle");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSSOLogin(e: React.FormEvent) {
    e.preventDefault();

    const value = teamSlug.trim().toLowerCase();
    if (!value) {
      toast.error("Please enter your team identifier");
      return;
    }

    setLoading(true);

    try {
      // Step 1: Verify SSO is configured for this team
      const verifyRes = await fetch("/api/auth/saml/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: value }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok || verifyData.error) {
        toast.error(
          verifyData.error ||
            "SSO is not configured for this team. Please contact your admin.",
        );
        setLoading(false);
        return;
      }

      setStep("redirecting");

      // Step 2: Initiate SAML SSO via NextAuth's OAuth provider (with PKCE + state)
      await signIn("saml", undefined, {
        tenant: verifyData.data.teamId,
        product: JACKSON_PRODUCT,
      });
    } catch (error) {
      console.error("[SSO] Login error:", error);
      toast.error("Something went wrong. Please try again.");
      setLoading(false);
      setStep("idle");
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

  if (!expanded) {
    return (
      <Button
        type="button"
        onClick={() => {
          setExpanded(true);
          // Focus the input after it renders
          requestAnimationFrame(() => inputRef.current?.focus());
        }}
        className="flex w-full items-center justify-center space-x-2 border border-gray-300 bg-gray-100 font-normal text-gray-900 hover:bg-gray-200"
      >
        <Shield className="h-4 w-4" />
        <span>Continue with SAML SSO</span>
      </Button>
    );
  }

  return (
    <form onSubmit={handleSSOLogin} className="flex flex-col space-y-3">
      <Label className="sr-only" htmlFor="sso-team-slug">
        Team Identifier
      </Label>
      <Input
        ref={inputRef}
        id="sso-team-slug"
        placeholder="your-team-slug"
        type="text"
        autoCapitalize="none"
        autoComplete="off"
        autoCorrect="off"
        autoFocus
        disabled={loading}
        value={teamSlug}
        onChange={(e) => setTeamSlug(e.target.value)}
        className="flex h-10 w-full rounded-md border-0 bg-background bg-white px-3 py-2 text-sm text-gray-900 ring-1 ring-gray-200 transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white"
      />
      <Button
        type="submit"
        loading={loading}
        disabled={!teamSlug.trim() || loading}
        className="flex w-full items-center justify-center space-x-2 border border-gray-300 bg-gray-100 font-normal text-gray-900 hover:bg-gray-200"
      >
        <Shield className="h-4 w-4" />
        <span>Continue with SAML SSO</span>
      </Button>
    </form>
  );
}

"use client";

import { FormEvent, useState } from "react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const generateState = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

export function SSOLogin() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email) {
      toast.error("Enter your work email to continue with SSO.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/auth/saml/check?email=${encodeURIComponent(email.trim().toLowerCase())}`,
      );

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "SSO is not configured for this email.");
      }

      const data = payload.data as {
        tenant: string;
        product: string;
      };

      const redirectUri = `${window.location.origin}/auth/saml`;
      const params = new URLSearchParams({
        tenant: data.tenant,
        product: data.product,
        response_type: "code",
        client_id: "dummy",
        redirect_uri: redirectUri,
        state: generateState(),
      });

      window.location.assign(`/api/auth/saml/authorize?${params.toString()}`);
    } catch (error) {
      toast.error((error as Error).message || "Failed to start SSO login.");
      setLoading(false);
    }
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="sso-email">Work email</Label>
        <Input
          id="sso-email"
          type="email"
          value={email}
          disabled={loading}
          placeholder="you@company.com"
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
        />
      </div>
      <Button type="submit" disabled={loading || !email} className="w-full">
        {loading ? "Redirecting..." : "Sign in with SSO"}
      </Button>
    </form>
  );
}

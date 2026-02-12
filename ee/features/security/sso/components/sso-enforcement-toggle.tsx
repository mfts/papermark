"use client";

import { useState } from "react";

import { AlertTriangle, Lock, LockOpen } from "lucide-react";
import { toast } from "sonner";

import useSAML from "@/lib/swr/use-saml";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface SSOEnforcementToggleProps {
  teamId: string;
}

export function SSOEnforcementToggle({ teamId }: SSOEnforcementToggleProps) {
  const { configured, ssoEmailDomain, ssoEnforcedAt, slug, mutate, loading } =
    useSAML();
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isEnforced = !!ssoEnforcedAt;

  async function toggleEnforcement(enforced: boolean) {
    setSubmitting(true);

    try {
      const res = await fetch(`/api/teams/${teamId}/saml`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enforced }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update enforcement");
      }

      toast.success(
        enforced
          ? `SSO is now enforced for @${ssoEmailDomain} users`
          : "SSO enforcement has been disabled",
      );
      setConfirmOpen(false);
      await mutate();
    } catch (error: any) {
      toast.error(error.message || "Failed to update SSO enforcement");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !configured) {
    return null;
  }

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-start space-x-3">
          {isEnforced ? (
            <Lock className="mt-0.5 h-4 w-4 text-orange-600" />
          ) : (
            <LockOpen className="mt-0.5 h-4 w-4 text-muted-foreground" />
          )}
          <div className="space-y-1">
            <h3 className="text-sm font-medium">SSO Enforcement</h3>
            {isEnforced ? (
              <p className="text-xs text-muted-foreground">
                All users with <strong>@{ssoEmailDomain}</strong> must sign in
                via SSO. Email, Google, and other login methods are blocked for
                this domain.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                SSO is available but not required.{" "}
                {ssoEmailDomain
                  ? `Users with @${ssoEmailDomain} can still sign in with other methods.`
                  : "Configure SAML first to set up enforcement."}
              </p>
            )}
            {slug && (
              <p className="mt-1 text-xs text-muted-foreground">
                Team slug for SSO login:{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">
                  {slug}
                </code>
              </p>
            )}
          </div>
        </div>

        {isEnforced ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleEnforcement(false)}
            loading={submitting}
            disabled={submitting}
          >
            Disable
          </Button>
        ) : (
          <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <DialogTrigger asChild>
              <Button
                variant="default"
                size="sm"
                disabled={!ssoEmailDomain || !configured}
              >
                Enforce SSO
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  <span>Enforce SSO for @{ssoEmailDomain}?</span>
                </DialogTitle>
                <DialogDescription className="space-y-2 pt-2">
                  <p>
                    Once enforced, <strong>all users</strong> with an{" "}
                    <strong>@{ssoEmailDomain}</strong> email address will be{" "}
                    <strong>required</strong> to sign in through your Identity
                    Provider.
                  </p>
                  <p>
                    Email magic links, Google, LinkedIn, and passkey login will
                    be <strong>blocked</strong> for these users.
                  </p>
                  <p className="font-medium">
                    Make sure your SAML configuration is working correctly before
                    enabling enforcement.
                  </p>
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() => setConfirmOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => toggleEnforcement(true)}
                  loading={submitting}
                  disabled={submitting}
                >
                  Enforce SSO
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}

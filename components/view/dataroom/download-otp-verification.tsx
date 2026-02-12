"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";

const REGEXP_ONLY_DIGITS = "^\\d+$";

export interface DownloadOtpVerificationProps {
  linkId: string;
  /** viewId is optional — when omitted the server resolves the view by email + linkId. */
  viewId?: string;
  email: string;
  onVerified: () => void;
  onCancel?: () => void;
  compact?: boolean;
  /** When true, send OTP email automatically on mount (e.g. when user just chose "Notify me" and clicked Start download). */
  sendOtpOnMount?: boolean;
}

const RESEND_COOLDOWN_SECONDS = 60;

export function DownloadOtpVerification({
  linkId,
  viewId,
  email,
  onVerified,
  onCancel,
  compact = false,
  sendOtpOnMount = false,
}: DownloadOtpVerificationProps) {
  const [code, setCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const hasSentOnMountRef = useRef(false);

  const sendOtp = useCallback(async () => {
    setIsSending(true);
    setError(null);
    try {
      const body: Record<string, string> = { linkId, email };
      if (viewId) body.viewId = viewId;
      const res = await fetch("/api/links/download/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to send code");
        return;
      }
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } finally {
      setIsSending(false);
    }
  }, [linkId, viewId, email]);

  useEffect(() => {
    if (!sendOtpOnMount || hasSentOnMountRef.current) return;
    hasSentOnMountRef.current = true;
    sendOtp();
  }, [sendOtpOnMount, sendOtp]);

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.length !== 6) return;
    setIsLoading(true);
    setError(null);
    try {
      const body: Record<string, string> = { linkId, email, code: code! };
      if (viewId) body.viewId = viewId;
      const res = await fetch("/api/links/download/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Invalid code");
        return;
      }
      onVerified();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(
      () => setResendCooldown((s) => Math.max(0, s - 1)),
      1000,
    );
    return () => clearInterval(t);
  }, [resendCooldown]);

  return (
    <form onSubmit={verifyOtp} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        We sent a 6-digit code to <strong>{email}</strong>. Enter it below to
        verify and receive download notifications.
      </p>
      <InputOTP
        maxLength={6}
        pattern={REGEXP_ONLY_DIGITS}
        value={code ?? ""}
        onChange={(v) => {
          setError(null);
          setCode(v || null);
        }}
        containerClassName="my-4"
        accentColor="#e5e5e5"
      >
        <InputOTPGroup className="[&>div]:border-input [&>div]:text-foreground [&>div]:caret-foreground">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <InputOTPSlot key={index} index={index} />
          ))}
        </InputOTPGroup>
      </InputOTP>
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="submit"
          disabled={!code || code.length !== 6 || isLoading}
        >
          {isLoading ? "Verifying..." : "Verify"}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Didn&apos;t receive the email?{" "}
        <Button
          type="button"
          variant="link"
          className="h-auto p-0 text-sm font-normal text-muted-foreground underline"
          disabled={isSending || resendCooldown > 0}
          onClick={sendOtp}
        >
          {isSending
            ? "Sending..."
            : resendCooldown > 0
              ? `Resend code (${resendCooldown}s)`
              : "Resend code"}
        </Button>
      </p>
    </form>
  );
}

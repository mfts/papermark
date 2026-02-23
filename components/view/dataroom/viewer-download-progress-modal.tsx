"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileArchive,
  Loader2,
  XCircle,
} from "lucide-react";

import { DownloadOtpVerification } from "./download-otp-verification";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

export type ViewerDownloadProgressModalProps = {
  isOpen: boolean;
  onClose: () => void;
  linkId: string;
  viewId: string;
  viewerEmail: string;
  dataroomName: string;
  dataroomId?: string;
  downloadsPageUrl: string;
  initialJobId?: string | null;
  /** When set, the modal downloads a single folder instead of the entire dataroom */
  folderId?: string | null;
  folderName?: string | null;
};

type Step = "choose" | "otp" | "progress" | "complete";

interface JobStatus {
  id: string;
  status: string;
  progress: number;
  totalFiles: number;
  processedFiles: number;
  downloadUrls?: string[];
  error?: string;
  isReady: boolean;
  dataroomName: string;
  createdAt: string;
  completedAt?: string;
  expiresAt?: string;
}

export function ViewerDownloadProgressModal({
  isOpen,
  onClose,
  linkId,
  viewId,
  viewerEmail,
  dataroomName,
  dataroomId,
  downloadsPageUrl,
  initialJobId,
  folderId,
  folderName,
}: ViewerDownloadProgressModalProps) {
  const isFolderDownload = !!folderId;
  const [step, setStep] = useState<Step>("choose");
  const [wantEmail, setWantEmail] = useState(false);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [jobId, setJobId] = useState<string | null>(initialJobId ?? null);
  const [otpKey, setOtpKey] = useState(0);
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const fetchVerified = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/links/download/verify?linkId=${encodeURIComponent(linkId)}`,
        { credentials: "include" },
      );
      if (res.ok) {
        const data = await res.json();
        setVerified(!!data.verified);
        return !!data.verified;
      }
      setVerified(false);
      return false;
    } catch {
      setVerified(false);
      return false;
    }
  }, [linkId]);

  useEffect(() => {
    if (!isOpen) return;
    setStep(initialJobId ? "progress" : "choose");
    setJobId(initialJobId ?? null);
    setStatus(null);
    setError(null);
    if (initialJobId) {
      setIsPolling(true);
    } else {
      fetchVerified();
    }
  }, [isOpen, initialJobId, fetchVerified]);

  const fetchStatus = useCallback(
    async (id: string) => {
      const res = await fetch(
        `/api/links/download/${id}?linkId=${encodeURIComponent(linkId)}`,
        { credentials: "include" },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to fetch status");
      }
      return res.json();
    },
    [linkId],
  );

  useEffect(() => {
    if (!isOpen || !jobId || !isPolling) return;
    const poll = async () => {
      try {
        const data = await fetchStatus(jobId);
        setStatus(data);
        setError(null);
        if (data.status === "COMPLETED" || data.status === "FAILED") {
          setIsPolling(false);
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error");
      }
    };
    poll();
    pollRef.current = setInterval(poll, 2000);
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [isOpen, jobId, isPolling, fetchStatus]);

  const startDownload = async (withEmail: boolean) => {
    setIsStarting(true);
    setError(null);
    try {
      const endpoint = isFolderDownload
        ? "/api/links/download/dataroom-folder"
        : "/api/links/download/bulk";

      const body = isFolderDownload
        ? { folderId, dataroomId, viewId, linkId, emailNotification: withEmail }
        : { linkId, viewId, emailNotification: withEmail };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to start download");
        return;
      }
      if (data.jobId) {
        setJobId(data.jobId);
        setStep("progress");
        setIsPolling(true);
      }
    } finally {
      setIsStarting(false);
    }
  };

  const handleStartClick = () => {
    if (wantEmail && verified === false) {
      setStep("otp");
      setOtpKey((k) => k + 1);
      return;
    }
    startDownload(!!wantEmail);
  };

  const handleOtpVerified = () => {
    setVerified(true);
    setStep("choose");
    // Defer bulk request so the browser has committed any Set-Cookie from the verify response
    setTimeout(() => {
      startDownload(true);
    }, 0);
  };

  const handleDownload = (url: string) => {
    // Ensure we use a relative path so the request goes to the current origin
    // (where the session cookie lives), not a potentially different subdomain.
    let href = url;
    try {
      const parsed = new URL(url, window.location.origin);
      href = parsed.pathname + parsed.search;
    } catch {
      // url is already relative, use as-is
    }
    const a = document.createElement("a");
    a.href = href;
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => document.body.removeChild(a), 100);
  };

  const handleDownloadAll = async (urls: string[]) => {
    if (downloadProgress) return;
    setDownloadProgress({ current: 0, total: urls.length });
    for (let i = 0; i < urls.length; i++) {
      setDownloadProgress({ current: i + 1, total: urls.length });
      handleDownload(urls[i]);
      if (i < urls.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
    setDownloadProgress(null);
  };

  const handleClose = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setStep("choose");
    setJobId(null);
    setStatus(null);
    setError(null);
    setIsPolling(false);
    onClose();
  };

  const formatExpirationTime = (expiresAt?: string) => {
    if (!expiresAt) return null;
    const expires = new Date(expiresAt);
    const now = new Date();
    const diffMs = expires.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? "s" : ""}`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? "s" : ""}`;
    return "less than an hour";
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isFolderDownload
              ? `Download folder: ${folderName}`
              : `Download ${dataroomName || "Dataroom"}`}
          </DialogTitle>
          <DialogDescription>
            {step === "choose" &&
              "Start the download. You can optionally get an email when it's ready."}
            {step === "otp" && "Verify your email to receive download notifications."}
            {step === "progress" &&
              (status?.status === "COMPLETED"
                ? "Your files are ready to download."
                : "Preparing your files...")}
          </DialogDescription>
        </DialogHeader>

        {step === "choose" && (
          <div className="space-y-4 py-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={wantEmail}
                onChange={(e) => setWantEmail(e.target.checked)}
              />
              Notify me by email when the download is ready
            </label>
            {wantEmail && verified === false && (
              <p className="text-xs text-muted-foreground">
                You’ll need to verify your email with a one-time code first.
              </p>
            )}
            <div className="flex gap-2">
              <Button
                onClick={handleStartClick}
                disabled={isStarting}
              >
                {isStarting ? "Starting..." : "Start download"}
              </Button>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              <a
                href={downloadsPageUrl}
                className="underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                View your downloads
              </a>
            </p>
          </div>
        )}

        {step === "otp" && (
          <DownloadOtpVerification
            key={otpKey}
            linkId={linkId}
            viewId={viewId}
            email={viewerEmail}
            onVerified={handleOtpVerified}
            sendOtpOnMount
          />
        )}

        {step === "progress" && (
          <div className="space-y-4 py-4">
            <div className="flex justify-center">
              {status?.status === "COMPLETED" ? (
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              ) : status?.status === "FAILED" ? (
                <XCircle className="h-10 w-10 text-destructive" />
              ) : (
                <FileArchive className="h-10 w-10 animate-pulse text-primary" />
              )}
            </div>
            <p className="text-center text-sm text-muted-foreground">
              {!status
                ? "Starting..."
                : status.status === "PENDING"
                  ? "Preparing..."
                  : status.status === "PROCESSING"
                    ? `Processing ${status.processedFiles} of ${status.totalFiles} files...`
                    : status.status === "COMPLETED"
                      ? "Your download is ready!"
                      : status.error ?? "Download failed."}
            </p>
            {(status?.status === "PROCESSING" || status?.status === "PENDING") && (
              <Progress value={status?.progress ?? 0} className="h-2" />
            )}
            {status?.status === "COMPLETED" && status.downloadUrls && status.downloadUrls.length > 0 && (
              <div className="space-y-2">
                {status.downloadUrls.length === 1 ? (
                  <Button
                    className="w-full"
                    onClick={() => handleDownload(status.downloadUrls![0])}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download ZIP
                  </Button>
                ) : (
                  <>
                    <Button
                      className="w-full"
                      disabled={!!downloadProgress}
                      onClick={() => handleDownloadAll(status.downloadUrls!)}
                    >
                      {downloadProgress ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Downloading {downloadProgress.current} of{" "}
                          {downloadProgress.total}...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Download all ({status.downloadUrls.length} parts)
                        </>
                      )}
                    </Button>
                    <div className="max-h-32 space-y-1 overflow-y-auto">
                      {status.downloadUrls.map((url, i) => (
                        <Button
                          key={i}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => handleDownload(url)}
                        >
                          Part {i + 1}
                        </Button>
                      ))}
                    </div>
                  </>
                )}
                {status.expiresAt && (
                  <p className="text-center text-xs text-muted-foreground">
                    Expires in {formatExpirationTime(status.expiresAt)}
                  </p>
                )}
              </div>
            )}
            {(status?.status === "PENDING" || status?.status === "PROCESSING") && (
              <DialogFooter>
                <p className="text-xs text-muted-foreground">
                  {wantEmail
                    ? "You can close this. We’ll email you when it’s ready."
                    : "You can close this. Check back on the downloads page when it’s ready."}
                </p>
              </DialogFooter>
            )}
            {status?.status === "FAILED" && (
              <Button variant="outline" onClick={() => setStep("choose")}>
                Try again
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
              <a href={downloadsPageUrl} className="underline" target="_blank" rel="noopener noreferrer">
                Open downloads page
              </a>
            </p>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
        )}

        {error && step !== "progress" && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

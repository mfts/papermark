import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";

import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  FileArchive,
  FolderOpen,
  Loader2,
} from "lucide-react";

import prisma from "@/lib/prisma";

import { DownloadOtpVerification } from "@/components/view/dataroom/download-otp-verification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Job = {
  id: string;
  status: string;
  progress: number;
  totalFiles: number;
  processedFiles: number;
  downloadUrls?: string[];
  error?: string;
  dataroomName: string;
  type?: "bulk" | "folder";
  folderName?: string;
  createdAt: string;
  expiresAt?: string;
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const domain = context.params?.domain as string;
  const slug = context.params?.slug as string;
  if (!domain || !slug) {
    return { notFound: true };
  }
  const link = await prisma.link.findUnique({
    where: {
      domainSlug_slug: { slug, domainSlug: domain },
    },
    select: { id: true },
  });
  if (!link) {
    return { notFound: true };
  }
  return { props: { linkId: link.id, domain, slug } };
};

export default function DomainDownloadsPage({
  linkId: linkIdProp,
  domain,
  slug,
}: {
  linkId: string;
  domain: string;
  slug: string;
}) {
  const router = useRouter();
  const linkId =
    (router.query.linkId as string) ??
    (router.query.slug ? linkIdProp : undefined) ??
    linkIdProp;

  const [loading, setLoading] = useState(true);
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [viewId, setViewId] = useState<string | null>(null);
  const [step, setStep] = useState<"session" | "email" | "otp" | "list">("session");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  const checkSession = useCallback(async () => {
    if (!linkId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/links/download/verify?linkId=${encodeURIComponent(linkId)}`,
        { credentials: "include" },
      );
      if (res.ok) {
        setHasSession(true);
        setStep("list");
        return;
      }
      setHasSession(false);
      setStep("email");
    } catch {
      setHasSession(false);
      setStep("email");
    } finally {
      setLoading(false);
    }
  }, [linkId]);

  useEffect(() => {
    if (!linkId) return;
    checkSession();
  }, [linkId, checkSession]);

  const fetchJobs = useCallback(async () => {
    if (!linkId) return;
    setJobsLoading(true);
    try {
      const res = await fetch(
        `/api/links/download/jobs?linkId=${encodeURIComponent(linkId)}`,
        { credentials: "include" },
      );
      if (res.ok) {
        const data = await res.json();
        setJobs(Array.isArray(data) ? data : []);
      } else {
        setJobs([]);
      }
    } catch {
      setJobs([]);
    } finally {
      setJobsLoading(false);
    }
  }, [linkId]);

  useEffect(() => {
    if (step === "list" && linkId) {
      fetchJobs();
    }
  }, [step, linkId, fetchJobs]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkId || !email.trim()) return;
    setError(null);
    try {
      const res = await fetch(
        `/api/links/download/by-email?linkId=${encodeURIComponent(linkId)}&email=${encodeURIComponent(email.trim())}`,
      );
      if (!res.ok) {
        setError("No access found for this email. Use the email you used to open the dataroom.");
        return;
      }
      const data = await res.json();
      setViewId(data.viewId);
      setStep("otp");
    } catch {
      setError("Something went wrong.");
    }
  };

  const handleOtpVerified = () => {
    setHasSession(true);
    setStep("list");
  };

  const handleDownload = (url: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => document.body.removeChild(a), 100);
  };

  const formatExpiration = (expiresAt?: string) => {
    if (!expiresAt) return "";
    const exp = new Date(expiresAt);
    const now = new Date();
    const d = Math.floor((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (d > 0) return `${d} day${d > 1 ? "s" : ""}`;
    const h = Math.floor((exp.getTime() - now.getTime()) / (1000 * 60 * 60));
    return h > 0 ? `${h} hour${h > 1 ? "s" : ""}` : "soon";
  };

  const getJobTitle = (job: Job) => {
    if (job.type === "folder" && job.folderName) {
      return (
        <>
          <span className="font-medium">{job.dataroomName}</span>
          <span className="text-muted-foreground">
            {" "}
            — <FolderOpen className="mr-0.5 inline h-3.5 w-3" />
            Folder: {job.folderName}
          </span>
        </>
      );
    }
    return (
      <>
        <span className="font-medium">{job.dataroomName}</span>
        {job.type === "bulk" && (
          <span className="text-muted-foreground"> — Full dataroom</span>
        )}
      </>
    );
  };

  const handleDownloadAll = (urls: string[]) => {
    urls.forEach((url, i) => {
      setTimeout(() => handleDownload(url), i * 300);
    });
  };

  if (!linkId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (step === "email") {
    return (
      <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
        <h1 className="text-xl font-semibold">View your downloads</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter the email you used to access this dataroom.
        </p>
        <form onSubmit={handleEmailSubmit} className="mt-6 space-y-4">
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full">
            Continue
          </Button>
        </form>
      </div>
    );
  }

  if (step === "otp" && viewId) {
    return (
      <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
        <h1 className="text-xl font-semibold">Verify your email</h1>
        <DownloadOtpVerification
          linkId={linkId}
          viewId={viewId}
          email={email.trim()}
          onVerified={handleOtpVerified}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 py-10">
      <h1 className="text-xl font-semibold">Your downloads</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Download your prepared files below. Links expire after 3 days.
      </p>

      {jobsLoading ? (
        <div className="mt-8 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : jobs.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">
          You have no downloads yet. Start a download from the dataroom to see it here.
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {jobs.map((job) => (
            <li
              key={job.id}
              className="flex flex-col gap-2 rounded-lg border p-4"
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1 text-sm">
                  {getJobTitle(job)}
                </div>
                <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                  {new Date(job.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {job.status === "COMPLETED" ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                ) : job.status === "PROCESSING" || job.status === "PENDING" ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
                ) : (
                  <FileArchive className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <span className="text-muted-foreground">
                  {job.status === "COMPLETED"
                    ? "Ready"
                    : job.status === "PROCESSING"
                      ? `${job.processedFiles} / ${job.totalFiles} files`
                      : job.status}
                </span>
              </div>
              {job.status === "COMPLETED" &&
                job.downloadUrls &&
                job.downloadUrls.length > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {job.downloadUrls.length === 1 ? (
                      <Button
                        size="sm"
                        onClick={() => handleDownload(job.downloadUrls![0])}
                      >
                        <Download className="mr-1 h-3 w-3" />
                        Download
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setExpandedJobId(
                              expandedJobId === job.id ? null : job.id,
                            )
                          }
                        >
                          {expandedJobId === job.id ? (
                            <>
                              <ChevronUp className="mr-1 h-3 w-3" />
                              Hide parts
                            </>
                          ) : (
                            <>
                              <ChevronDown className="mr-1 h-3 w-3" />
                              Show parts ({job.downloadUrls!.length})
                            </>
                          )}
                        </Button>
                        {expandedJobId === job.id && (
                          <div className="w-full space-y-2 rounded-md border bg-muted/30 p-3">
                            <Button
                              size="sm"
                              className="w-full"
                              onClick={() =>
                                handleDownloadAll(job.downloadUrls!)
                              }
                            >
                              <Download className="mr-2 h-3 w-3" />
                              Download all ({job.downloadUrls!.length} parts)
                            </Button>
                            <p className="text-xs text-muted-foreground">
                              Or download individually:
                            </p>
                            <div className="max-h-32 space-y-1 overflow-y-auto">
                              {job.downloadUrls!.map((url, i) => (
                                <Button
                                  key={i}
                                  variant="outline"
                                  size="sm"
                                  className="w-full justify-start"
                                  onClick={() => handleDownload(url)}
                                >
                                  <FileArchive className="mr-2 h-3 w-3" />
                                  Part {i + 1} of{" "}
                                  {job.downloadUrls!.length}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    {job.expiresAt && (
                      <span className="text-xs text-muted-foreground">
                        Expires {formatExpiration(job.expiresAt)}
                      </span>
                    )}
                  </div>
                )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useDomainStatus } from "./use-domain-status";
import { getSubdomain } from "@/lib/domains";
import { cn } from "@/lib/utils";
import { copyToClipboard } from "@/lib/utils";

export const InlineSnippet = ({
  className,
  children,
}: {
  className?: string;
  children: string;
}) => {
  return (
    <span
      className={cn(
        "inline-block rounded-md bg-blue-100 px-1 py-0.5 font-mono text-blue-900 dark:bg-blue-900 dark:text-blue-100",
        className
      )}
    >
      {children}
    </span>
  );
};
export default function DomainConfiguration({ domain }: { domain: string }) {
  const { status, domainJson, emailDNSRecords } = useDomainStatus({ domain });
  console.log("doinsdviansvlsanv"); 
  console.log(emailDNSRecords);

  const subdomain = domainJson ? getSubdomain(domainJson.name, domainJson.apexName) : null;
  const [recordType, setRecordType] = useState<"CNAME" | "A" | "EMAIL">(!!subdomain ? "CNAME" : "A");

  if (!(status?.domainStatus) ||
    (status.domainStatus === "Valid Configuration" && status.domainEmailDNSStatus === "Valid Email DNS Configuration") ||
    !domainJson) return null;

  const txtVerification =
    (status.domainStatus === "Pending Verification" &&
      domainJson.verification.find((x: any) => x.type === "TXT")) ||
    null;

  const resendDomainKey = (emailDNSRecords?.find((x: any) => x.record === "DKIM"))?.value ||
    null;
  
  console.log("resend " + resendDomainKey);

  return (
    <div className="border-t border-gray-200 pb-5 pt-7 dark:border-gray-700">
      {txtVerification ? (
        <>
          <div className="flex justify-start space-x-4">
            <button
              type="button"
              onClick={() => setRecordType("A")}
              className={`${recordType == "A"
                ? "border-black text-black dark:border-white dark:text-white"
                : " text-stone-400 dark:text-stone-600"
                } ease border-b-2 pb-1 text-sm transition-all duration-150`}
            >
              Domain Configurations
            </button>
            <button
              type="button"
              onClick={() => setRecordType("EMAIL")}
              className={`${recordType == "EMAIL"
                ? "border-black text-black dark:border-white dark:text-white"
                : " text-stone-400 dark:text-stone-600"
                } ease border-b-2 pb-1 text-sm transition-all duration-150`}
            >
              Email Configurations{subdomain && " (recommended)"}
            </button>
          </div>
          <div className="my-3 text-left">
            <p className="text-sm dark:text-white">
              Please set the following {recordType === "EMAIL" ? "" : "TXT"} record{recordType === "EMAIL" ? "s" : ""} on{" "}
              <InlineSnippet>{domainJson.apexName}</InlineSnippet>
              {recordType === "EMAIL"
                ? ' to start sending emails using the domain '
                : ' to prove ownership of '
              }
              <InlineSnippet>{domainJson.name}</InlineSnippet>{" :"}
            </p>
            <div className="my-5 flex items-start justify-start space-x-10 rounded-md bg-gray-50 p-2 dark:bg-gray-800 dark:text-white">
              <div>
                <p className="text-sm font-bold">Type</p>
                <p className="mt-2 font-mono text-sm">{recordType === "EMAIL" ? "MX" : "TXT"}</p>
                {
                  recordType === "EMAIL" &&
                  <div>
                    <p className="mt-2 font-mono text-sm">TXT</p>
                    <p className="mt-2 font-mono text-sm">TXT</p>
                  </div>
                }
              </div>
              <div>
                <p className="text-sm font-bold">Name{recordType === "EMAIL" ? "/Host" : ""}</p>
                <p className="mt-2 font-mono text-sm">
                  {recordType === "EMAIL" ? "send" : (
                    txtVerification.domain.slice(0, txtVerification.domain.length - domainJson.apexName.length - 1)
                  )}
                </p>
                {
                  recordType === "EMAIL" &&
                  <div>
                    <p className="mt-2 font-mono text-sm">
                      send
                    </p>
                    <p className="mt-2 font-mono text-sm">
                      resend._domainkey
                    </p>
                  </div>
                }
              </div>
              <div>
                <p className="text-sm font-bold">Value</p>
                <p className="mt-2 font-mono text-sm">
                  {recordType === "EMAIL"
                    ? `feedback-smtp.us-east-1.amazonses.com`
                    : txtVerification.value
                  }
                </p>
                {
                  recordType === "EMAIL" &&
                  <div>
                    <p className="mt-2 font-mono text-sm">
                      {`v=spf1 include:amazonses.com ~all`}
                    </p>
                    <p className="mt-2 font-mono text-sm"
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        copyToClipboard(resendDomainKey || "",
                          "Text copied to clipboard successfuly");
                      }}
                    >
                      {resendDomainKey?.substring(0, 35) + "..."}
                    </p>
                  </div>
                }

              </div>
              {recordType === "EMAIL" &&
                <div>
                  <p className="text-sm font-bold">Priority</p>
                  <p className="mt-2 font-mono text-sm">10</p>
                  <p className="mt-2 font-mono text-sm">{"-"}</p>
                  <p className="mt-2 font-mono text-sm">{"-"}</p>
                </div>
              }
              {recordType === "EMAIL" &&
                <div>
                  <p className="text-sm font-bold">TTL</p>
                  <p className="mt-2 font-mono text-sm">86400</p>
                  <p className="mt-2 font-mono text-sm">86400</p>
                  <p className="mt-2 font-mono text-sm">86400</p>
                </div>
              }
            </div>
            <p className="text-sm dark:text-muted-foreground">
              Warning: if you are using this domain for another site, setting this
              TXT record will transfer domain ownership away from that site and
              break it. Please exercise caution when setting this record.
            </p>
          </div>
        </>
      ) : status.domainStatus === "Unknown Error" ? (
        <p className="mb-5 text-sm dark:text-white">
          {domainJson.error.message}
        </p>
      ) : (
        <>
          <div className="flex justify-start space-x-4">
            <button
              type="button"
              onClick={() => setRecordType("A")}
              className={`${recordType == "A"
                ? "border-black text-black dark:border-white dark:text-white"
                : " text-stone-400 dark:text-stone-600"
                } ease border-b-2 pb-1 text-sm transition-all duration-150`}
            >
              A Record{!subdomain && " (recommended)"}
            </button>
            <button
              type="button"
              onClick={() => setRecordType("CNAME")}
              className={`${recordType == "CNAME"
                ? "border-black text-black dark:border-white dark:text-white"
                : " text-stone-400 dark:text-stone-600"
                } ease border-b-2 pb-1 text-sm transition-all duration-150`}
            >
              CNAME Record{subdomain && " (recommended)"}
            </button>
            <button
              type="button"
              onClick={() => setRecordType("EMAIL")}
              className={`${recordType == "EMAIL"
                ? "border-black text-black dark:border-white dark:text-white"
                : " text-stone-400 dark:text-stone-600"
                } ease border-b-2 pb-1 text-sm transition-all duration-150`}
            >
              Email Configurations{subdomain && " (recommended)"}
            </button>
          </div>
          <div className="my-3 text-left">
            <p className="my-5 text-sm dark:text-white">
              To configure your{" "}
              {recordType === "A" ? "apex domain" : recordType === "CNAME" ? "subdomain" : "email (sending emails)"} (
              <InlineSnippet>
                {recordType === "A" ? domainJson.apexName : domainJson.name}
              </InlineSnippet>
              ), set the following {recordType === "EMAIL" ? "" : recordType} record{recordType === "EMAIL" ? "s" : ""} on your DNS provider to
              continue:
            </p>
            <div className="flex items-center justify-start space-x-10 rounded-md bg-gray-50 p-2 dark:bg-gray-800 dark:text-white">
              <div>
                <p className="text-sm font-bold">Type</p>
                <p className="mt-2 font-mono text-sm">{recordType === "EMAIL" ? "MX" : recordType}</p>
                {
                  recordType === "EMAIL" &&
                  <div>
                    <p className="mt-2 font-mono text-sm">TXT</p>
                    <p className="mt-2 font-mono text-sm">TXT</p>
                  </div>
                }
              </div>
              <div>
                <p className="text-sm font-bold">Name{recordType === "EMAIL" ? "/Host" : ""}</p>
                <p className="mt-2 font-mono text-sm">
                  {recordType === "A" ? "@" : recordType === "EMAIL" ? "send" : subdomain ?? "www"}
                </p>
                {
                  recordType === "EMAIL" &&
                  <div>
                    <p className="mt-2 font-mono text-sm">
                      send
                    </p>
                    <p className="mt-2 font-mono text-sm">
                      resend._domainkey
                    </p>
                  </div>
                }
              </div>
              <div>
                <p className="text-sm font-bold">Value</p>
                <p className="mt-2 font-mono text-sm">
                  {recordType === "A"
                    ? `76.76.21.21`
                    : recordType === "CNAME"
                      ? `cname.vercel-dns.com`
                      : `feedback-smtp.us-east-1.amazonses.com`
                  }
                </p>
                {
                  recordType === "EMAIL" &&
                  <div>
                    <p className="mt-2 font-mono text-sm">
                      {`v=spf1 include:amazonses.com ~all`}
                    </p>
                    <p className="mt-2 font-mono text-sm"
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        copyToClipboard(resendDomainKey || "", "Text copied to clipboard successfuly");
                      }}
                    >
                      {resendDomainKey?.substring(0, 35) + "..."}
                    </p>
                  </div>
                }
              </div>
              {
                recordType === "EMAIL" &&
                <div>
                  <p className="text-sm font-bold">Priority</p>
                  <p className="mt-2 font-mono text-sm">10</p>
                  <p className="mt-2 font-mono text-sm">{"-"}</p>
                  <p className="mt-2 font-mono text-sm">{"-"}</p>
                </div>
              }
              <div>
                <p className="text-sm font-bold">TTL</p>
                <p className="mt-2 font-mono text-sm">86400</p>
                {
                  recordType === "EMAIL" &&
                  <div>
                    <p className="mt-2 font-mono text-sm">86400</p>
                    <p className="mt-2 font-mono text-sm">86400</p>
                  </div>
                }
              </div>
            </div>
            <p className="mt-5 text-sm dark:text-white">
              Note: for TTL, if <InlineSnippet>86400</InlineSnippet> is not
              available, set the highest value possible. Also, domain
              propagation can take up to an hour.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
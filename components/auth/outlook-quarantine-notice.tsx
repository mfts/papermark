"use client";

import { useState } from "react";

import { ChevronDown, ChevronUp, InfoIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface OutlookQuarantineNoticeProps {
  provider: "outlook" | "secureserver";
  className?: string;
}

export function OutlookQuarantineNotice({
  provider,
  className,
}: OutlookQuarantineNoticeProps) {
  const [isOpen, setIsOpen] = useState(false);

  const providerName =
    provider === "outlook" ? "Microsoft 365" : "Secureserver (GoDaddy)";

  return (
    <div
      className={cn(
        "mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm",
        className,
      )}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-start gap-2">
          <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
          <div className="flex-1">
            <p className="text-blue-800">
              <span className="font-medium">Using {providerName}?</span> If you
              don&apos;t receive the login email within a minute, it may be in
              your organization&apos;s quarantine.
            </p>

            <CollapsibleTrigger className="mt-2 flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700">
              {isOpen ? "Hide" : "Show"} how to release quarantined emails
              {isOpen ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-3 space-y-4 text-xs text-blue-700">
              <div>
                <p className="mb-2 font-semibold text-blue-800">
                  Option 1 – Release quarantined messages
                </p>
                <ol className="ml-4 list-decimal space-y-1">
                  <li>
                    Go to{" "}
                    <a
                      href="https://security.microsoft.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-blue-800"
                    >
                      security.microsoft.com
                    </a>
                  </li>
                  <li>
                    Navigate to{" "}
                    <span className="font-medium">
                      Email & collaboration → Review → Quarantine
                    </span>
                  </li>
                  <li>Select the quarantined message</li>
                  <li>Click Release</li>
                  <li>
                    Choose:{" "}
                    <span className="italic">
                      &quot;Report message as false positive&quot;
                    </span>{" "}
                    and{" "}
                    <span className="italic">
                      &quot;Allow similar messages in the future&quot;
                    </span>{" "}
                    (if shown)
                  </li>
                </ol>
              </div>

              <div>
                <p className="mb-2 font-semibold text-blue-800">
                  Option 2 – Allowlist our emails (recommended)
                </p>
                <p className="mb-2 text-blue-600">
                  If you have admin access:
                </p>
                <ol className="ml-4 list-decimal space-y-1">
                  <li>
                    In Microsoft 365 Defender, go to{" "}
                    <span className="font-medium">
                      Email & collaboration → Policies & rules
                    </span>
                  </li>
                  <li>
                    Open <span className="font-medium">Tenant Allow/Block List</span>
                  </li>
                  <li>Add our sending domain and/or sending IP as Allow</li>
                  <li>Apply it to the entire organization</li>
                </ol>
                <p className="mt-2 text-blue-600">
                  This prevents future messages from being quarantined.
                </p>
              </div>
            </CollapsibleContent>
          </div>
        </div>
      </Collapsible>
    </div>
  );
}

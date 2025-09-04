import { Fragment, useState } from "react";

import { InfoIcon } from "lucide-react";

import { getSubdomain } from "@/lib/domains";
import { DomainVerificationStatusProps } from "@/lib/types";
import { cn } from "@/lib/utils";

import { CopyButton } from "../ui/copy-button";
import { TabSelect } from "../ui/tab-select";

export default function DomainConfiguration({
  status,
  response,
}: {
  status: DomainVerificationStatusProps;
  response: { domainJson: any; configJson: any };
}) {
  const { domainJson, configJson } = response;
  const subdomain = getSubdomain(domainJson.name, domainJson.apexName);
  const [recordType, setRecordType] = useState(!!subdomain ? "CNAME" : "A");

  if (status === "Conflicting DNS Records") {
    return (
      <div className="pt-5">
        <div className="flex justify-start space-x-4">
          <div className="ease border-b-2 border-black pb-1 text-sm text-foreground transition-all duration-150">
            {configJson?.conflicts.some((x: any) => x.type === "A")
              ? "A Record (recommended)"
              : "CNAME Record (recommended)"}
          </div>
        </div>
        <DnsRecord
          instructions="Please remove the following conflicting DNS records from your DNS provider:"
          records={configJson?.conflicts.map(
            ({
              name,
              type,
              value,
            }: {
              name: string;
              type: string;
              value: string;
            }) => ({
              name,
              type,
              value,
            }),
          )}
        />
        <DnsRecord
          instructions="Afterwards, set the following record on your DNS provider:"
          records={[
            {
              type: recordType,
              name: recordType === "A" ? "@" : (subdomain ?? "www"),
              value:
                recordType === "A" ? `76.76.21.21` : `cname.vercel-dns.com`,
              ttl: "86400",
            },
          ]}
        />
      </div>
    );
  }

  if (status === "Unknown Error") {
    return (
      <div className="pt-5">
        <p className="mb-5 text-sm">{response.domainJson.error.message}</p>
      </div>
    );
  }

  const txtVerification =
    status === "Pending Verification"
      ? domainJson.verification.find((x: any) => x.type === "TXT")
      : undefined;

  return (
    <div className="pt-2">
      <div className="-ml-1.5 border-b border-gray-200 dark:border-gray-400">
        <TabSelect
          options={[
            { id: "A", label: `A Record${!subdomain ? " (recommended)" : ""}` },
            {
              id: "CNAME",
              label: `CNAME Record${subdomain ? " (recommended)" : ""}`,
            },
          ]}
          selected={recordType}
          onSelect={setRecordType}
        />
      </div>

      <DnsRecord
        instructions={`To configure your ${
          recordType === "A" ? "apex domain" : "subdomain"
        } <code>${
          recordType === "A" ? domainJson.apexName : domainJson.name
        }</code>, set the following ${txtVerification ? "records" : `${recordType} record`} on your DNS provider:`}
        records={[
          {
            type: recordType,
            name: recordType === "A" ? "@" : (subdomain ?? "www"),
            value:
              recordType === "A"
                ? (configJson?.recommendedIPv4?.[0]?.value?.[0] ??
                  "76.76.21.21")
                : (configJson?.recommendedCNAME?.[0]?.value ??
                  "cname.vercel-dns.com"),
            ttl: "86400",
          },
          ...(txtVerification
            ? [
                {
                  type: txtVerification.type,
                  name: txtVerification.domain.slice(
                    0,
                    txtVerification.domain.length -
                      domainJson.apexName.length -
                      1,
                  ),
                  value: txtVerification.value,
                },
              ]
            : []),
        ]}
        warning={
          txtVerification
            ? "Warning: if you are using this domain for another site, setting this TXT record will transfer domain ownership away from that site and break it. Please exercise caution when setting this record; make sure that the domain that is shown in the TXT verification value is actually the <b><i>domain you want to use on Papermark</i></b> – <b><i>not your production site</i></b>."
            : undefined
        }
      />
    </div>
  );
}

const MarkdownText = ({ text }: { text: string }) => {
  return (
    <p
      className="prose-sm max-w-none prose-code:rounded-md prose-code:bg-gray-100 prose-code:p-1 prose-code:font-mono prose-code:text-[.8125rem] prose-code:font-medium prose-code:text-gray-900"
      dangerouslySetInnerHTML={{ __html: text }}
    />
  );
};

const DnsRecord = ({
  instructions,
  records,
  warning,
}: {
  instructions: string;
  records: { type: string; name: string; value: string; ttl?: string }[];
  warning?: string;
}) => {
  const hasTtl = records.some((x) => x.ttl);

  return (
    <div className="mt-3 text-left text-gray-600 dark:text-gray-400">
      <div className="my-5">
        <MarkdownText text={instructions} />
      </div>
      <div
        className={cn(
          "grid items-end gap-x-10 gap-y-1 overflow-x-auto rounded-lg bg-gray-100/80 p-4 text-sm scrollbar-hide",
          hasTtl
            ? "grid-cols-[repeat(4,max-content)]"
            : "grid-cols-[repeat(3,max-content)]",
        )}
      >
        {["Type", "Name", "Value"].concat(hasTtl ? "TTL" : []).map((s) => (
          <p key={s} className="font-medium text-gray-950">
            {s}
          </p>
        ))}

        {records.map((record, idx) => (
          <Fragment key={idx}>
            <p key={record.type} className="font-mono">
              {record.type}
            </p>
            <p key={record.name} className="font-mono">
              {record.name}
            </p>
            <p key={record.value} className="flex items-end gap-1 font-mono">
              {record.value}{" "}
              <CopyButton
                variant="neutral"
                className="-mb-0.5"
                value={record.value}
              />
            </p>
            {hasTtl && (
              <p key={record.ttl} className="font-mono">
                {record.ttl}
              </p>
            )}
          </Fragment>
        ))}
      </div>
      {(warning || hasTtl) && (
        <div
          className={cn(
            "mt-4 flex items-center gap-2 rounded-lg p-3",
            warning
              ? "bg-orange-50 text-orange-600"
              : "bg-indigo-50 text-indigo-600",
          )}
        >
          <InfoIcon className="h-5 w-5 shrink-0" />
          <MarkdownText
            text={
              warning ||
              "If a TTL value of 86400 is not available, choose the highest available value. Domain propagation may take up to 12 hours."
            }
          />
        </div>
      )}
    </div>
  );
};

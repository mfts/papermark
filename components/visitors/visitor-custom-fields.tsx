import { Fragment } from "react";

import useSWR from "swr";

import { fetcher } from "@/lib/utils";

type CustomFieldResponse = {
  identifier: string;
  label: string;
  response: string;
};

export default function VisitorCustomFields({
  viewId,
  teamId,
  documentId,
}: {
  viewId: string;
  teamId: string;
  documentId: string;
}) {
  const { data: customFieldResponse } = useSWR<CustomFieldResponse[] | null>(
    `/api/teams/${teamId}/documents/${documentId}/views/${viewId}/custom-fields`,
    fetcher,
  );

  console.log("customFieldResponse", customFieldResponse);

  if (!customFieldResponse) return null;

  return (
    <div className="space-y-2 px-1.5 pb-2 md:px-2">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
        {customFieldResponse.map((field, index) => (
          <Fragment key={index}>
            <dt className="text-sm text-muted-foreground">{field.label}</dt>
            <dd className="text-sm">{field.response}</dd>
          </Fragment>
        ))}
      </dl>
    </div>
  );
}

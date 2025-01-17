import { format } from "date-fns";
import { ExternalLink } from "lucide-react";
import useSWR from "swr";

import { fetcher } from "@/lib/utils";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

type ClickEvent = {
  timestamp: string;
  document_id: string;
  dataroom_id: string | null;
  view_id: string;
  page_number: string;
  version_number: number;
  href: string;
};

type ClickEventsResponse = {
  data: ClickEvent[];
};

export default function VisitorClicks({
  teamId,
  documentId,
  viewId,
}: {
  teamId: string;
  documentId: string;
  viewId: string;
}) {
  const { data: clickEvents, error } = useSWR<ClickEventsResponse>(
    `/api/teams/${teamId}/documents/${documentId}/views/${viewId}/click-events`,
    fetcher,
  );

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Link Clicks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-red-500">
            Failed to load click events
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!clickEvents || clickEvents.data.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Link Clicks</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {clickEvents.data.map((event, index) => (
            <div key={index} className="flex items-start space-x-3">
              <ExternalLink className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
              <div className="space-y-1">
                <div className="text-sm">
                  <span className="font-medium">Page {event.page_number}</span>:{" "}
                  <a
                    href={event.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {event.href}
                  </a>
                </div>
                <div className="text-xs text-gray-500">
                  {format(new Date(event.timestamp), "MMM d, yyyy HH:mm:ss")}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

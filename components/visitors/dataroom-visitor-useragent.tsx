import { useDataroomVisitorUserAgent } from "@/lib/swr/use-dataroom-stats";

import VisitorUserAgentBase from "./visitor-useragent-base";

export function DataroomVisitorUserAgent({ viewId }: { viewId: string }) {
  const { userAgent, error } = useDataroomVisitorUserAgent(viewId);

  if (error) {
    return null;
  }

  if (!userAgent) {
    return <div>Loading...</div>;
  }

  return <VisitorUserAgentBase userAgent={userAgent} />;
}

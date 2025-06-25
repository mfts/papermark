import { useVideoVisitorUserAgent } from "@/lib/swr/use-stats";

import VisitorUserAgentBase from "./visitor-useragent-base";

export default function VideoVisitorUserAgent({ viewId }: { viewId: string }) {
  const { userAgent, error } = useVideoVisitorUserAgent(viewId);

  if (error) {
    return null;
  }

  if (!userAgent) {
    return <div className="pb-0.5 pl-1.5 md:pb-1 md:pl-2">Loading...</div>;
  }

  return <VisitorUserAgentBase userAgent={userAgent} />;
}

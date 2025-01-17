import { useVisitorUserAgent } from "@/lib/swr/use-stats";

import VisitorUserAgentBase from "./visitor-useragent-base";

export default function VisitorUserAgent({ viewId }: { viewId: string }) {
  const { userAgent, error } = useVisitorUserAgent(viewId);

  if (error) {
    return (
      <div className="pb-0.5 pl-1.5 text-muted-foreground md:pb-1 md:pl-2">
        No useragent info
      </div>
    );
  }

  if (!userAgent) {
    return <div className="pb-0.5 pl-1.5 md:pb-1 md:pl-2">Loading...</div>;
  }

  return <VisitorUserAgentBase userAgent={userAgent} />;
}

import ErrorPage from "next/error";

import { useVisitorUserAgent } from "@/lib/swr/use-stats";

import UAIcon from "../user-agent-icon";

export default function VisitorUserAgent({ viewId }: { viewId: string }) {
  const { userAgent, error } = useVisitorUserAgent(viewId);

  if (error && error.status === 404) {
    return <ErrorPage statusCode={404} />;
  }

  if (!userAgent) {
    return <div>Loading...</div>;
  }

  const { device, browser, os } = userAgent;

  return (
    <div className="pb-0.5 pl-0.5 md:pb-1 md:pl-1">
      <div className="flex items-center">
        <div className="flex items-center gap-x-1 px-1">
          <UAIcon display={device} type="devices" className="size-4" /> {device}
          ,
        </div>
        <div className="flex items-center gap-x-1 px-1">
          <UAIcon display={browser} type="browsers" className="size-4" />{" "}
          {browser},
        </div>
        <div className="flex items-center gap-x-1 px-1">
          <UAIcon display={os} type="os" className="size-4" /> {os}
        </div>
      </div>
    </div>
  );
}

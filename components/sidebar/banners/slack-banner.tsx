import { useRouter } from "next/router";

import { Dispatch, SetStateAction } from "react";

import Cookies from "js-cookie";
import { usePlausible } from "next-plausible";

import { useAnalytics } from "@/lib/analytics";

import { SlackIcon } from "@/components/shared/icons/slack-icon";
import X from "@/components/shared/icons/x";
import { Button } from "@/components/ui/button";

export default function SlackBanner({
  setShowSlackBanner,
}: {
  setShowSlackBanner: Dispatch<SetStateAction<boolean | null>>;
}) {
  const router = useRouter();
  const plausible = usePlausible();
  const analytics = useAnalytics();

  const handleHideBanner = () => {
    setShowSlackBanner(false);
    plausible("clickedHideSlackBanner");
    Cookies.set("hideSlackBanner", "slack-banner", {
      expires: 30, // Hide for 30 days
    });
  };

  const handleConnectSlack = () => {
    plausible("clickedSlackBanner");
    analytics.capture("Slack Connect Button Clicked", {
      source: "slack_banner",
      location: "sidebar",
    });
    router.push("/settings/slack");
  };

  return (
    <aside className="relative mb-2 flex w-full flex-col justify-center rounded-lg border border-gray-700 bg-background p-4 text-foreground">
      <button
        type="button"
        onClick={handleHideBanner}
        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </button>
      <div className="flex items-center space-x-2">
        <SlackIcon className="h-5 w-5" />
        <span className="text-sm font-bold">Connect Slack</span>
      </div>
      <p className="my-4 text-sm">Get visit notifications in Slack channel.</p>
      <div className="flex">
        <Button
          type="button"
          variant="outline"
          className="grow"
          onClick={handleConnectSlack}
        >
          Set up Slack
        </Button>
      </div>
    </aside>
  );
}

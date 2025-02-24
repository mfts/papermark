import { getSession } from "next-auth/react";
import posthog from "posthog-js";
// import { useEffect } from "react";
// import { useRouter } from "next/router";
import { PostHogProvider } from "posthog-js/react";

import { getPostHogConfig } from "@/lib/posthog";
import { CustomUser } from "@/lib/types";

export const PostHogCustomProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const posthogConfig = getPostHogConfig();
  // const router = useRouter();

  // Check that PostHog is client-side
  if (typeof window !== "undefined" && posthogConfig) {
    posthog.init(posthogConfig.key, {
      api_host: posthogConfig.host,
      ui_host: "https://eu.posthog.com",
      disable_session_recording: true,
      // Enable debug mode in development
      loaded: (posthog) => {
        if (process.env.NODE_ENV === "development") posthog.debug();
        getSession()
          .then((session) => {
            if (session) {
              posthog.identify(
                (session.user as CustomUser).email ??
                  (session.user as CustomUser).id,
                {
                  email: (session.user as CustomUser).email,
                  userId: (session.user as CustomUser).id,
                },
              );
            } else {
              posthog.reset();
            }
          })
          .catch(() => {
            // Do nothing.
          });
      },
    });
  }

  // useEffect(() => {
  //   // Track page views
  //   const handleRouteChange = () => posthog?.capture("$pageview");
  //   router.events.on("routeChangeComplete", handleRouteChange);

  //   return () => {
  //     router.events.off("routeChangeComplete", handleRouteChange);
  //   };
  // }, []);

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
};

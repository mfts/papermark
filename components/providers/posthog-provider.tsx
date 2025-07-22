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
              const user = session.user as CustomUser;
              
              // Identify the user
              posthog.identify(
                user.email ?? user.id,
                {
                  email: user.email,
                  userId: user.id,
                  name: user.name,
                },
              );

              // Fetch user's teams and associate with groups
              fetch("/api/teams")
                .then((res) => res.json())
                .then((teams) => {
                  // Associate user with team groups
                  teams.forEach((team: any) => {
                    posthog.group("team", team.id, {
                      name: team.name,
                      plan: team.plan,
                      created_at: team.createdAt,
                      excel_advanced_mode: team.enableExcelAdvancedMode,
                    });
                  });

                  // Get current team from localStorage for primary group association
                  const currentTeamId = localStorage.getItem("currentTeamId");
                  if (currentTeamId) {
                    const currentTeam = teams.find((t: any) => t.id === currentTeamId);
                    if (currentTeam) {
                      // Set primary group properties
                      posthog.setPersonProperties({
                        current_team_id: currentTeam.id,
                        current_team_name: currentTeam.name,
                        current_team_plan: currentTeam.plan,
                      });
                    }
                  }
                })
                .catch((error) => {
                  console.error("Failed to fetch teams for PostHog groups:", error);
                });
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

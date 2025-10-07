import { useTeam } from "@/context/team-context";
import useSWR from "swr";

import { fetcher } from "@/lib/utils";

import { NavMenu } from "../navigation-menu";

export function SettingsHeader() {
  const teamInfo = useTeam();
  const { data: features } = useSWR<{
    tokens: boolean;
    incomingWebhooks: boolean;
  }>(
    teamInfo?.currentTeam?.id
      ? `/api/feature-flags?teamId=${teamInfo.currentTeam.id}`
      : null,
    fetcher,
  );

  return (
    <header>
      <section className="mb-4 flex items-center justify-between md:mb-8 lg:mb-12">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Settings
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Manage your account settings
          </p>
        </div>
      </section>

      <NavMenu
        navigation={[
          {
            label: "Overview",
            href: `/settings/general`,
            segment: `general`,
          },
          {
            label: "Team",
            href: `/settings/people`,
            segment: "people",
          },
          {
            label: "Domains",
            href: `/settings/domains`,
            segment: "domains",
          },
          {
            label: "Presets",
            href: `/settings/presets`,
            segment: "presets",
          },
          {
            label: "Tags",
            href: `/settings/tags`,
            segment: "tags",
          },
          {
            label: "Agreements",
            href: `/settings/agreements`,
            segment: "agreements",
          },
          {
            label: "Webhooks",
            href: `/settings/webhooks`,
            segment: "webhooks",
          },
          {
            label: "Slack",
            href: `/settings/slack`,
            segment: "slack",
          },
          {
            label: "Tokens",
            href: `/settings/tokens`,
            segment: "tokens",
            disabled: !features?.tokens,
          },
          {
            label: "API",
            href: `/settings/incoming-webhooks`,
            segment: "incoming-webhooks",
            disabled: !features?.incomingWebhooks,
          },
          {
            label: "Billing",
            href: `/settings/billing`,
            segment: "billing",
          },
        ]}
      />
    </header>
  );
}

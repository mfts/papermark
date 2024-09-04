import { NavMenu } from "../navigation-menu";

export function SettingsHeader() {
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
            label: "People",
            href: `/settings/people`,
            segment: "people",
          },
          {
            label: "Domains",
            href: `/settings/domains`,
            segment: "domains",
          },
          {
            label: "Branding",
            href: `/settings/branding`,
            segment: "branding",
          },
          {
            label: "Presets",
            href: `/settings/presets`,
            segment: "presets",
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

import { NavMenu } from "../navigation-menu";

export function AccountHeader() {
  return (
    <header>
      <section className="mb-4 flex items-center justify-between md:mb-8 lg:mb-12">
        <div className="space-y-1">
          <h3 className="text-2xl font-semibold tracking-tight text-foreground">
            User Account
          </h3>
          <p className="text-sm text-muted-foreground">Manage your profile</p>
        </div>
      </section>

      <NavMenu
        navigation={[
          {
            label: "General",
            href: `/account/general`,
            segment: `general`,
          },
          {
            label: "Security",
            href: `/account/security`,
            segment: "security",
          },
        ]}
      />
    </header>
  );
}

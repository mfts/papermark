import { useTeam } from "@/context/team-context";

import GoogleDriveIntegration from "@/components/integrations/google-drive/google-drive";
import AppLayout from "@/components/layouts/app";
import { SettingsHeader } from "@/components/settings/settings-header";

export default function Integrations() {
  const teamInfo = useTeam();

  return (
    <AppLayout>
      <main className="relative mx-2 mb-10 mt-4 space-y-8 overflow-hidden px-1 sm:mx-3 md:mx-5 md:mt-5 lg:mx-7 lg:mt-8 xl:mx-10">
        <SettingsHeader />
        <div>
          <div className="mb-4 flex items-center justify-between md:mb-8 lg:mb-12">
            <div className="space-y-1">
              <h3 className="text-2xl font-semibold tracking-tight text-foreground">
                Integrations
              </h3>
              <p className="text-sm text-muted-foreground">
                Connect your favorite services with Papermark
              </p>
            </div>
          </div>
          <div className="grid gap-6">
            <GoogleDriveIntegration />
          </div>
        </div>
      </main>
    </AppLayout>
  );
}

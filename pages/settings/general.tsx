import AppLayout from "@/components/layouts/app";
import Navbar from "@/components/settings/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTeam } from "@/context/team-context";

export default function General() {
  const teamInfo = useTeam();

  return (
    <AppLayout>
      <Navbar current="General" />
      <div className="p-4 sm:p-4 sm:m-4">
        <div className="flex items-center justify-between mb-4 md:mb-8 lg:mb-12">
          <div className="space-y-1">
            <h3 className="text-2xl text-foreground font-semibold tracking-tight">
              General
            </h3>
            <p className="text-sm text-muted-foreground">Manage your team</p>
          </div>
        </div>
        <div className="space-y-8">
          <div className="flex justify-between items-center p-10 rounded-lg border border-border bg-secondary">
            <div className="flex flex-col">
              <h2 className="text-xl font-medium">Team Name</h2>
              <p className="text-sm text-secondary-foreground mt-3">
                This is the name of your team on Papermark.
              </p>
              <Input
                className="mt-6"
                defaultValue={teamInfo?.currentTeam?.name}
              />
            </div>
            <Button size={"lg"}>Save changes</Button>
          </div>

          <div className="p-10 rounded-lg border border-destructive">
            <div className="space-y-6">
              <div className="space-y-3">
                <h2 className="text-xl font-medium">Delete Team</h2>
                <p className="text-sm text-secondary-foreground mt-3">
                  Permanently delete your team, custom domain, and all
                  associated documents + their stats. This action cannot be
                  undone - please proceed with caution.
                </p>
              </div>
              <Button variant={"destructive"} size={"lg"}>
                Delete Team
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

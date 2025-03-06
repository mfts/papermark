import { useTeam } from "@/context/team-context";
import { toast } from "sonner";
import { mutate } from "swr";

import AppLayout from "@/components/layouts/app";
import DeleteTeam from "@/components/settings/delete-team";
import { SettingsHeader } from "@/components/settings/settings-header";
import { Form } from "@/components/ui/form";

export default function General() {
  const teamInfo = useTeam();

  return (
    <AppLayout>
      <main className="relative mx-2 mb-10 mt-4 space-y-8 overflow-hidden px-1 sm:mx-3 md:mx-5 md:mt-5 lg:mx-7 lg:mt-8 xl:mx-10">
        <SettingsHeader />

        <div className="mb-4 flex items-center justify-between md:mb-8 lg:mb-12">
          <div className="space-y-1">
            <h3 className="text-2xl font-semibold tracking-tight text-foreground">
              General
            </h3>
            <p className="text-sm text-muted-foreground">Manage your team</p>
          </div>
        </div>
        <div className="space-y-6">
          <Form
            title="Team Name"
            description="This is the name of your team on Papermark."
            inputAttrs={{
              name: "name",
              placeholder: "My Personal Team",
              maxLength: 32,
            }}
            defaultValue={teamInfo?.currentTeam?.name ?? ""}
            helpText="Max 32 characters."
            handleSubmit={(updateData) =>
              fetch(`/api/teams/${teamInfo?.currentTeam?.id}/update-name`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(updateData),
              }).then(async (res) => {
                if (res.status === 200) {
                  await Promise.all([
                    mutate(`/api/teams/${teamInfo?.currentTeam?.id}`),
                    mutate(`/api/teams`),
                  ]);
                  toast.success("Successfully updated team name!");
                } else {
                  const { error } = await res.json();
                  toast.error(error.message);
                }
              })
            }
          />
          <DeleteTeam />
        </div>
      </main>
    </AppLayout>
  );
}

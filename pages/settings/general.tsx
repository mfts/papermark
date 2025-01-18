import { useTeam } from "@/context/team-context";
import {
  type CredentialCreationOptionsJSON,
  create,
} from "@github/webauthn-json";
import { toast } from "sonner";
import { mutate } from "swr";

import AppLayout from "@/components/layouts/app";
import DeleteTeam from "@/components/settings/delete-team";
import { SettingsHeader } from "@/components/settings/settings-header";
import Passkey from "@/components/shared/icons/passkey";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";

export default function General() {
  const teamInfo = useTeam();

  async function registerPasskey() {
    const createOptionsResponse = await fetch("/api/passkeys/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ start: true, finish: false, credential: null }),
    });

    const { createOptions } = await createOptionsResponse.json();

    // Open "register passkey" dialog
    const credential = await create(
      createOptions as CredentialCreationOptionsJSON,
    );

    const response = await fetch("/api/passkeys/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ start: false, finish: true, credential }),
    });

    if (response.ok) {
      toast.success("Registered passkey successfully!");
      return;
    }
    // Now the user has registered their passkey and can use it to log in.
  }

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
              defaultValue: teamInfo?.currentTeam?.name,
              placeholder: "My Personal Team",
              maxLength: 32,
            }}
            helpText="Max 32 characters."
            handleSubmit={(updateData) =>
              fetch(`/api/teams/${teamInfo?.currentTeam?.id}/update-name`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ name: updateData?.name.trim() }),
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

          <div className="rounded-lg border border-muted p-10">
            <div className="space-y-6">
              <div className="space-y-3">
                <h2 className="text-xl font-medium">Register a passkey</h2>
                <p className="mt-3 text-sm text-secondary-foreground">
                  Never use a password or oauth again. Register a passkey to
                  make logging in easy.
                </p>
              </div>
              <Button
                onClick={() => registerPasskey()}
                className="flex items-center justify-center space-x-2"
              >
                <Passkey className="h-4 w-4" />
                <span>Register a new passkey</span>
              </Button>
            </div>
          </div>

          <DeleteTeam />
        </div>
      </main>
    </AppLayout>
  );
}

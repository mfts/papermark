import { useRef, useState } from "react";

import { useTeam } from "@/context/team-context";
import {
  type CredentialCreationOptionsJSON,
  create,
} from "@github/webauthn-json";
import { toast } from "sonner";
import { mutate } from "swr";

import AppLayout from "@/components/layouts/app";
import Navbar from "@/components/settings/navbar";
import Passkey from "@/components/shared/icons/passkey";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function General() {
  const teamInfo = useTeam();
  const teamNameInputRef = useRef<HTMLInputElement>(null);
  const [isTeamNameChanging, setTeamNameChanging] = useState<boolean>(false);

  const changeTeamName = async () => {
    if (teamInfo?.currentTeam?.name === teamNameInputRef.current?.value) return;

    setTeamNameChanging(true);

    const response = await fetch(
      `/api/teams/${teamInfo?.currentTeam?.id}/update-name`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: teamNameInputRef.current?.value,
        }),
      },
    );

    if (response.ok) {
      const message = await response.json();
      toast.success(message);
    } else {
      const message = await response.json();
      toast.error(message);
    }

    await mutate("/api/teams");
    setTeamNameChanging(false);
  };

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
      <Navbar current="General" />
      <div className="p-4 sm:m-4 sm:p-4">
        <div className="mb-4 flex items-center justify-between md:mb-8 lg:mb-12">
          <div className="space-y-1">
            <h3 className="text-2xl font-semibold tracking-tight text-foreground">
              General
            </h3>
            <p className="text-sm text-muted-foreground">Manage your team</p>
          </div>
        </div>
        <div className="space-y-8">
          <div className="flex items-center justify-between rounded-lg border border-border bg-secondary p-10">
            <div className="flex flex-col">
              <h2 className="text-xl font-medium">Team Name</h2>
              <p className="mt-3 text-sm text-secondary-foreground">
                This is the name of your team on Papermark.
              </p>
              <Input
                ref={teamNameInputRef}
                className="mt-6"
                defaultValue={teamInfo?.currentTeam?.name}
              />
            </div>
            <Button
              size={"lg"}
              onClick={changeTeamName}
              loading={isTeamNameChanging}
            >
              {isTeamNameChanging ? "Saving..." : "Save changes"}
            </Button>
          </div>

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
        </div>
      </div>
    </AppLayout>
  );
}

import AppLayout from "@/components/layouts/app";
import { AddLogoModal } from "@/components/logos/add-logo-modal";
import LogoCard from "@/components/logos/logo-card";
import Navbar from "@/components/settings/navbar";
import { Button } from "@/components/ui/button";
import { useTeam } from "@/context/team-context";
import { useLogo } from "@/lib/swr/use-logo";
import { useState } from "react";
import { mutate } from "swr";

export default function Logo() {
  const { logo } = useLogo();
  const teamInfo = useTeam();

  const [open, setOpen] = useState<boolean>(false);

  const handleLogoDeletion = (deletedLogo: string) => {
    mutate(
      `/api/teams/${teamInfo?.currentTeam?.id}/logo`,
      logo?.filter((l) => l.name !== deletedLogo),
      false,
    );
  };

  const handleLogoAddition = (newLogo: string) => {
    mutate(
      `/api/teams/${teamInfo?.currentTeam?.id}/logo`,
      [...(logo || []), newLogo],
      false,
    );
  };

  return (
    <AppLayout>
      <Navbar current="Logo" />
      <div className="p-4 sm:p-4 sm:m-4">
        <div className="flex items-center justify-between mb-4 md:mb-8 lg:mb-12">
          <div className="space-y-1">
            <h3 className="text-2xl text-foreground font-semibold tracking-tight">
              Logo
            </h3>
            <p className="text-sm text-muted-foreground">
              Manage your custom logo for document sharing
            </p>
          </div>
          <ul className="flex items-center justify-between gap-4">
            <AddLogoModal
              open={open}
              setOpen={setOpen}
              onAddition={handleLogoAddition}
            >
              <Button>Add Logo</Button>
            </AddLogoModal>
          </ul>
        </div>
        {logo && logo.length !== 0 ? (
          <div>
            <ul>
              {logo.map((l, index) => (
                <li key={index} className="mt-4">
                  <LogoCard
                    name={l.name}
                    logoId={l.id}
                    onDelete={handleLogoDeletion}
                  />
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </AppLayout>
  );
}

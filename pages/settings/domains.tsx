import { useState } from "react";

import { useTeam } from "@/context/team-context";
import { mutate } from "swr";

import { AddDomainModal } from "@/components/domains/add-domain-modal";
import DomainCard from "@/components/domains/domain-card";
import AppLayout from "@/components/layouts/app";
import { SettingsHeader } from "@/components/settings/settings-header";
import { Button } from "@/components/ui/button";

import { useDomains } from "@/lib/swr/use-domains";

export default function Domains() {
  const { domains } = useDomains();
  const teamInfo = useTeam();

  const [open, setOpen] = useState<boolean>(false);

  const handleDomainDeletion = (deletedDomain: string) => {
    mutate(
      `/api/teams/${teamInfo?.currentTeam?.id}/domains`,
      domains?.filter((domain) => domain.slug !== deletedDomain),
      false,
    );
  };

  const handleDomainAddition = (newDomain: string) => {
    mutate(
      `/api/teams/${teamInfo?.currentTeam?.id}/domains`,
      [...(domains || []), newDomain],
      false,
    );
  };

  return (
    <AppLayout>
      <main className="relative mx-2 mb-10 mt-4 space-y-8 overflow-hidden px-1 sm:mx-3 md:mx-5 md:mt-5 lg:mx-7 lg:mt-8 xl:mx-10">
        <SettingsHeader />
        <div>
          <div className="mb-4 flex items-center justify-between md:mb-8 lg:mb-12">
            <div className="space-y-1">
              <h3 className="text-2xl font-semibold tracking-tight text-foreground">
                Domains
              </h3>
              <p className="text-sm text-muted-foreground">
                Manage your custom domain for document sharing
              </p>
            </div>
            <ul className="flex items-center justify-between gap-4">
              <AddDomainModal
                open={open}
                setOpen={setOpen}
                onAddition={handleDomainAddition}
              >
                <Button>Add Domain</Button>
              </AddDomainModal>
            </ul>
          </div>
          {domains && domains.length !== 0 ? (
            <div>
              <ul>
                {domains.map((domain, index) => (
                  <li key={index} className="mt-4">
                    <DomainCard
                      domain={domain.slug}
                      isDefault={domain.isDefault}
                      onDelete={handleDomainDeletion}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </main>
    </AppLayout>
  );
}

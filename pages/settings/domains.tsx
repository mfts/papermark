import { AddDomainModal } from "@/components/domains/add-domain-modal";
import DomainCard from "@/components/domains/domain-card";
import AppLayout from "@/components/layouts/app";
import Navbar from "@/components/settings/navbar";
import { Button } from "@/components/ui/button";
import { useTeam } from "@/context/team-context";
import { useDomains } from "@/lib/swr/use-domains";
import { useState } from "react";
import { mutate } from "swr";

export default function Domains() {
  const { domains } = useDomains();
  const teamInfo = useTeam();

  console.log("domains", domains);

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
      <Navbar current="Domains" />
      <div className="p-4 sm:p-4 sm:m-4">
        <div className="flex items-center justify-between mb-4 md:mb-8 lg:mb-12">
          <div className="space-y-1">
            <h3 className="text-2xl text-foreground font-semibold tracking-tight">
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
                    onDelete={handleDomainDeletion}
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

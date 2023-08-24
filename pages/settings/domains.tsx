import { AddDomainModal } from "@/components/domains/add-domain-modal";
import DomainCard from "@/components/domains/domain-card";
import AppLayout from "@/components/layouts/app";
import useDomains from "@/lib/swr/use-domains";
import { mutate } from "swr";

export default function Domains() {

  const { domains } = useDomains();
  
  const handleDomainDeletion = (deletedDomain: string) => {
    mutate(
      "/api/domains",
      domains?.filter((domain) => domain.slug !== deletedDomain),
      false
    );
  };

  const handleDomainAddition = (newDomain: string) => {
    mutate("/api/domains", [...(domains || []), newDomain], false);
  }

  return (
    <AppLayout>
      <div className="p-4 sm:p-4 sm:m-4">
        <div className="flex items-center justify-between mb-4 md:mb-8 lg:mb-12">
          <div className="space-y-1">
            <h2 className="text-2xl text-white font-semibold tracking-tight">
              Domains
            </h2>
            <p className="text-sm text-gray-400">Manage your custom domains</p>
          </div>
          <ul className="flex items-center justify-between gap-4">
            <AddDomainModal onAddition={handleDomainAddition}>
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-gray-950 bg-gray-300 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Add Domain
              </button>
            </AddDomainModal>
          </ul>
        </div>
        {domains ? (
          <div>
            <h2 className="text-2xl font-semibold">Domains</h2>
            <ul>
              {domains.map((domain, index) => (
                <li key={index} className="mt-4">
                  <DomainCard domain={domain.slug} onDelete={handleDomainDeletion} />
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </AppLayout>
  );
}



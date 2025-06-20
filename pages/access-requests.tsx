import { useRouter } from "next/router";

import { useEffect } from "react";

import { useAccessRequests } from "@/lib/swr/use-access-requests";
import { usePlan } from "@/lib/swr/use-billing";

import { AccessRequestsTable } from "@/components/access-requests/access-requests-table";
import AppLayout from "@/components/layouts/app";

export default function AccessRequests() {
  const router = useRouter();
  const { isFree, isTrial } = usePlan();
  const { accessRequests } = useAccessRequests();

  useEffect(() => {
    if (isFree && !isTrial) router.push("/documents");
  }, [isTrial, isFree]);

  return (
    <AppLayout>
      <div className="p-4 pb-0 sm:m-4 sm:py-4">
        <section className="mb-4 flex items-center justify-between md:mb-8 lg:mb-12">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Access Requests
            </h2>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Manage access requests for your documents and datarooms.
            </p>
          </div>
        </section>
      </div>

      <div className="relative p-4 pt-0 sm:mx-4 sm:mt-4">
        <AccessRequestsTable accessRequests={accessRequests} />
      </div>
    </AppLayout>
  );
}

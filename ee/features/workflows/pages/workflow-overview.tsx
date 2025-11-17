import Link from "next/link";
import { useRouter } from "next/router";

import { useTeam } from "@/context/team-context";
import { PlusIcon } from "lucide-react";
import useSWR from "swr";

import { usePlan } from "@/lib/swr/use-billing";
import { fetcher } from "@/lib/utils";

import PlanBadge from "@/components/billing/plan-badge";
import AppLayout from "@/components/layouts/app";
import { Button } from "@/components/ui/button";

import { WorkflowEmptyState } from "../components/workflow-empty-state";
import { WorkflowList } from "../components/workflow-list";

interface Workflow {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  entryLink: {
    id: string;
    slug: string | null;
    domainSlug: string | null;
  };
  _count: {
    steps: number;
    executions: number;
  };
}

export default function WorkflowsPage() {
  const router = useRouter();
  const teamInfo = useTeam();
  const { isFree, isPro, isTrial } = usePlan();
  const teamId = teamInfo?.currentTeam?.id;

  const { data: workflows, error } = useSWR<Workflow[]>(
    teamId ? `/api/workflows?teamId=${teamId}` : null,
    fetcher,
  );

  const isLoading = !workflows && !error;
  const requiresUpgrade = (isFree || isPro) && !isTrial;

  return (
    <AppLayout>
      <main className="relative mx-2 mb-10 mt-4 space-y-8 overflow-hidden px-1 sm:mx-3 md:mx-5 md:mt-5 lg:mx-7 lg:mt-8 xl:mx-10">
        <div>
          <div className="mb-4 flex items-center justify-between md:mb-8 lg:mb-12">
            <div className="space-y-1">
              <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Workflows
                {requiresUpgrade ? <PlanBadge plan="Business" /> : null}
              </h1>
              <p className="text-sm text-muted-foreground">
                Route visitors to different links based on their email or domain
              </p>
            </div>
            {!requiresUpgrade && (
              <Link href="/workflows/new">
                <Button>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Create Workflow
                </Button>
              </Link>
            )}
          </div>

          {requiresUpgrade ? (
            <WorkflowEmptyState
              title="Workflows require an upgrade"
              description="Upgrade to Business or Data Rooms plan to create routing workflows. Click the button below to upgrade your plan."
            />
          ) : isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-sm text-muted-foreground">
                Loading workflows...
              </div>
            </div>
          ) : !workflows || workflows.length === 0 ? (
            <WorkflowEmptyState
              title="No workflows yet"
              description="Create your first routing workflow to intelligently direct visitors to different links"
            />
          ) : (
            <WorkflowList workflows={workflows} />
          )}
        </div>
      </main>
    </AppLayout>
  );
}

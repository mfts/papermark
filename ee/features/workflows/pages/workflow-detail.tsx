import { useRouter } from "next/router";

import { useState } from "react";

import { useTeam } from "@/context/team-context";
import { toast } from "sonner";
import useSWR from "swr";
import { z } from "zod";

import { fetcher } from "@/lib/utils";

import AppLayout from "@/components/layouts/app";

import { StepFormDialog } from "../components/step-form-dialog";
import { StepList } from "../components/step-list";
import { WorkflowHeader } from "../components/workflow-header";

interface Workflow {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  entryLink: {
    id: string;
    slug: string | null;
    domainSlug: string | null;
  };
  steps: WorkflowStep[];
}

interface WorkflowStep {
  id: string;
  name: string;
  stepOrder: number;
  conditions: {
    logic: "AND" | "OR";
    items: Array<{
      type: "email" | "domain";
      operator: string;
      value: string | string[];
    }>;
  };
  actions: Array<{
    type: "route";
    targetLinkId: string;
  }>;
  targetLink?: {
    id: string;
    name: string | null;
    slug: string | null;
    linkType: string;
  };
}

interface Link {
  id: string;
  name: string | null;
  slug: string | null;
  domainSlug: string | null;
  linkType: "DOCUMENT_LINK" | "DATAROOM_LINK";
  documentId: string | null;
  dataroomId: string | null;
  allowList: string[];
  resourceName: string | null;
  displayName: string;
}

export default function WorkflowDetailPage() {
  const router = useRouter();
  const { id: workflowId } = router.query as { id: string };
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  const [showStepDialog, setShowStepDialog] = useState(false);
  const [editingStep, setEditingStep] = useState<WorkflowStep | null>(null);

  // Validate IDs to prevent SSRF
  const validWorkflowId =
    workflowId && z.string().cuid().safeParse(workflowId).success
      ? workflowId
      : null;
  const validTeamId =
    teamId && z.string().cuid().safeParse(teamId).success ? teamId : null;

  const {
    data: workflow,
    error,
    mutate,
  } = useSWR<Workflow>(
    validWorkflowId && validTeamId
      ? `/api/workflows/${validWorkflowId}?teamId=${validTeamId}`
      : null,
    fetcher,
  );

  const { data: links } = useSWR<Link[]>(
    validTeamId ? `/api/teams/${validTeamId}/workflow-links` : null,
    fetcher,
  );

  const getEntryUrl = () => {
    if (!workflow) return "";
    if (workflow.entryLink.domainSlug && workflow.entryLink.slug) {
      return `https://${workflow.entryLink.domainSlug}/${workflow.entryLink.slug}`;
    }
    return `${process.env.NEXT_PUBLIC_MARKETING_URL || "https://www.papermark.com"}/view/${workflow.entryLink.id}`;
  };

  const handleDeleteStep = async (stepId: string) => {
    // Validate IDs to prevent SSRF
    const workflowIdValidation = z.string().cuid().safeParse(workflowId);
    const stepIdValidation = z.string().cuid().safeParse(stepId);
    const teamIdValidation = z.string().cuid().safeParse(teamId);

    if (
      !workflowIdValidation.success ||
      !stepIdValidation.success ||
      !teamIdValidation.success
    ) {
      toast.error("Invalid workflow, step, or team ID");
      return;
    }

    try {
      const response = await fetch(
        `/api/workflows/${workflowId}/steps/${stepId}?teamId=${teamId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete step");
      }

      mutate();
      toast.success("Step deleted");
    } catch (error) {
      toast.error("Failed to delete step");
    }
  };

  if (error) {
    return (
      <AppLayout>
        <main className="relative mx-2 mb-10 mt-4 px-1">
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Failed to load workflow
            </p>
          </div>
        </main>
      </AppLayout>
    );
  }

  if (!workflow) {
    return (
      <AppLayout>
        <main className="relative mx-2 mb-10 mt-4 px-1">
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">Loading workflow...</p>
          </div>
        </main>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <main className="relative mx-2 mb-10 mt-4 space-y-8 overflow-hidden px-1 sm:mx-3 md:mx-5 md:mt-5 lg:mx-7 lg:mt-8 xl:mx-10">
        <div className="max-w-4xl space-y-6">
          <WorkflowHeader
            workflowId={workflowId}
            teamId={teamId!}
            name={workflow.name}
            description={workflow.description}
            isActive={workflow.isActive}
            entryUrl={getEntryUrl()}
            onUpdate={mutate}
          />

          <StepList
            steps={workflow.steps}
            onAddStep={() => {
              setEditingStep(null);
              setShowStepDialog(true);
            }}
            onEditStep={(step) => {
              setEditingStep(step);
              setShowStepDialog(true);
            }}
            onDeleteStep={handleDeleteStep}
          />
        </div>

        {/* Step Form Dialog */}
        {showStepDialog && validWorkflowId && validTeamId && (
          <StepFormDialog
            workflowId={validWorkflowId}
            teamId={validTeamId}
            step={editingStep}
            links={links || []}
            open={showStepDialog}
            onClose={() => {
              setShowStepDialog(false);
              setEditingStep(null);
            }}
            onSuccess={() => {
              mutate();
              setShowStepDialog(false);
              setEditingStep(null);
            }}
          />
        )}
      </main>
    </AppLayout>
  );
}

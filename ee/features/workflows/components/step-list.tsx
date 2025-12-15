import { PencilIcon, PlusIcon, TrashIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

interface StepListProps {
  steps: WorkflowStep[];
  onAddStep: () => void;
  onEditStep: (step: WorkflowStep) => void;
  onDeleteStep: (stepId: string) => void;
}

export function StepList({
  steps,
  onAddStep,
  onEditStep,
  onDeleteStep,
}: StepListProps) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Routing Steps</h3>
          <p className="text-sm text-muted-foreground">
            Steps are evaluated in order (priority-based)
          </p>
        </div>
        <Button onClick={onAddStep}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Step
        </Button>
      </div>

      {steps.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No routing steps yet. Add your first step to start routing visitors.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={step.id} className="rounded-lg border bg-card p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Step {index + 1}</Badge>
                    <span className="font-medium">{step.name}</span>
                  </div>
                  <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <p>
                      <strong>If:</strong> Match{" "}
                      {step.conditions.logic === "AND" ? "all" : "any"} of{" "}
                      {step.conditions.items.length} condition(s)
                    </p>
                    {step.targetLink && (
                      <p>
                        <strong>Then:</strong> Route to{" "}
                        {step.targetLink.name || step.targetLink.slug || "link"}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditStep(step)}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteStep(step.id)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

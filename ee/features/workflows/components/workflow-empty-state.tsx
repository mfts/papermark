import { WorkflowIcon } from "lucide-react";

interface WorkflowEmptyStateProps {
  title: string;
  description: string;
}

export function WorkflowEmptyState({
  title,
  description,
}: WorkflowEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border border-dashed py-12">
      <div className="rounded-full bg-muted p-3">
        <WorkflowIcon className="h-6 w-6 text-muted-foreground" />
      </div>
      <div className="text-center">
        <h3 className="font-medium">{title}</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}


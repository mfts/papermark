import Link from "next/link";

import { timeAgo } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";

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

interface WorkflowListProps {
  workflows: Workflow[];
}

export function WorkflowList({ workflows }: WorkflowListProps) {
  const getEntryUrl = (workflow: Workflow) => {
    if (workflow.entryLink.domainSlug && workflow.entryLink.slug) {
      return `https://${workflow.entryLink.domainSlug}/${workflow.entryLink.slug}`;
    }
    return `${process.env.NEXT_PUBLIC_MARKETING_URL || "https://www.papermark.com"}/view/${workflow.entryLink.id}`;
  };

  return (
    <div className="grid grid-cols-1 gap-3">
      {workflows.map((workflow) => (
        <Link
          key={workflow.id}
          href={`/workflows/${workflow.id}`}
          className="group rounded-xl border bg-card p-5 transition-all hover:border-gray-400 hover:shadow-sm dark:border-gray-700 dark:bg-secondary dark:hover:border-gray-600"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-foreground group-hover:text-primary">
                  {workflow.name}
                </h4>
                {!workflow.isActive && (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </div>
              {workflow.description && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {workflow.description}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="font-mono text-xs">
                  {getEntryUrl(workflow)}
                </span>
                <span>•</span>
                <span>{workflow._count.steps} steps</span>
                <span>•</span>
                <span>{workflow._count.executions} executions</span>
                <span>•</span>
                <span>Created {timeAgo(workflow.createdAt)}</span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

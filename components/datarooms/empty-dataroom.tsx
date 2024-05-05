import { ServerIcon } from "lucide-react";

export function EmptyDataroom() {
  return (
    <div className="text-center">
      <ServerIcon
        className="mx-auto h-12 w-12 text-muted-foreground"
        strokeWidth={1}
      />
      <h3 className="mt-2 text-sm font-medium text-foreground">
        No datarooms here
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Get started by creating a new dataroom.
      </p>
    </div>
  );
}

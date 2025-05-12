
import { useTeam } from "@/context/team-context";
import { FileTextIcon, MoreVertical, TrashIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Agreement {
  id: string;
  name: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

interface AgreementCardProps {
  agreement: Agreement;
  onDelete: (id: string) => void;
}

export default function AgreementCard({
  agreement,
  onDelete,
}: AgreementCardProps) {
  const teamInfo = useTeam();

  const handleDelete = async () => {
    toast.promise(
      fetch(
        `/api/teams/${teamInfo?.currentTeam?.id}/agreements/${agreement.id}`,
        {
          method: "PUT",
        },
      ).then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to delete agreement");
        }
        onDelete(agreement.id);
      }),
      {
        loading: "Deleting agreement...",
        success: "Agreement deleted successfully",
        error: "Failed to delete agreement",
      },
    );
  };

  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="flex items-center space-x-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
          <FileTextIcon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-medium">{agreement.name}</h3>
          <p className="text-sm text-muted-foreground">
            Last updated {new Date(agreement.updatedAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
            onClick={handleDelete}
          >
            <TrashIcon className="mr-2 h-4 w-4" />
            Delete agreement
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

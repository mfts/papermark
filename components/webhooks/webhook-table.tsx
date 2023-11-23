import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Webhook } from "@prisma/client";
import MoreHorizontal from "@/components/shared/icons/more-horizontal";
import { timeAgo } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { mutate } from "swr";
import { useTeam } from "@/context/team-context";

export function WebhookTable({ webhooks }: { webhooks: Webhook[] }) {
  const teamInfo = useTeam();

  const removeWebhook = async (webhookId: string) => {
    const response = await fetch(
      `/api/teams/${teamInfo?.currentTeam?.id}/webhooks/${webhookId}`,
      {
        method: "DELETE",
      },
    );

    if (response.status !== 204) {
      const error = await response.json();
      toast.error(error);
      return;
    }
    toast.success("Webhook deleted successfully!");
    await mutate(`/api/teams/${teamInfo?.currentTeam?.id}/webhooks`);
  };

  return (
    <div className="border rounded-lg">
      <Table className="my-4">
        <TableHeader>
          <TableRow>
            <TableHead>Endpoints</TableHead>
            {/* <TableHead className="text-right">Status</TableHead> */}
            <TableHead className="text-center">Created</TableHead>
            <TableHead className="w-6"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {webhooks.length === 0 && (
            <TableRow>
              <TableCell className="font-medium">
                <Skeleton className="h-6 w-72" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="m-auto h-6 w-24" />
              </TableCell>
              {/* <TableCell className="text-right">
                <Skeleton className="ml-auto h-6 w-24" />
              </TableCell> */}
              <TableCell>
                <Skeleton className="h-6 w-6" />
              </TableCell>
            </TableRow>
          )}
          {webhooks.map((webhook) => (
            <TableRow>
              <TableCell className="font-medium">{webhook.targetUrl}</TableCell>
              {/* <TableCell className="text-right">
                <Badge variant={"secondary"}>Enabled</Badge>
              </TableCell> */}
              <TableCell className="text-center">
                {timeAgo(webhook.createdAt)}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem
                      className="text-red-500 focus:bg-destructive focus:text-destructive-foreground hover:cursor-pointer"
                      onClick={() => removeWebhook(webhook.id)}
                    >
                      Remove Webhook
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

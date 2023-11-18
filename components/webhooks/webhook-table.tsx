import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Webhook } from "@prisma/client";
import MoreHorizontal from "../shared/icons/more-horizontal";
import { Badge } from "../ui/badge";
import { timeAgo } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton";

export function WebhookTable({ webhooks }: { webhooks: Webhook[] }) {
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
                <MoreHorizontal />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

{
  /* <TableRow>
  <TableCell className="min-w-[100px]">
    <Skeleton className="h-6 w-full" />
  </TableCell>
  <TableCell className="min-w-[150px]">
    <Skeleton className="h-6 w-full" />
  </TableCell>
  <TableCell>
    <Skeleton className="h-6 w-24" />
  </TableCell>
  <TableCell>
    <Skeleton className="h-6 w-24" />
  </TableCell>
</TableRow> */
}

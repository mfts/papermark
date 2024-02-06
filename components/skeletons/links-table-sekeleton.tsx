import { TableCell, TableRow } from "@/components/ui/table";
import { Skeleton } from "../ui/skeleton";

const LinksTableSekeleton = () => {
  return (
    <TableRow>
      <TableCell className="min-w-[100px]">
        <Skeleton className="h-6 w-full" />
      </TableCell>
      <TableCell className="min-w-[450px]">
        <Skeleton className="h-6 w-full" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-6 w-24" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-6 w-24" />
      </TableCell>
    </TableRow>
  );
};

export default LinksTableSekeleton;

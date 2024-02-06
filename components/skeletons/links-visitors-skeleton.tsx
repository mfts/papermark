import { TableCell, TableRow } from "@/components/ui/table";
import { Skeleton } from "../ui/skeleton";

const LinksVisitorsSkeleton = () => {
  return (
    <TableRow>
      <TableCell colSpan={2}>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-6 w-[220px]" />
        </div>
      </TableCell>
      <TableCell>
        <Skeleton className="h-6 w-24" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-6 w-16" />
      </TableCell>
    </TableRow>
  );
};

export default LinksVisitorsSkeleton;

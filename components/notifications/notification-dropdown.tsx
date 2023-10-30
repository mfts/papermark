import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function NotificationDropdown({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="outline-none">
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72 divide-y">
        <DropdownMenuLabel>My Notifications</DropdownMenuLabel>
        <DropdownMenuItem className="py-4">
          Aashish liked a document
        </DropdownMenuItem>
        <DropdownMenuItem className="py-4">
          Someone just viewed your document
        </DropdownMenuItem>
        <DropdownMenuItem className="py-4">
          A new member joined the team
        </DropdownMenuItem>
        <DropdownMenuItem className="py-4">
          John has been removed from the team
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

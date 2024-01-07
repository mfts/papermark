import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MenuIcon } from "lucide-react";
import SidebarContent from "./SidebarContent";

export default function MobileSideBar() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          className="-m-2.5 p-2.5 text-muted-foreground lg:hidden"
        >
          <span className="sr-only">Open sidebar</span>
          <MenuIcon className="h-6 w-6" aria-hidden="true" />
        </button>
      </SheetTrigger>
      <SheetContent className="w-72 flex grow flex-col gap-y-5 overflow-y-auto bg-gray-50 dark:bg-black px-6 ring-1 ring-foreground/10" side={"left"}>
        <SidebarContent />
      </SheetContent>
    </Sheet>
  );
}

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MenuIcon } from "lucide-react";
import SidebarContent from "./SidebarContent";

export default function MobileSideBar({ userPlan }: { userPlan: undefined | string }) {
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
      <SheetContent
        className="w-72 flex grow flex-col gap-y-5 overflow-y-auto bg-gray-50 dark:bg-black px-6 ring-1 ring-foreground/10"
        side={"left"}
      >
        {/* sidebar content */}
        <SidebarContent userPlan={userPlan} />
      </SheetContent>
    </Sheet>
  );
}

import { Dispatch, SetStateAction, useState } from "react";

import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

interface DropDownProps {
  options: string[];
  option: string;
  setOption: Dispatch<SetStateAction<string>>;
}

export default function DropDown({
  options,
  option,
  setOption,
}: DropDownProps) {
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  
  const handleMenuStateChange = (open: boolean) => {
    setMenuOpen(open);
  };
  return (
    <DropdownMenu open={menuOpen} onOpenChange={handleMenuStateChange}>
      <DropdownMenuTrigger asChild>
        <Button className="inline-flex w-full items-center justify-between rounded-md border border-black font-normal text-md bg-white px-4 py-2 text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none">
          {option}
          {menuOpen ? <ChevronUpIcon
            className="-mr-1 ml-2 h-5 w-5"
            aria-hidden="true"
          /> : <ChevronDownIcon
            className="-mr-1 ml-2 h-5 w-5"
            aria-hidden="true"
          />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent onFocusOutside={(e) => e.preventDefault()} className="w-[--radix-dropdown-menu-trigger-width] p-0 mt-2 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none" key={option}>
          {options.map((optionItem) => (
            <DropdownMenuItem key={optionItem} className="text-gray-700 border-none hover:outline-none p-0 hover:bg-gray-100 hover:text-gray-900">
                <button
                  onClick={() => setOption(optionItem)}
                  className={classNames(
                    option === optionItem ? "bg-gray-200" : "",
                    "flex w-full items-center justify-between space-x-2 px-4 py-2 text-left text-sm",
                  )}
                >
                  <span>{optionItem}</span>
                  {option === optionItem ? (
                    <CheckIcon className="w-4 h-4 text-bold" />
                  ) : null}
                </button>
            </DropdownMenuItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

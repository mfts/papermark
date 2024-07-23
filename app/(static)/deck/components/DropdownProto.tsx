import { DropdownMenu, DropdownMenuContent, DropdownMenuItem } from "@radix-ui/react-dropdown-menu";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { Dispatch, SetStateAction, useState } from "react";
import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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
        <button className="inline-flex w-full justify-between text-md items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-400 font-light shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue">
          {option}
          {menuOpen ? <ChevronUpIcon
            className="-mr-1 ml-2 h-5 w-5"
            aria-hidden="true"
          /> : <ChevronDownIcon
            className="-mr-1 ml-2 h-5 w-5"
            aria-hidden="true"
          />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent onFocusOutside={(e) => e.preventDefault()} className="w-[--radix-dropdown-menu-trigger-width] mt-2 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          {options.map((optionItem) => (
            <DropdownMenuItem key={optionItem} className="text-gray-700 border-none hover:outline-none hover:bg-gray-100 hover:text-gray-900 ">
                <button
                  onClick={() => setOption(optionItem)}
                  className={classNames(
                    option === optionItem ? "bg-gray-200" : "",
                    "px-4 py-2 text-sm w-full text-left flex items-center space-x-2 justify-between",
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

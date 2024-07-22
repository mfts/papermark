import { Button } from "@/components/ui/button";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { Dispatch, SetStateAction, useState } from "react";
import { PopoverContent } from "@radix-ui/react-popover";
import { PopoverTrigger, Popover } from "@/components/ui/popover";

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
  const [isFirstClick, setIsFirstClick] = useState<boolean>(false);

  const handleMenuStateChange = (open: boolean) => {
    if (isFirstClick) {
      setMenuOpen(true); // Keep the dropdown open on the first click
      return;
    }

    // If the menu is closed, reset the isFirstClick state
    if (!open) {
      setIsFirstClick(false);
      setMenuOpen(false); // Ensure the dropdown is closed
    } else {
      setMenuOpen(true); // Open the dropdown
    }
  };

  return (
    <Popover open={menuOpen} onOpenChange={handleMenuStateChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="h-8 bg-transparent w-full flex justify-between px-4 py-6"
        >
          <div>
            {option}
          </div>
          {menuOpen ? <ChevronUpIcon
            className="-mr-1 ml-2 h-5 w-5"
            aria-hidden="true"
          /> : <ChevronDownIcon
            className="-mr-1 ml-2 h-5 w-5"
            aria-hidden="true"
          />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] z-10 bg-white shadow-lg ring-1 ring-black ring-opacity-5">
        {options.map((optionItem) => (
          <button
            onClick={() => {
              setOption(optionItem)
              setMenuOpen(false)
            }}
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
        ))}
      </PopoverContent>
    </Popover>
  )
}
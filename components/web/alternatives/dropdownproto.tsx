import { CheckIcon} from "lucide-react";
import { Dispatch, SetStateAction, useState } from "react";
import * as React from "react"
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils";

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
    <Select open={menuOpen} onOpenChange={handleMenuStateChange}>
      <SelectTrigger className="inline-flex w-full justify-between items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-400 font-light shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue text-base">
        <SelectValue placeholder={option}/>
      </SelectTrigger>
      <SelectContent>
        {options.map((optionItem) => (
          <button
            onClick={() => {
              setOption(optionItem)
              setMenuOpen(false)
            }}
            className={cn(
              option === optionItem ? "bg-gray-200" : "hover:bg-gray-100",
              "px-4 py-2 text-sm w-full text-left flex items-center space-x-2 justify-between",
            )}
          >
            <span>{optionItem}</span>
            {option === optionItem ? (
              <CheckIcon className="w-4 h-4 text-bold" />
            ) : null}
          </button>
        ))}
      </SelectContent>
    </Select>
  )
}


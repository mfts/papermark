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

  return (
    <Select>
      <SelectTrigger className="inline-flex w-full justify-between items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-400 font-light shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue text-base">
        <SelectValue placeholder={option}/>
      </SelectTrigger>
      <SelectContent>
        {options.map((optionItem) => (
          <button
            onClick={() => {
              setOption(optionItem)
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


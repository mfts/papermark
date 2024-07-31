import { Dispatch, SetStateAction, useState } from "react";
import * as React from "react";

import { CheckIcon } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
      <SelectTrigger className="focus:ring-blue inline-flex w-full items-center justify-between rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-light text-gray-400 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2">
        <SelectValue placeholder={option} />
      </SelectTrigger>
      <SelectContent>
        {options.map((optionItem, index) => (
          <button
            onClick={() => {
              setOption(optionItem);
            }}
            className={cn(
              option === optionItem ? "bg-gray-200" : "hover:bg-gray-100",
              "flex w-full items-center justify-between space-x-2 px-4 py-2 text-left text-sm",
            )}
            key={index}
          >
            <span>{optionItem}</span>
            {option === optionItem ? (
              <CheckIcon className="text-bold h-4 w-4" />
            ) : null}
          </button>
        ))}
      </SelectContent>
    </Select>
  );
}

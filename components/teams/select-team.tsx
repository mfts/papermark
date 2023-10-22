import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusIcon } from "lucide-react";

const SelectTeam = () => {
  return (
    <Select defaultValue="aashish">
      <SelectTrigger className="w-full mb-6">
        <SelectValue placeholder="Select project" />
      </SelectTrigger>
      <SelectContent>
        <div className="max-h-48 overflow-y-scroll ">
          <SelectItem value="demo">Demo project</SelectItem>
          <SelectItem value="aashish">Aashish's Team</SelectItem>
          <SelectItem value="papermark">College Engineering Group</SelectItem>
        </div>
        <div className="flex gap-2 items-center border-t p-2 text-sm hover:bg-gray-800 duration-100 hover:cursor-pointer">
          <PlusIcon className="h-5 w-5" />
          Create Team
        </div>
      </SelectContent>
    </Select>
  );
};

export default SelectTeam;

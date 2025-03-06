"use client";

import { Search } from "lucide-react";

interface ProfileSearchTriggerProps {
  onClick: () => void;
}

export function ProfileSearchTrigger({ onClick }: ProfileSearchTriggerProps) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center px-3 py-2 text-sm duration-200 hover:bg-gray-200 dark:hover:bg-muted"
    >
      <Search className="mr-2 h-4 w-4" />
      Search Help Articles
    </button>
  );
}

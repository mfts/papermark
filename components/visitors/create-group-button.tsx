import { useState } from "react";

import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

import AllowListGroupModal from "./allow-list-group-modal";

export default function CreateGroupButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center gap-2"
      >
        <PlusIcon className="h-4 w-4" />
        Create Group
      </Button>

      <AllowListGroupModal isOpen={isModalOpen} setIsOpen={setIsModalOpen} />
    </>
  );
}

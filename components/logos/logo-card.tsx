import { Button } from "../ui/button";
import { useEffect, useRef, useState } from "react";
import { useTeam } from "@/context/team-context";
import Image from "next/image";
import { Separator } from "../ui/separator";

export default function LogoCard({
  logoId,
  name,
  file,
  onDelete,
}: {
  logoId: string;
  name: string;
  file: string;
  onDelete: (deletedLogo: string) => void;
}) {
  const [deleting, setDeleting] = useState<boolean>(false);
  const [isFirstClick, setIsFirstClick] = useState<boolean>(false);
  const deleteButtonRef = useRef<HTMLButtonElement | null>(null);
  const teamInfo = useTeam();

  useEffect(() => {
    function handleClickOutside(event: { target: any }) {
      if (
        deleteButtonRef.current &&
        !deleteButtonRef.current.contains(event.target)
      ) {
        setIsFirstClick(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  const handleDelete = async () => {
    if (isFirstClick) {
      setDeleting(true);
      const response = await fetch(
        `/api/teams/${teamInfo?.currentTeam?.id}/logo/${logoId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update local data by filtering out the deleted domain
      onDelete(logoId);
      setDeleting(false);
    } else {
      setIsFirstClick(true);
    }
  };

  return (
    <>
      <div className="flex flex-col space-y-3 rounded-lg ring-1 ring-gray-200 dark:ring-gray-700 bg-white dark:bg-secondary hover:ring-gray-400 hover:dark:ring-gray-500 px-5 py-8 sm:px-10">
        <div className="flex flex-col justify-between space-y-4 sm:flex-row sm:space-x-4">
          <div className="flex items-center space-x-2">
            <p className="flex items-center text-xl font-semibold">{name}</p>
          </div>
          <div className="flex space-x-3">
            <Button
              ref={deleteButtonRef}
              variant="destructive"
              onClick={handleDelete}
              loading={deleting}
            >
              {isFirstClick ? "Really delete?" : "Delete"}
            </Button>
          </div>
        </div>
        <Separator />
        <div className="flex h-30 flex-col space-y-2 sm:flex-row sm:items-left sm:space-x-5 sm:space-y-0">
          <Image
            src={file}
            alt={"Custom logo"}
            width={140}
            height={120}
            className="sm:w-1/5 sm:h-16 w-full flex-none rounded-lg object-left"
          />
        </div>
      </div>
    </>
  );
}

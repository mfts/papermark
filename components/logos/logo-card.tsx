import { Button } from "../ui/button";
import { useState } from "react";
import { useTeam } from "@/context/team-context";

export default function LogoCard({
  logoId,
  name,
  onDelete,
}: {
  logoId: string;
  name: string;
  onDelete: (deletedLogo: string) => void;
}) {
  const [deleting, setDeleting] = useState<boolean>(false);
  const teamInfo = useTeam();

  const handleDelete = async () => {
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
              variant="destructive"
              onClick={handleDelete}
              loading={deleting}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

import { mutate } from "swr";
import { useDomainStatus } from "./use-domain-status";
import DomainConfiguration from "./domain-configuration";

import CheckCircle2 from "../shared/icons/check-cirlce-2";
import AlertCircle from "../shared/icons/alert-circle";
import XCircle from "../shared/icons/x-circle";
import LoadingSpinner from "../ui/loading-spinner";
import ExternalLink from "../shared/icons/external-link";
import { Button } from "../ui/button";
import { useState } from "react";
import { useTeam } from "@/context/team-context";

export default function DomainCard({
  domain,
  onDelete,
}: {
  domain: string;
  onDelete: (deletedDomain: string) => void;
}) {
  const { status, loading } = useDomainStatus({ domain });
  const [deleting, setDeleting] = useState<boolean>(false);
  const teamInfo = useTeam();

  const handleDelete = async () => {
    // console.log("Deleting domain...", domain);

    setDeleting(true);
    const response = await fetch(
      `/api/teams/${teamInfo?.currentTeam?.id}/domains/${domain}`,
      {
        method: "DELETE",
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Update local data by filtering out the deleted domain
    onDelete(domain);
    setDeleting(false);
  };

  return (
    <>
      <div className="flex flex-col space-y-3 rounded-lg ring-1 ring-gray-200 dark:ring-gray-700 bg-white dark:bg-secondary hover:ring-gray-400 hover:dark:ring-gray-500 px-5 py-8 sm:px-10">
        <div className="flex flex-col justify-between space-y-4 sm:flex-row sm:space-x-4">
          <div className="flex items-center space-x-2">
            <a
              href={`http://${domain}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-2"
            >
              <p className="flex items-center text-xl font-semibold">
                {domain}
              </p>
              <ExternalLink className="h-5 w-5" />
            </a>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="secondary"
              className="bg-gray-300 hover:bg-gray-300/80 dark:bg-gray-700 hover:dark:bg-gray-700/80"
              loading={loading}
              onClick={() => {
                mutate(
                  `/api/teams/${teamInfo?.currentTeam?.id}/domains/${domain}/verify`,
                );
              }}
            >
              Refresh
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              loading={deleting}
            >
              Delete
            </Button>
          </div>
        </div>
        <div className="flex h-10 flex-col space-y-2 sm:flex-row sm:items-center sm:space-x-5 sm:space-y-0">
          <div className="flex items-center space-x-2">
            {status ? (
              status === "Valid Configuration" ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              ) : status === "Pending Verification" ? (
                <AlertCircle className="h-6 w-6 text-yellow-500" />
              ) : (
                <XCircle className="h-6 w-6 text-red-500" />
              )
            ) : (
              <LoadingSpinner className="mr-1 h-5 w-5" />
            )}
            <p className="text-sm text-muted-foreground">
              {status ? status : "Checking Domain Status"}
            </p>
          </div>
        </div>
        {status && status !== "Valid Configuration" && (
          <DomainConfiguration domain={domain} />
        )}
      </div>
    </>
  );
}

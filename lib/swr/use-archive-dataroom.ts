import { useState } from "react";

import { toast } from "sonner";
import useSWR, { useSWRConfig } from "swr";

import { fetcher } from "@/lib/utils";

export default function useArchiveDataroom(
  dataroomId: string,
  teamId?: string,
) {
  const { mutate } = useSWRConfig();
  const { data, isLoading, error } = useSWR<{ isArchived: boolean }>(
    teamId && dataroomId
      ? `/api/teams/${teamId}/datarooms/${dataroomId}/archive`
      : null,
    fetcher,
  );

  const [isUpdating, setIsUpdating] = useState(false);

  const toggleArchive = async () => {
    if (!teamId) return;

    setIsUpdating(true);
    try {
      const response = await fetch(
        `/api/teams/${teamId}/datarooms/${dataroomId}/archive`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        return toast.error("Failed to archive/unarchive dataroom.");
      } else {
        toast.success(
          data?.isArchived
            ? "Dataroom unarchived successfully!"
            : "Dataroom archived successfully!",
        );
      }

      mutate(`/api/teams/${teamId}/datarooms`);
      mutate(`/api/teams/${teamId}/datarooms/archived`);
      mutate(`/api/teams/${teamId}/datarooms/${dataroomId}/archive`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to archive/unarchive dataroom.");
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    isArchived: data?.isArchived ?? false,
    toggleArchive,
    error,
    isLoading,
    isUpdating,
  };
}

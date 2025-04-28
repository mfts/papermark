import { useTeam } from "@/context/team-context";
import useSWR from "swr";
import { z } from "zod";

import { fetcher } from "@/lib/utils";

import { TagsWithTotalCount } from "../types";

export const getTagsQuerySchema = z.object({
  sortBy: z
    .enum(["name", "createdAt"])
    .optional()
    .default("name")
    .describe("The field to sort the tags by."),
  sortOrder: z
    .enum(["asc", "desc"])
    .optional()
    .default("asc")
    .describe("The order to sort the tags by."),
  search: z
    .string()
    .optional()
    .describe("The search term to filter the tags by."),
  page: z
    .preprocess((val) => parseInt(val as string, 10), z.number().min(1))
    .optional(),
  pageSize: z
    .preprocess(
      (val) => parseInt(val as string, 10),
      z.number().min(1).max(100),
    )
    .optional(),
});

const partialQuerySchema = getTagsQuerySchema.partial();

export function useTags({
  query,
  enabled = true,
  includeLinksCount = false,
}: {
  query?: z.infer<typeof partialQuerySchema>;
  enabled?: boolean;
  includeLinksCount?: boolean;
}) {
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  const {
    data: tags,
    isValidating,
    error,
    isLoading,
    mutate,
  } = useSWR<TagsWithTotalCount>(
    teamId &&
      enabled &&
      `/api/teams/${teamId}/tags?${new URLSearchParams({
        ...query,
        includeLinksCount,
      } as Record<string, any>).toString()}`,
    fetcher,
    {
      dedupingInterval: 100000,
    },
  );

  return {
    tags: tags?.tags,
    tagCount: tags?.totalCount,
    loading: tags ? false : true,
    isValidating,
    error,
    isLoading,
    mutate,
  };
}

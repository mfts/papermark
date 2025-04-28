import { useRouter } from "next/navigation";

import { Dispatch, SetStateAction, useMemo, useState } from "react";

import { Tag } from "lucide-react";
import { toast } from "sonner";
import { mutate } from "swr";

import { useTags } from "@/lib/swr/use-tags";
import { TagProps } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select-v2";

import { DEFAULT_LINK_TYPE } from "..";

function getTagOption(tag: TagProps) {
  return {
    value: tag.id,
    label: tag.name,
    icon: (
      <Tag
        size={20}
        className={`rounded-sm border border-gray-200 bg-${tag.color}-100 p-1 dark:text-primary-foreground`}
      />
    ),
    meta: { color: tag.color, description: tag.description },
  };
}

export default function TagSection({
  data,
  setData,
  editLink,
  teamId,
}: {
  data: DEFAULT_LINK_TYPE;
  setData: Dispatch<SetStateAction<DEFAULT_LINK_TYPE>>;
  editLink?: boolean;
  teamId: string;
}) {
  const router = useRouter();
  // TODO
  // const [searchQuery, setSearchQuery] = useState<string>("");
  // const [currentPage, setCurrentPage] = useState(1);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [selectedValues, setSelectedValues] = useState<string[]>(
    data.tags || [],
  );

  const {
    // tagCount,
    tags: availableTags,
    loading: loadingTags,
  } = useTags({
    query: {
      sortBy: "createdAt",
      sortOrder: "desc",
    },
  });

  const options = useMemo(
    () => availableTags?.map((tag) => getTagOption(tag)),
    [availableTags],
  );

  // Callback to handle value change
  const handleValueChange = (value: string[]) => {
    setSelectedValues(value);
    setData((prevData) => ({
      ...prevData,
      tags: value,
    }));
  };

  const createTag = async (tag: string) => {
    const res = await fetch(`/api/teams/${teamId}/tags`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: tag }),
    });
    if (!res.ok) {
      const { error } = await res.json();
      toast.error(error);
      return false;
    }

    const newTag = await res.json();
    await mutate(
      `/api/teams/${teamId}/tags?${new URLSearchParams({
        sortBy: "createdAt",
        sortOrder: "desc",
        includeLinksCount: false,
      } as Record<string, any>).toString()}`,
    );
    setSelectedValues([...selectedValues, newTag.id]);
    setData((prevData) => ({
      ...prevData,
      tags: [...prevData.tags, newTag.id],
    }));
    setIsPopoverOpen(false);
    toast.success(`Successfully created tag!`);
    return true;
  };

  return (
    <>
      <div className="flex justify-between">
        <Label htmlFor="link-domain">Tags</Label>
        <a
          href={`/settings/tags`}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Manage
        </a>
      </div>
      <div className="flex">
        <MultiSelect
          loading={loadingTags}
          options={options ?? []}
          value={selectedValues}
          setIsPopoverOpen={setIsPopoverOpen}
          isPopoverOpen={isPopoverOpen}
          onValueChange={handleValueChange}
          placeholder="Select tags..."
          maxCount={3}
          searchPlaceholder="Search or add tags..."
          onCreate={(search) => createTag(search)}
        />
      </div>
    </>
  );
}

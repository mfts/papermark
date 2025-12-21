import Link from "next/link";

import { Dispatch, SetStateAction, useMemo, useState } from "react";

import { PlanEnum } from "@/ee/stripe/constants";
import { CircleHelpIcon, Tag } from "lucide-react";
import { toast } from "sonner";
import { mutate } from "swr";

import { usePlan } from "@/lib/swr/use-billing";
import { useTags } from "@/lib/swr/use-tags";
import { TagColorProps } from "@/lib/types";

import { UpgradePlanModalWithDiscount } from "@/components/billing/upgrade-plan-modal-with-discount";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select-v2";
import { BadgeTooltip } from "@/components/ui/tooltip";

type TagProps = {
  id: string;
  name: string;
  color: string;
  description: string | null;
};

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

interface DataroomTagSectionProps {
  dataroomId: string;
  teamId: string;
  initialTags?: {
    tag: {
      id: string;
      name: string;
      color: string;
      description: string | null;
    };
  }[];
}

export default function DataroomTagSection({
  dataroomId,
  teamId,
  initialTags,
}: DataroomTagSectionProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [selectedValues, setSelectedValues] = useState<string[]>(
    initialTags?.map((t) => t.tag.id) || [],
  );
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { isFree } = usePlan();

  const {
    tagCount,
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

  // Check if there are unsaved changes
  const hasChanges = useMemo(() => {
    const initialTagIds = initialTags?.map((t) => t.tag.id) || [];
    if (selectedValues.length !== initialTagIds.length) return true;
    return !selectedValues.every((id) => initialTagIds.includes(id));
  }, [selectedValues, initialTags]);

  // Callback to handle value change
  const handleValueChange = (value: string[]) => {
    setSelectedValues(value);
  };

  // Save tags to API
  const handleSave = async () => {
    setIsSaving(true);

    try {
      const res = await fetch(`/api/teams/${teamId}/datarooms/${dataroomId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tags: selectedValues }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        toast.error(error);
        return;
      }

      await Promise.all([
        mutate(`/api/teams/${teamId}/datarooms`),
        mutate(`/api/teams/${teamId}/datarooms/${dataroomId}`),
      ]);

      toast.success("Successfully updated tags!");
    } catch (error) {
      toast.error("Failed to update tags");
      console.error("Error updating tags:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const createTag = async (tag: string) => {
    if (isFree && tagCount && tagCount >= 5) {
      setShowUpgradeModal(true);
      toast.error("You have reached the maximum number of tags.");
      return false;
    }

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

    // Add to selected values - same pattern as link-sheet
    setSelectedValues([...selectedValues, newTag.id]);
    setIsPopoverOpen(false);
    toast.success("Successfully created tag!");
    return true;
  };

  return (
    <>
      <Card className="bg-transparent">
        <CardHeader>
          <CardTitle>Tags</CardTitle>
          <CardDescription>
            Organize your dataroom by adding tags for better categorization and
            filtering
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between">
            <div className="flex items-center gap-2">
              <Label htmlFor="dataroom-tags">Tags</Label>
              <BadgeTooltip content="Organize datarooms by tags to easily filter and find them">
                <CircleHelpIcon className="h-4 w-4 shrink-0 text-muted-foreground hover:text-foreground" />
              </BadgeTooltip>
            </div>
            <Link
              href={`/settings/tags`}
              className="text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              Manage
            </Link>
          </div>
          <div className="mt-2 flex gap-2">
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
              popoverClassName="sm:w-[400px]"
            />
            <Button
              onClick={handleSave}
              loading={isSaving}
              disabled={!hasChanges || isSaving}
              size="default"
            >
              Save
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between rounded-b-lg border-t bg-muted px-6 py-3">
          <p className="text-sm text-muted-foreground transition-colors">
            Tags help you organize and filter datarooms across your workspace.
          </p>
        </CardFooter>
      </Card>
      {showUpgradeModal && (
        <UpgradePlanModalWithDiscount
          clickedPlan={PlanEnum.Pro}
          trigger="create_tag"
          open={showUpgradeModal}
          setOpen={setShowUpgradeModal}
        />
      )}
    </>
  );
}

import Link from "next/link";

import { useState } from "react";

import { useTeam } from "@/context/team-context";
import useSWR from "swr";

import { fetcher } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { DEFAULT_LINK_TYPE } from ".";

type AccessGroup = {
  id: string;
  name: string;
  type: "ALLOW" | "BLOCK";
  emailList: string[];
};

type AccessGroupSectionProps = {
  type: "ALLOW" | "BLOCK";
  data: DEFAULT_LINK_TYPE;
  setData: React.Dispatch<React.SetStateAction<DEFAULT_LINK_TYPE>>;
  isAllowed: boolean;
  groupIdField: "allowAccessGroupId" | "blockAccessGroupId";
};

export default function AccessGroupSection({
  type,
  data,
  setData,
  isAllowed,
  groupIdField,
}: AccessGroupSectionProps) {
  const teamInfo = useTeam();
  const groupId = data[groupIdField];

  // Fetch access groups
  const { data: accessGroups, isLoading: isLoadingGroups } = useSWR<
    AccessGroup[]
  >(
    teamInfo?.currentTeam?.id && isAllowed
      ? `/api/teams/${teamInfo.currentTeam.id}/access-groups?type=${type}`
      : null,
    fetcher,
  );

  // Get selected group details
  const selectedGroup = accessGroups?.find((group) => group.id === groupId);

  // State for expanding email list
  const [showAllEmails, setShowAllEmails] = useState<boolean>(false);

  const handleGroupSelection = (selectedGroupId: string) => {
    if (selectedGroupId === "none") {
      setData((prevData) => ({
        ...prevData,
        [groupIdField]: null,
      }));
    } else {
      setData((prevData) => ({
        ...prevData,
        [groupIdField]: selectedGroupId,
      }));
    }
  };

  const typeLabel = type === "ALLOW" ? "Allow" : "Block";
  const typePlaceholder = type === "ALLOW" ? "allow" : "block";

  return (
    <>
      {/* Group Selection */}
      {!isLoadingGroups && accessGroups && accessGroups.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>{typeLabel} List Group (Optional)</Label>
            <Link
              href="/settings/access-control"
              className="text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              Manage
            </Link>
          </div>
          <Select
            value={groupId || "none"}
            onValueChange={handleGroupSelection}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={`Select a ${typePlaceholder} list group`}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No group selected</SelectItem>
              {accessGroups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  <div className="flex w-full items-center justify-between">
                    <span>{group.name}</span>
                    <Badge variant="secondary" className="ml-2">
                      {group.emailList.length}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedGroup && (
            <div className="text-xs text-muted-foreground">
              <div className="font-medium">{selectedGroup.name}</div>
              <div className="mt-1">
                {(showAllEmails
                  ? selectedGroup.emailList
                  : selectedGroup.emailList.slice(0, 3)
                ).map((email, i, arr) => (
                  <span key={i} className="font-mono">
                    {email}
                    {i < arr.length - 1 && ", "}
                  </span>
                ))}
                {selectedGroup.emailList.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setShowAllEmails(!showAllEmails)}
                    className="ml-1 font-medium text-primary hover:underline"
                  >
                    {showAllEmails
                      ? "show less"
                      : `and ${selectedGroup.emailList.length - 3} more`}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {isLoadingGroups && (
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>{typeLabel} List Group (Optional)</Label>
            <Link
              href="/settings/access-control"
              className="text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              Manage
            </Link>
          </div>
          <div className="rounded-md border border-dashed p-3 text-center">
            <p className="text-sm text-muted-foreground">Loading groups...</p>
          </div>
        </div>
      )}

      {isAllowed &&
        !isLoadingGroups &&
        (!accessGroups || accessGroups.length === 0) && (
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>{typeLabel} List Group (Optional)</Label>
              <Link
                href="/settings/access-control"
                className="text-xs text-muted-foreground hover:text-foreground hover:underline"
              >
                Manage
              </Link>
            </div>
            <div className="rounded-md border border-dashed p-3 text-center">
              <p className="text-sm text-muted-foreground">
                No {typePlaceholder} list groups created yet.{" "}
                <Link
                  href="/settings/access-control"
                  className="font-medium text-primary hover:underline"
                >
                  Create your first group
                </Link>{" "}
                to reuse the same {typePlaceholder} list across multiple links.
              </p>
            </div>
          </div>
        )}
    </>
  );
}

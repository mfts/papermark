import { useRouter } from "next/router";

import { useState } from "react";

import { LinkIcon, PlusIcon, UsersIcon } from "lucide-react";
import { ShieldIcon } from "lucide-react";
import { SearchIcon } from "lucide-react";

import useAllowListGroups, {
  type AllowListGroup,
} from "@/lib/swr/use-allow-list-groups";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { Skeleton } from "../ui/skeleton";
import AllowListGroupModal from "./allow-list-group-modal";

export default function AllowListGroupsSection({
  groups,
  loading,
  searchQuery,
}: {
  groups: AllowListGroup[] | undefined;
  loading: boolean;
  searchQuery: string;
}) {
  const router = useRouter();
  const { mutate } = useAllowListGroups();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<AllowListGroup | null>(
    null,
  );

  const handleManage = (group: AllowListGroup) => {
    router.push(`/visitors/groups/${group.id}`);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-lg border p-4"
          >
            <div className="flex items-center space-x-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-9 w-24 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {groups && groups.length > 0 ? (
          <div className="space-y-3">
            {groups.map((group) => (
              <Card
                key={group.id}
                className="transition-colors hover:bg-muted/50"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
                        <ShieldIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {group.name}
                        </h3>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <UsersIcon className="h-4 w-4 text-gray-500" />
                        <div className="flex items-center space-x-0.5">
                          <span className="font-medium text-gray-700">
                            {group.allowList.length}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">•</span>
                        <LinkIcon className="h-4 w-4 text-gray-500" />
                        <div className="flex items-center space-x-0.5">
                          <span className="font-medium text-gray-700">
                            {group._count.links}
                          </span>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleManage(group)}
                      >
                        Manage
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {searchQuery ? (
              <div className="flex flex-col items-center justify-center space-y-4 py-12">
                <div className="rounded-full bg-gray-100 p-3">
                  <SearchIcon className="h-6 w-6 text-gray-600" />
                </div>
                <div className="text-center">
                  <h3 className="font-medium">No results found</h3>
                  <p className="mt-1 max-w-sm text-sm text-gray-500">
                    Your search for &quot;{searchQuery}&quot; did not return any
                    results.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-4 py-12">
                <div className="rounded-full bg-gray-100 p-3">
                  <PlusIcon className="h-6 w-6 text-gray-600" />
                </div>
                <div className="text-center">
                  <h3 className="font-medium">
                    No allow list groups configured
                  </h3>
                  <p className="mt-1 max-w-sm text-sm text-gray-500">
                    Create allow list groups to quickly apply your preferred
                    settings when creating links.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  Create your first allow list group
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <AllowListGroupModal
        isOpen={isCreateModalOpen || isEditModalOpen}
        setIsOpen={(open) => {
          setIsCreateModalOpen(false);
          setIsEditModalOpen(false);
          if (!open) setSelectedGroup(null);
        }}
        group={selectedGroup}
        onSuccess={() => {
          mutate();
        }}
      />
    </>
  );
}

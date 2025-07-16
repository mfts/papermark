import Link from "next/link";
import { useRouter } from "next/router";

import { useState } from "react";

import { useTeam } from "@/context/team-context";
import {
  ArrowLeft,
  ExternalLink,
  FileText,
  Shield,
  Trash2Icon,
  UserPenIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  deleteAllowListGroup,
  useAllowListGroup,
} from "@/lib/swr/use-allow-list-groups";
import { nFormatter } from "@/lib/utils";

import AppLayout from "@/components/layouts/app";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import AllowListGroupModal from "@/components/visitors/allow-list-group-modal";

function AllowListGroupPageSkeleton() {
  return (
    <>
      <header className="flex items-center justify-between py-4">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-9 w-9 rounded-md" />
          <div>
            <Skeleton className="h-8 w-48" />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-9 w-20 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      </header>
      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
              <Skeleton className="mt-2 h-24 w-full rounded-md" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
              <div className="mt-2 space-y-3">
                {[...Array(2)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center space-x-3 rounded-md p-2"
                  >
                    <Skeleton className="h-6 w-6 flex-shrink-0 rounded-full" />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-3">
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-4 w-4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

export default function AllowListGroupPage() {
  const router = useRouter();
  const { groupId } = router.query as { groupId: string };
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  const { allowListGroup: group, loading, mutate } = useAllowListGroup(groupId);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!teamId || !group) return;

    setIsDeleting(true);
    try {
      await deleteAllowListGroup(teamId, group.id);
      toast.success("Allow list group deleted successfully");
      router.push("/visitors?tab=allow-lists");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete group",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    mutate();
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="relative mx-2 mb-10 mt-4 space-y-8 overflow-hidden px-1 sm:mx-3 md:mx-5 md:mt-5 lg:mx-7 lg:mt-8 xl:mx-10">
          <AllowListGroupPageSkeleton />
        </div>
      </AppLayout>
    );
  }

  if (!group) {
    return (
      <AppLayout>
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Group not found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              The allow list group you&apos;re looking for doesn&apos;t exist.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push("/visitors?tab=allow-lists")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Allow Lists
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const totalUsage = group._count.links;

  return (
    <AppLayout>
      <div className="relative mx-2 mb-10 mt-4 space-y-8 overflow-hidden px-1 sm:mx-3 md:mx-5 md:mt-5 lg:mx-7 lg:mt-8 xl:mx-10">
        <header className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {group.name}
              </h1>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
            >
              <UserPenIcon className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium text-red-600 shadow-sm transition-colors hover:bg-accent hover:text-red-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                  disabled={isDeleting}
                >
                  <Trash2Icon className="mr-2 h-4 w-4" />
                  Delete
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the{" "}
                    <span className="font-bold">{group.name}</span> group.
                    <br />
                    <span className="mt-2 block text-sm text-yellow-600">
                      This action cannot be undone.
                    </span>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete Group"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </header>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">
                    Email addresses & domains
                  </CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    These emails and domains have access when this group is
                    applied to a link
                  </p>
                </div>
                <Badge variant="secondary" className="text-sm">
                  {group.allowList.length}{" "}
                  {group.allowList.length === 1 ? "entry" : "entries"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
                <pre className="whitespace-pre-wrap break-all font-mono text-sm text-foreground">
                  {group.allowList.join("\n")}
                </pre>
              </div>
            </CardContent>
          </Card>

          {group.links.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Used in links
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Navigate to documents and datarooms using this group
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {group.links.length}{" "}
                  {group.links.length === 1 ? "link" : "links"}
                </Badge>
              </div>

              <div className="space-y-2">
                {group.links.map((link, index) => (
                  <Link
                    key={link.id}
                    href={
                      link.linkType === "DOCUMENT_LINK"
                        ? `/documents/${link.document?.id}`
                        : `/datarooms/${link.dataroom?.id}/permissions`
                    }
                    className="group flex items-center space-x-3 rounded-md border border-border bg-background p-3 transition hover:bg-muted/50"
                    title={link.name || `Link #${link.id.slice(-5)}`}
                  >
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-foreground group-hover:text-primary">
                        {link.name || `Link #${link.id.slice(-8)}`}
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {link.linkType === "DOCUMENT_LINK"
                          ? "Document"
                          : "Dataroom"}
                        :{" "}
                        {link.linkType === "DOCUMENT_LINK"
                          ? link.document?.name
                          : link.dataroom?.name}
                      </div>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-3 pr-1">
                      <span className="text-xs text-muted-foreground">
                        {nFormatter(link._count?.views || 0)} views
                      </span>
                      <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {isEditModalOpen && (
          <AllowListGroupModal
            isOpen={isEditModalOpen}
            setIsOpen={setIsEditModalOpen}
            group={group}
            onSuccess={handleEditSuccess}
          />
        )}
      </div>
    </AppLayout>
  );
}
import { useRouter } from "next/router";
import AppLayout from "@/components/layouts/app";
import ErrorPage from "next/error";
import { useTeam } from "@/lib/swr/use-team";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyDocuments } from "../documents";
import { AddDocumentModal } from "@/components/documents/add-document-modal";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import MoreHorizontal from "@/components/shared/icons/more-horizontal";
import Person from "@/components/shared/icons/person";
import { AddTeamMembers } from "@/components/teams/add-team-member-modal";
import { useState } from "react";

export default function TeamPage() {
  const { team, error, loading } = useTeam();
  const [isModalOpen, setModalOpen] = useState<boolean>(false);

  const router = useRouter();

  if (error && error.status === 404) {
    return <ErrorPage statusCode={404} />;
  }

  const getUserDocumentsCount = (userId: string) => {
    const documents = team?.documents;
    const userDocuments = documents?.filter(
      (document) => document.ownerId === userId
    );

    return userDocuments?.length;
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-4 sm:m-4">
        <div className="flex items-center justify-between mb-4 md:mb-8 lg:mb-12">
          <div className="space-y-1">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-36" />
                <Skeleton className="h-4 w-32" />
              </div>
            ) : (
              <>
                <h2 className="text-2xl text-foreground font-semibold tracking-tight">
                  {team?.name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Manage your teams
                </p>
              </>
            )}
          </div>
          <ul className="flex items-center justify-between gap-4">
            <AddDocumentModal>
              <Button> Add New Document</Button>
            </AddDocumentModal>

            <AddTeamMembers open={isModalOpen} setOpen={setModalOpen}>
              <Button className="flex items-center gap-2">
                <Person className="w-5 h-5" /> Add New Members
              </Button>
            </AddTeamMembers>
          </ul>
        </div>
        <Separator className="my-6" />

        <Tabs defaultValue="documents">
          <TabsList className="w-[400px] h-10">
            <TabsTrigger value="documents" className="flex-1 text-base">
              Documents
            </TabsTrigger>
            <TabsTrigger value="members" className="flex-1 text-base">
              Members
            </TabsTrigger>
          </TabsList>

          {/* documents  */}
          <TabsContent value="documents">
            {team?.documents.length === 0 ? (
              <div className="flex items-center justify-center h-96">
                <EmptyDocuments />
              </div>
            ) : (
              <div className="rounded-md sm:border my-4">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-medium">Name</TableHead>
                      <TableHead className="font-medium">Owner</TableHead>
                      <TableHead className="font-medium w-[300px]">
                        Number of views
                      </TableHead>
                      <TableHead className="font-medium text-center sm:text-right"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {team ? (
                      team?.documents.map((document) => (
                        <TableRow key={document.id} className="group/row">
                          <TableCell>{document.name}</TableCell>
                          <TableCell>{document.owner.name}</TableCell>
                          <TableCell>{document.views.length}</TableCell>
                          <TableCell className="text-center sm:text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() =>
                                    router.push(`/documents/${document.id}`)
                                  }>
                                  Stats
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell className="min-w-[100px]">
                          <Skeleton className="h-6 w-full" />
                        </TableCell>
                        <TableCell className="min-w-[450px]">
                          <Skeleton className="h-6 w-full" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-24" />
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* members  */}
          <TabsContent value="members">
            <Table className="my-4">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="w-[300px]">
                    Number of documents
                  </TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {team?.users.map((member) => (
                  <TableRow key={member.userId}>
                    <TableCell className="font-medium">
                      {member.user.name}
                    </TableCell>
                    <TableCell>{member.user.email}</TableCell>
                    <TableCell>
                      {getUserDocumentsCount(member.userId)}
                    </TableCell>
                    <TableCell>{member.role.toLowerCase()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

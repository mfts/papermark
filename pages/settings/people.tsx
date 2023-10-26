import AppLayout from "@/components/layouts/app";
import Navbar from "@/components/settings/navbar";
import { Button } from "@/components/ui/button";
import MoreVertical from "@/components/shared/icons/more-vertical";
import Folder from "@/components/shared/icons/folder";
import { useGetTeam } from "@/lib/swr/use-team";

export default function Billing() {
  const { team } = useGetTeam();

  const getUserDocumentCount = (userId: string) => {
    const documents = team?.documents.filter(
      (document) => document.owner.id === userId
    );
    return documents?.length;
  };

  return (
    <AppLayout>
      <Navbar current="People" />
      <div className="p-4 sm:p-4 sm:m-4">
        <div className="flex items-center justify-between mb-4 md:mb-8 lg:mb-12">
          <div className="space-y-1">
            <h3 className="text-2xl text-foreground font-semibold tracking-tight">
              Team Members
            </h3>
            <p className="text-sm text-muted-foreground">
              Manage your team members
            </p>
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center p-10 rounded-lg border border-border bg-secondary">
            <div className="flex flex-col space-y-3">
              <h2 className="text-xl font-medium">People</h2>
              <p className="text-sm text-secondary-foreground">
                Teammates that have access to this project.
              </p>
            </div>
            <Button>Invite</Button>
          </div>
        </div>

        <ul className="mt-6 border rounded-lg divide-y">
          {team?.users.map((member) => (
            <li className="flex py-4 px-10 justify-between items-center">
              <div className="flex items-center gap-12">
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm">{member.user.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    {member.user.email}
                  </p>
                </div>
                <div className="text-sm">
                  <div className="flex items-center gap-2">
                    <Folder />
                    <span className="text-xs text-foreground">
                      {getUserDocumentCount(member.userId)} documents
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-12">
                <span className="text-sm text-foreground capitalize">
                  {member.role.toLowerCase()}
                </span>
                <MoreVertical className="w-4 h-4" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </AppLayout>
  );
}

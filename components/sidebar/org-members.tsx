import Link from "next/link";
import { useRouter } from "next/router";

import { useSession } from "next-auth/react";

import { usePlan } from "@/lib/swr/use-billing";
import { useOrgMembers } from "@/lib/swr/use-org-members";
import { getEmailDomain } from "@/lib/utils/email-domain";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { Button } from "../ui/button";
import { BadgeTooltip } from "../ui/tooltip";

export function OrgMembers({ teamId }: { teamId: string }) {
  const { members } = useOrgMembers(teamId);
  const { data: session } = useSession();
  const { isFree } = usePlan();

  if (!members?.length || !session?.user?.email) return null;

  const domain = getEmailDomain(session.user.email);
  const zIndex = ["z-30", "z-20", "z-10"];
  return (
    <Button
      variant="ghost"
      type="button"
      size="sm"
      className="mt-1 h-auto w-full justify-start p-2"
    >
      <Link href="/settings/people" className="block">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-4">
            {isFree
              ? members.slice(0, 3).map((member, index) => (
                  <Avatar
                    key={member.id}
                    className={`h-6 w-6 border-2 border-background ${zIndex[index]}`}
                  >
                    <AvatarFallback className="text-xs text-secondary-foreground">
                      ?
                    </AvatarFallback>
                  </Avatar>
                ))
              : members.slice(0, 3).map((member, index) => (
                  <BadgeTooltip content={member.email} key={member.id}>
                    <Avatar
                      key={member.id}
                      className={`z- h-6 w-6 border-2 border-background transition-all duration-300 hover:scale-110 ${zIndex[index]} hover:z-40`}
                    >
                      <AvatarImage
                        src={member.image || ""}
                        alt={member.name || ""}
                      />
                      <AvatarFallback className="text-xs capitalize">
                        {member.name?.charAt(0) || member.email?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </BadgeTooltip>
                ))}
          </div>
          <p className="text-left text-xs text-muted-foreground">
            {members.length} {members.length === 1 ? "person" : "people"} from{" "}
            {domain} {members.length === 1 ? "is" : "are"} on Papermark
          </p>
        </div>
      </Link>
    </Button>
  );
}
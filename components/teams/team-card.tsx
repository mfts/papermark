import Image from "next/image";
import { ITeam } from "@/lib/types";
import { getExtension } from "@/lib/utils";
import Link from "next/link";
import Folder from "@/components/shared/icons/folder";
import Person from "@/components/shared/icons/person";


export default function TeamCard({
	team,
}: {
	team: ITeam;
}) {
	return (
		<li className="relative rounded-lg p-3 border-0 dark:bg-secondary ring-1 ring-gray-200 dark:ring-gray-700 transition-all hover:ring-gray-400 hover:dark:ring-gray-500 hover:bg-secondary sm:p-4 flex justify-between items-center">
      <div className="min-w-0 block shrink items-center space-x-4 truncate line-clamp-1">
				<Link href={`/teams/${team.id}`}>
					<div className="flex-col">
						<div className="flex items-center">
							<h2 className="min-w-0 text-sm font-semibold leading-6 text-foreground truncate max-w-[240px] sm:max-w-md">
								<span className="">{team.name}</span>
								<span className="absolute inset-0" />
							</h2>
						</div>
						<div className="mt-3 flex flex-col gap-2">
							<div className="flex items-center gap-2">
								<Folder /> 
								<span className="text-xs text-foreground">{team.documents.length} documents</span>
							</div>
							<div className="flex items-center gap-2">
								<Person />
								<span className="text-xs text-foreground">{team.users.length} members</span>
							</div>
						</div>
					</div>
				</Link>
      </div>
    </li>
	)
}
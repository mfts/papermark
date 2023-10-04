import { useTeams } from '@/lib/swr/use-teams';
import Skeleton from '@/components/Skeleton';
import AppLayout from '@/components/layouts/app'
import { AddTeamModal } from '@/components/teams/add-team-modal';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { PlusIcon, RectangleGroupIcon } from '@heroicons/react/24/solid';
import TeamCard from '@/components/teams/team-card';

export default function Teams() {

  const { teams } = useTeams();

  return (
    <AppLayout>
      <div className="p-4 sm:p-4 sm:m-4">
        <div className="flex items-center justify-between mb-4 md:mb-8 lg:mb-12">
          <div className='space-y-1'>
            <h2 className="text-2xl text-foreground font-semibold tracking-tight">
              Teams
            </h2>
            <p className="text-sm text-muted-foreground">Manage your teams</p>
          </div>
          <ul className="flex items-center justify-between gap-4">
            <AddTeamModal>
            <Button>
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              New Team
            </Button>
            </AddTeamModal>
          </ul>
        </div>
        <Separator className="my-6" />

        {teams && teams.length === 0 && (
          <div className="flex items-center justify-center h-96">
            <EmptyTeams />
          </div>
        )}

        {/* teams list  */}
        <ul role="list" className="grid lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 gap-6">
          {teams
            ? teams.map((team) => {
                return <TeamCard key={team.id} team={team} />;
              })
            : Array.from({ length: 4 }).map((_, i) => (
                <li
                  key={i}
                  className="flex flex-col space-y-4 px-4 py-4 sm:px-6 lg:px-8"
                >
                  <Skeleton key={i} className="h-5 w-25" />
                  <Skeleton key={i} className="mt-3 h-3 w-12" />
                  <Skeleton key={i} className="mt-3 h-3 w-12" />
                </li>
              ))
          }
        </ul>
      </div>
    </AppLayout>
  )
}

export function EmptyTeams() {
  return (
    <div className="text-center">
      <div className="text-center">
        <RectangleGroupIcon className="mx-auto h-12 w-12 text-muted-foreground" />
      <h3 className="mt-2 text-sm font-medium text-foreground">No teams</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Get started by creating a new team.
      </p>
      <div className="mt-6">
        <AddTeamModal>
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-foreground bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            New Team
          </button>
        </AddTeamModal>
      </div>
    </div>
    </div>  
  );
}
import AppLayout from '@/components/layouts/app'
import { AddTeamModal } from '@/components/teams/add-team-modal';
import { PlusIcon, RectangleGroupIcon } from '@heroicons/react/24/solid';

export default function Teams() {
  return (
    <AppLayout>
      <div className="flex items-center justify-center h-96">
        <EmptyTeams />
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
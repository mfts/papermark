import { useState } from "react";

import { AddViewerModal } from "@/components/datarooms/add-viewer-modal";
import { DataroomHeader } from "@/components/datarooms/dataroom-header";
import { DataroomNavigation } from "@/components/datarooms/dataroom-navigation";
import AppLayout from "@/components/layouts/app";
import { Button } from "@/components/ui/button";
import DataroomViewersTable from "@/components/visitors/dataroom-viewers";

import { useDataroom } from "@/lib/swr/use-dataroom";

export default function DataroomPage() {
  const { dataroom } = useDataroom();

  const [modalOpen, setModalOpen] = useState<boolean>(false);

  if (!dataroom) {
    return <div>Loading...</div>;
  }

  return (
    <AppLayout>
      <div className="relative mx-2 mb-10 mt-4 space-y-8 overflow-hidden px-1 sm:mx-3 md:mx-5 md:mt-5 lg:mx-7 lg:mt-8 xl:mx-10">
        <header>
          <DataroomHeader
            title={dataroom.name}
            description={dataroom.pId}
            actions={[
              <Button onClick={() => setModalOpen(true)} key={1}>
                Invite users
              </Button>,
            ]}
          />

          <DataroomNavigation dataroomId={dataroom.id} />
        </header>

        <div className="space-y-4">
          {/* Visitors */}
          <DataroomViewersTable dataroomId={dataroom.id} />

          <AddViewerModal
            dataroomId={dataroom.id}
            open={modalOpen}
            setOpen={setModalOpen}
          />
        </div>
      </div>
    </AppLayout>
  );
}

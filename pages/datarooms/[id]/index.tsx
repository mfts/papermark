import { DataroomHeader } from "@/components/datarooms/dataroom-header";
import StatsCard from "@/components/datarooms/stats-card";
import AppLayout from "@/components/layouts/app";
import LinkSheet from "@/components/links/link-sheet";
import LinksTable from "@/components/links/links-table";
import { NavMenu } from "@/components/navigation-menu";
import { Button } from "@/components/ui/button";
import DataroomVisitorsTable from "@/components/visitors/dataroom-visitors-table";
import { useDataroom, useDataroomLinks } from "@/lib/swr/use-dataroom";
import { useState } from "react";

export default function DataroomPage() {
  const { dataroom } = useDataroom();
  const { links } = useDataroomLinks();

  const [isLinkSheetOpen, setIsLinkSheetOpen] = useState<boolean>(false);

  if (!dataroom) {
    return <div>Loading...</div>;
  }

  return (
    <AppLayout>
      <div className="relative overflow-hidden mx-2 sm:mx-3 md:mx-5 lg:mx-7 xl:mx-10 mt-4 md:mt-5 lg:mt-8 mb-10 space-y-8 px-1">
        <header>
          <DataroomHeader
            title={dataroom.name}
            description={dataroom.pId}
            actions={[
              <Button onClick={() => setIsLinkSheetOpen(true)} key={1}>
                Create Link
              </Button>,
            ]}
          />

          <NavMenu
            navigation={[
              {
                label: "Overview",
                href: `/datarooms/${dataroom.id}`,
                segment: `${dataroom.id}`,
              },
              {
                label: "Documents",
                href: `/datarooms/${dataroom.id}/documents`,
                segment: "documents",
              },
              {
                label: "Users",
                href: `/datarooms/${dataroom.id}/users`,
                segment: "users",
              },
              {
                label: "Customization",
                href: `/datarooms/${dataroom.id}/settings`,
                segment: "settings",
              },
            ]}
          />
        </header>

        <div className="space-y-4">
          {/* Stats */}
          <StatsCard />

          {/* Links */}
          <LinksTable links={links} targetType={"DATAROOM"} />

          {/* Visitors */}
          <DataroomVisitorsTable dataroomId={dataroom.id} />

          <LinkSheet
            linkType={"DATAROOM_LINK"}
            isOpen={isLinkSheetOpen}
            setIsOpen={setIsLinkSheetOpen}
            existingLinks={links}
          />
        </div>
      </div>
    </AppLayout>
  );
}

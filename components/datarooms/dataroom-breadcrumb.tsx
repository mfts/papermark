import Link from "next/link";
import { useRouter } from "next/router";

import React, { useMemo } from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { useDataroomFolderWithParents } from "@/lib/swr/use-dataroom";

function BreadcrumbComponentBase({
  name,
  dataroomId,
}: {
  name: string[];
  dataroomId: string;
}) {
  const { folders: folderNames } = useDataroomFolderWithParents({
    name,
    dataroomId,
  });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem key={"root"}>
          <BreadcrumbLink asChild>
            <Link href={`/datarooms/${dataroomId}/documents`}>Home</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {folderNames &&
          folderNames.map((item, index: number, array) => {
            return (
              <React.Fragment key={index}>
                <BreadcrumbSeparator />
                {index === array.length - 1 ? (
                  <BreadcrumbItem>
                    <BreadcrumbPage className="capitalize">
                      {item.name}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                ) : (
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link
                        href={`/datarooms/${dataroomId}/documents${item.path}`}
                        className="capitalize"
                      >
                        {item.name}
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                )}
              </React.Fragment>
            );
          })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

const BreadcrumbComponent = () => {
  const router = useRouter();
  const name = router.query.name as string[];
  const dataroomId = router.query.id as string;

  // Use useMemo to memoize the base component with the current name value.
  // This way, BreadcrumbComponentBase is only re-rendered when name changes.
  const MemoizedBreadcrumbComponent = useMemo(() => {
    return <BreadcrumbComponentBase name={name} dataroomId={dataroomId} />;
  }, [name, dataroomId]);

  return MemoizedBreadcrumbComponent;
};

export { BreadcrumbComponent };

import Link from "next/link";
import { useRouter } from "next/router";

import React, { useMemo } from "react";

import {
  useDataroom,
  useDataroomTrashFolderWithParents,
} from "@/lib/swr/use-dataroom";

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function BreadcrumbComponentBase({
  name,
  dataroomId,
}: {
  name: string[];
  dataroomId: string;
}) {
  const { dataroom } = useDataroom();
  const { folders } = useDataroomTrashFolderWithParents({
    name,
    dataroomId,
  });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/datarooms">Datarooms</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href={`/datarooms/${dataroomId}/trash`}>
              {dataroom?.name || "Loading..."}
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href={`/datarooms/${dataroomId}/trash`}>Trash</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {folders && folders.length > 0 && <BreadcrumbSeparator />}
        {folders && folders.length > 2 ? (
          <>
            <BreadcrumbItem>
              <DropdownMenu>
                <DropdownMenuTrigger
                  asChild={false}
                  className="flex items-center gap-1 rounded-md p-1 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  aria-label="Show folders in trash breadcrumb"
                >
                  <BreadcrumbEllipsis className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {folders.slice(0, -2).map((folder, index) => (
                    <DropdownMenuItem key={index}>
                      <Link
                        href={`/datarooms/${dataroomId}/trash${folder.path}`}
                        className="w-full"
                      >
                        {folder.name}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link
                  href={`/datarooms/${dataroomId}/trash${folders[folders.length - 2].path}`}
                  className="max-w-[200px] truncate"
                >
                  {folders[folders.length - 2].name}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="max-w-[200px] truncate">
                {folders[folders.length - 1].name}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ) : (
          folders?.map((folder, index) => (
            <React.Fragment key={index}>
              <BreadcrumbItem>
                {index === folders.length - 1 ? (
                  <BreadcrumbPage className="max-w-[200px] truncate">
                    {folder.name}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link
                      href={`/datarooms/${dataroomId}/trash${folder.path}`}
                      className="max-w-[200px] truncate"
                    >
                      {folder.name}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {index < folders.length - 1 && <BreadcrumbSeparator />}
            </React.Fragment>
          ))
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

const DataroomTrashBreadcrumb = () => {
  const router = useRouter();
  const name = (router.query.name as string[] | undefined) ?? [];
  const dataroomId = router.query.id as string;
  const MemoizedBreadcrumbComponent = useMemo(() => {
    return <BreadcrumbComponentBase name={name} dataroomId={dataroomId} />;
  }, [name, dataroomId]);

  return MemoizedBreadcrumbComponent;
};

export { DataroomTrashBreadcrumb };
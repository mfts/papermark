import Link from "next/link";
import { useRouter } from "next/router";

import React, { useMemo } from "react";

import {
  useDataroom,
  useDataroomFolderWithParents,
} from "@/lib/swr/use-dataroom";
import {
  HIERARCHICAL_DISPLAY_STYLE,
  useHierarchicalDisplayName,
} from "@/lib/utils/hierarchical-display";

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

import { TruncatedBreadcrumbLink } from "../layouts/breadcrumb";

const BreadcrumbFolderItem = ({
  folder,
  dataroomId,
  isLast,
}: {
  folder: any;
  dataroomId: string;
  isLast: boolean;
}) => {
  const displayName = useHierarchicalDisplayName(
    folder.name,
    folder.hierarchicalIndex,
  );

  if (isLast) {
    return (
      <BreadcrumbPage
        className="max-w-[200px] truncate"
        style={HIERARCHICAL_DISPLAY_STYLE}
      >
        {displayName}
      </BreadcrumbPage>
    );
  }

  return (
    <BreadcrumbLink asChild>
      <Link
        href={`/datarooms/${dataroomId}/documents${folder.path}`}
        className="max-w-[200px] truncate"
        style={HIERARCHICAL_DISPLAY_STYLE}
      >
        {displayName}
      </Link>
    </BreadcrumbLink>
  );
};

const BreadcrumbDropdownItem = ({
  folder,
  dataroomId,
}: {
  folder: any;
  dataroomId: string;
}) => {
  const displayName = useHierarchicalDisplayName(
    folder.name,
    folder.hierarchicalIndex,
  );

  return (
    <DropdownMenuItem>
      <Link
        href={`/datarooms/${dataroomId}/documents${folder.path}`}
        className="w-full"
        style={HIERARCHICAL_DISPLAY_STYLE}
      >
        {displayName}
      </Link>
    </DropdownMenuItem>
  );
};

function BreadcrumbComponentBase({
  name,
  dataroomId,
}: {
  name: string[];
  dataroomId: string;
}) {
  const { dataroom } = useDataroom();
  const { folders } = useDataroomFolderWithParents({
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
          <TruncatedBreadcrumbLink
            href={`/datarooms/${dataroomId}/documents`}
            text={dataroom?.name}
          />
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href={`/datarooms/${dataroomId}/documents`}>Documents</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {folders && folders.length > 0 && <BreadcrumbSeparator />}
        {folders && folders.length > 2 ? (
          <>
            <BreadcrumbItem>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1">
                  <BreadcrumbEllipsis className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {folders.slice(0, -2).map((folder, index) => (
                    <BreadcrumbDropdownItem
                      key={index}
                      folder={folder}
                      dataroomId={dataroomId}
                    />
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbFolderItem
                folder={folders[folders.length - 2]}
                dataroomId={dataroomId}
                isLast={false}
              />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbFolderItem
                folder={folders[folders.length - 1]}
                dataroomId={dataroomId}
                isLast={true}
              />
            </BreadcrumbItem>
          </>
        ) : (
          folders?.map((folder, index) => (
            <React.Fragment key={index}>
              <BreadcrumbItem>
                <BreadcrumbFolderItem
                  folder={folder}
                  dataroomId={dataroomId}
                  isLast={index === folders.length - 1}
                />
              </BreadcrumbItem>
              {index < folders.length - 1 && <BreadcrumbSeparator />}
            </React.Fragment>
          ))
        )}
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

import Link from "next/link";
import { useRouter } from "next/router";

import React, { useMemo } from "react";

import { useFolderWithParents } from "@/lib/swr/use-folders";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb";

function BreadcrumbComponentBase({ name }: { name: string[] }) {
  const { folders: folderNames } = useFolderWithParents({ name });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem key={"root"}>
          <BreadcrumbLink asChild>
            <Link href="/documents">Documents</Link>
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
                        href={`/documents/tree${item.path}`}
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

  // Use useMemo to memoize the base component with the current name value.
  // This way, BreadcrumbComponentBase is only re-rendered when name changes.
  const MemoizedBreadcrumbComponent = useMemo(() => {
    return <BreadcrumbComponentBase name={name} />;
  }, [name]);

  return MemoizedBreadcrumbComponent;
};

export { BreadcrumbComponent };

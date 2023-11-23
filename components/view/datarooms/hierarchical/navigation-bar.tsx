import { useSession } from "next-auth/react";
import FolderIcon from "@/components/shared/icons/folder";
import { cn } from "@/lib/utils";
import { useRouter } from "next/router";
import LoadingSpinner from "../../../ui/loading-spinner";
import { useState, useEffect } from "react";
import { FolderDirectory } from "@/lib/types";
import ChevronRight from "@/components/shared/icons/chevron-right";
import ChevronDown from "@/components/shared/icons/chevron-down";
import Link from "next/link";
import OpenFolderIcon from "@/components/shared/icons/open-folder";

export default function NavigationBar({
  folderDirectory,

}: {
  folderDirectory: FolderDirectory,
}) {
  const { data: session, status } = useSession();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isBottom, setIsBottom] = useState(true);

  const router = useRouter();
  const path = router.query.path as string[]
  const currentFolderId = path[path.length - 1];
  const homeFolderId = path[0];
  const dataroomId = router.query.dataroomId as string;

  //Dynamically increase size of navigation bar on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition >= 50);
      const bottomThreshold = document.body.scrollHeight - window.innerHeight - 2;
      setIsBottom(scrollPosition >= bottomThreshold);
    };

    // Add the event listener
    window.addEventListener('scroll', handleScroll);

    // Remove the event listener on unmount
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isBottom, setIsBottom, setIsScrolled]);

  if (status === "loading") return <LoadingSpinner className="mr-1 h-5 w-5" />;

  return (
    <>
      {/* Static sidebar for desktop */}
      <div className={`hidden lg:fixed lg:z-0 lg:flex lg:w-72 lg:flex-col ${isBottom ? 'bottom-2' : 'bottom-0'} ${isScrolled ? 'h-full' : 'h-4/5'}`}>
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-50 dark:bg-gray-800 px-6 rounded-md">
          <div className="flex h-16 shrink-0 items-center">
            <p className="text-2xl font-bold tracking-tighter text-black dark:text-white flex items-center">
              {folderDirectory[currentFolderId].name}{" "}
            </p>
          </div>
          <div className="-mt-4">
            <FolderComponent
              folderId={homeFolderId}
              folderDirectory={folderDirectory}
              currentFolderId={currentFolderId}
              dataroomId={dataroomId}
              path={path}
            />
          </div>
        </div>
      </div>
    </>
  );
}

function FolderComponent({
  folderId,
  folderDirectory,
  currentFolderId,
  dataroomId,
  path,
}: {
  folderId: string,
  folderDirectory: FolderDirectory,
  currentFolderId: string,
  dataroomId: string,
  path: string[],
}) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  return (
    <div>
      <div className="flex item-center">
        {isExpanded
          ? <div onClick={() => setIsExpanded(false)} className="mt-2"><ChevronDown /></div>
          : <div onClick={() => setIsExpanded(true)} className="mt-2"><ChevronRight /></div>
        }
        <Link
          href={`/view/dataroom/hierarchical/[dataroomId]/[...path]`}
          as={`/view/dataroom/hierarchical/${dataroomId}${folderDirectory[folderId].href}`}
          shallow={true}
          className={cn(
            path.includes(folderId)
              ? "bg-gray-200 dark:bg-secondary text-secondary-foreground font-semibold"
              : "text-muted-foreground hover:text-foreground hover:bg-gray-200 hover:dark:bg-muted",
            "group flex gap-x-3 items-center rounded-md p-1 text-sm w-full disabled:hover:bg-transparent disabled:text-muted-foreground disabled:cursor-default"
          )}>
          {path.includes(folderId)
            ?
            <OpenFolderIcon
              className="h-6 w-6 shrink-0"
              aria-hidden="true"
            />
            :
            <FolderIcon
              className="h-6 w-6 shrink-0"
              aria-hidden="true"
            />
          }
          {folderDirectory[folderId].name}
        </Link>
      </div>
      <div className="ml-4 mt-2">
        {isExpanded &&
          folderDirectory[folderId].subfolders.map((subfolderId) => {
            return (
              <div>
                <FolderComponent
                  folderId={subfolderId}
                  folderDirectory={folderDirectory}
                  currentFolderId={currentFolderId}
                  dataroomId={dataroomId}
                  path={path}
                />
              </div>
            )
          })
        }
      </div>
    </div>
  )
}
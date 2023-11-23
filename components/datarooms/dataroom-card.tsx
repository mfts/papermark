import { copyToClipboard, timeAgo } from "@/lib/utils";
import { DataroomFolder, type Dataroom, type HierarchicalDataroom } from "@prisma/client";
import Copy from "@/components/shared/icons/copy";
import Image from "next/image";
import { Button } from "../ui/button";
import { useState } from "react";
import { Dispatch, SetStateAction } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import FolderIcon from "../shared/icons/folder";

export type DataroomCardType = {
  id: string;
  name: string;
  createdAt: Date;
  _count: {
    files: number;
  };
  type: "PAGE" | "HIERARCHICAL"
}

export default function DataroomCard({
  dataroom,
  homePages,
  setDatarooms,
  setLoading
}: {
  dataroom: DataroomCardType
  homePages?: DataroomFolder[];
  setDatarooms: Dispatch<SetStateAction<DataroomCardType[] | undefined>>,
  setLoading: Dispatch<SetStateAction<boolean>>;
}) {
  const router = useRouter();
  function handleCopyToClipboard(id: string, type: "PAGE" | "HIERARCHICAL") {
    if (dataroom.type === "PAGE") {
      copyToClipboard(`${process.env.NEXT_PUBLIC_BASE_URL}/view/dataroom/paged/${id}`, "Link copied to clipboard.");
    } else {
      copyToClipboard(`${process.env.NEXT_PUBLIC_BASE_URL}/view/dataroom/hierarchical/${id}`, "Link copied to clipboard.");
    }
  }
  const [isFirstClick, setIsFirstClick] = useState<boolean>(false);
  const handleButtonClick = (event: any) => {
    event.preventDefault();
    if (isFirstClick) {
      if (dataroom.type === "PAGE") {
        setDatarooms((currentDatarooms) => currentDatarooms?.filter((currentDataroom) => !(currentDataroom === dataroom)));
        deleteDataroomFromDatabase(dataroom.id, dataroom.type);
      } else {
        setDatarooms((currentDatarooms) => currentDatarooms?.filter((currentDataroom) => !(currentDataroom === dataroom)));
        deleteDataroomFromDatabase(dataroom.id, dataroom.type);
      }
    } else {
      setIsFirstClick(true);
    }
  }

  return (
    <li className="relative rounded-lg p-3 border-0 dark:bg-secondary ring-1 ring-gray-200 dark:ring-gray-700 transition-all hover:ring-gray-400 hover:dark:ring-gray-500 hover:bg-secondary sm:p-4 flex justify-between items-center">
      <div className="min-w-0 flex shrink items-center space-x-4">
        <div className="w-8 mx-1 text-center flex justify-center items-center">
          <Image
            src={`/_icons/dataroom.svg`}
            alt="Dataroom icon"
            width={50}
            height={50}
            className=""
          />
        </div>
        <div className="flex-col">
          <div className="flex items-center">
            <h2 className="min-w-0 text-sm font-semibold leading-6 text-foreground truncate max-w-[240px] sm:max-w-md">
              <Link
                href={`/datarooms/${dataroom.id}/${(homePages?.find((homePage) => homePage.dataroomId === dataroom.id))?.id}`}
                onClick={() => setLoading(true)}>
                <span className="">{dataroom.name}</span>
                <span className="absolute inset-0" />
              </Link>
            </h2>
            <div className="flex ml-2">
              <button
                className="group rounded-full bg-gray-200 dark:bg-gray-700 z-10 p-1.5 transition-all duration-75 hover:scale-105 hover:bg-emerald-100 hover:dark:bg-emerald-200 active:scale-95"
                onClick={() => handleCopyToClipboard(dataroom.id, dataroom.type)}
                title="Copy to clipboard"
              >
                <Copy
                  className="text-gray-400 group-hover:text-emerald-700"
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>
          <div className="mt-1 flex items-center space-x-1 text-xs leading-5 text-muted-foreground">
            <p className="truncate">{timeAgo(dataroom.createdAt)}</p>
            <p>•</p>
            <p className="truncate">{dataroom.type === "HIERARCHICAL" ? "Hierarchical" : "Paged"}</p>
            <p>•</p>
            <FolderIcon />
            <p className="truncate">{`${dataroom._count.files} ${dataroom._count.files === 1 ? "Document" : "Documents"
              }`}</p>
          </div>
        </div>
      </div>

      <Button
        onClick={handleButtonClick}
        className="flex items-center z-10 space-x-1 rounded-md text-destructive hover:bg-red-500 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 transition-all duration-75 hover:scale-105 active:scale-100"
      >
        {isFirstClick ? "Really remove?" : "Remove dataroom"}
      </Button>
    </li>
  );
}

//Update database when dataroom is deleted
async function deleteDataroomFromDatabase(id: string, type: "PAGE" | "HIERARCHICAL") {
  if (type === "PAGE") {
    const response = await fetch(`/api/datarooms/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } else {
    const response = await fetch(`/api/datarooms/hierarchical-datarooms/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }
}
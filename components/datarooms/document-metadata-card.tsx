import { DataroomDocument } from "@/lib/types";
import Link from "next/link";
import Image from "next/image";
import { Button } from "../ui/button";

export default function DocumentMetadataCard({
  title,
  url,
  type,
  setDataRoomDocuments
}: {
  title: string,
  url: string,
  type: string,
  setDataRoomDocuments: (dataRoomDocuments: any) => void
}) {

  return (
    <li className="relative rounded-lg p-3 border-0 dark:bg-secondary ring-1 ring-gray-200 dark:ring-gray-700 transition-all hover:ring-gray-400 hover:dark:ring-gray-500 hover:bg-secondary sm:p-4 flex justify-between items-center">
      <div className="min-w-0 flex shrink items-center space-x-4">
        <div className="w-8 mx-1 text-center flex justify-center items-center">
          <Image
            src={`/_icons/${type}.svg`}
            alt="File icon"
            width={50}
            height={50}
            className=""
          />
        </div>
        <div className="flex-col">
          <div className="flex-col items-center">
            <div className="flex items-center">
              <h2>
                <span className="min-w-0 text-sm font-semibold leading-6 text-foreground truncate max-w-[240px] sm:max-w-md"> {title}</span>
              </h2>
            </div>
            <Link href={url} className="min-w-0 text-sm font-semibold leading-6 text-foreground truncate max-w-[240px] sm:max-w-md">
              <span className="flex items-center space-x-1 text-xs leading-5 text-muted-foreground"> {url}</span>
              <span className="absolute inset-0" />
            </Link>
          </div>
        </div>
      </div>
      <Button
        onClick={() => {
          setDataRoomDocuments((dataRoomDocuments: DataroomDocument[]) => dataRoomDocuments.filter((dataRoomDocument) => !(dataRoomDocument.title === title)));
        }}
        className="flex items-center z-10 space-x-1 rounded-md bg-gray-200 dark:bg-gray-700 px-2 py-0.5 transition-all duration-75 hover:scale-105 active:scale-100"
      >
        <p className="text-destructive focus:bg-destructive focus:text-destructive-foreground">
          Remove
        </p>
      </Button>
    </li>
  );
}
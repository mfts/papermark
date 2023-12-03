import {
  copyToClipboard,
  getExtension,
  nFormatter,
  timeAgo,
} from "@/lib/utils";
import Link from "next/link";
import { DocumentWithLinksAndLinkCountAndViewCount } from "@/lib/types";
import Copy from "@/components/shared/icons/copy";
import BarChart from "@/components/shared/icons/bar-chart";
import Image from "next/image";

export default function DocumentsCard({
  document,
}: {
  document: DocumentWithLinksAndLinkCountAndViewCount;
}) {
  function handleCopyToClipboard(id: string) {
    copyToClipboard(
      `${process.env.NEXT_PUBLIC_BASE_URL}/view/${id}`,
      "Link copied to clipboard.",
    );
  }

  return (
    <li className="relative rounded-lg p-3 border-0 dark:bg-secondary ring-1 ring-gray-200 dark:ring-gray-700 transition-all hover:ring-gray-400 hover:dark:ring-gray-500 hover:bg-secondary sm:p-4 flex justify-between items-center">
      <div className="min-w-0 flex shrink items-center space-x-4">
        <div className="w-8 mx-1 text-center flex justify-center items-center">
          <Image
            src={`/_icons/${document.type}.svg`}
            alt="File icon"
            width={50}
            height={50}
            className=""
          />
        </div>
        <div className="flex-col">
          <div className="flex items-center">
            <h2 className="min-w-0 text-sm font-semibold leading-6 text-foreground truncate max-w-[240px] sm:max-w-md">
              <Link href={`/documents/${document.id}`}>
                <span className="">{document.name}</span>
                <span className="absolute inset-0" />
              </Link>
            </h2>
            <div className="flex ml-2">
              <button
                className="group rounded-full bg-gray-200 dark:bg-gray-700 z-10 p-1.5 transition-all duration-75 hover:scale-105 hover:bg-emerald-100 hover:dark:bg-emerald-200 active:scale-95"
                onClick={() => handleCopyToClipboard(document.links[0].id)}
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
            <p className="truncate">{timeAgo(document.createdAt)}</p>
            <p>•</p>
            <p className="truncate">{`${document._count.links} ${
              document._count.links === 1 ? "Link" : "Links"
            }`}</p>
            {document._count.versions > 1 ? (
              <>
                <p>•</p>
                <p className="truncate">{`${document._count.versions} Versions`}</p>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <Link
        onClick={(e) => {
          e.stopPropagation();
        }}
        href={`/documents/${document.id}`}
        className="flex items-center z-10 space-x-1 rounded-md bg-gray-200 dark:bg-gray-700 px-2 py-0.5 transition-all duration-75 hover:scale-105 active:scale-100"
      >
        <BarChart className="h-4 w-4 text-muted-foreground" />
        <p className="whitespace-nowrap text-sm text-muted-foreground">
          {nFormatter(document._count.views)}
          <span className="ml-1 hidden sm:inline-block">views</span>
        </p>
      </Link>
    </li>
  );
}

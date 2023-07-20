import { getExtension, nFormatter, timeAgo } from "@/lib/utils";
import { ChevronRightIcon } from "@heroicons/react/20/solid";
import { DocumentDuplicateIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { DocumentWithLinksAndLinkCount } from "@/lib/types";
import toast from "react-hot-toast";
import Notification from "@/components/Notification";

export default function DocumentsCard({
  document,
}: {
  document: DocumentWithLinksAndLinkCount;
}) {
  function handleCopyToClipboard(id: string) {
    navigator.clipboard
      .writeText(`${process.env.NEXT_PUBLIC_BASE_URL}/view/${id}`)
      .catch((error) => {
        console.log("Failed to copy text to clipboard", error);
      });

    toast.custom((t) => (
      <Notification
        visible={t.visible}
        closeToast={() => toast.dismiss(t.id)}
        message={``}
      />
    ));
  }

  return (
    <li className="relative rounded-lg bg-gray-800 p-3 pr-1 border-0 ring-1 ring-gray-700 transition-all hover:ring-gray-600 sm:p-4 mx-5 my-2 flex justify-between items-center max-w-4xl ml-auto">
      <div className="min-w-0 flex shrink items-center space-x-4">
        <div className="rounded-full p-2 bg-gray-700 w-10 text-center flex justify-center items-center">
          <span className="text-white whitespace-nowrap">
            {getExtension(document.file)}
          </span>
        </div>
        <div className="flex-col">
          <div className="flex items-center">
            <h2 className="min-w-0 text-sm font-semibold leading-6 text-white">
              <Link href={`/documents/${document.id}`}>
                <span className="truncate">{document.name}</span>
                <span className="absolute inset-0" />
              </Link>
            </h2>
            <div className="flex ml-2">
              <button
                className="group rounded-full bg-gray-700 z-10 p-1.5 transition-all duration-75 hover:scale-105 hover:bg-blue-50 active:scale-95"
                onClick={() => handleCopyToClipboard(document.links[0].id)}
                title="Copy to clipboard"
              >
                {/* <DocumentDuplicateIcon className="h-5 w-5 text-gray-500 group-hover:text-blue-800" aria-hidden="true" /> */}
                <Copy
                  className="text-gray-400 group-hover:text-blue-800"
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>
          <div className="mt-1 flex items-center space-x-1 text-xs leading-5 text-gray-400">
            <p className="truncate">{timeAgo(document.createdAt)}</p>
            <p>•</p>
            <p className="truncate">{`${document._count.links} ${
              document._count.links === 1 ? "Link" : "Links"
            }`}</p>
          </div>
        </div>
      </div>

      <ChevronRightIcon
        className="h-5 w-5 flex-none text-gray-400"
        aria-hidden="true"
      />
    </li>
  );
}


function Copy({ className }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      shapeRendering="geometricPrecision"
      className={className}
    >
      <path d="M15.5 2H8.6c-.4 0-.8.2-1.1.5-.3.3-.5.7-.5 1.1v12.8c0 .4.2.8.5 1.1.3.3.7.5 1.1.5h9.8c.4 0 .8-.2 1.1-.5.3-.3.5-.7.5-1.1V6.5L15.5 2z" />
      <path d="M3 7.6v12.8c0 .4.2.8.5 1.1.3.3.7.5 1.1.5h9.8" />
      <path d="M15 2v5h5" />
    </svg>
  );
}

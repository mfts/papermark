import { getExtension } from "@/lib/utils";
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
    navigator.clipboard.writeText(
      `${process.env.NEXT_PUBLIC_BASE_URL}/view/${id}`
    );

    toast.custom((t) => (
      <Notification
        visible={t.visible}
        closeToast={() => toast.dismiss(t.id)}
        message={``}
      />
    ));
  }

  return (
    <li className="relative flex justify-between items-center space-x-4 px-4 py-4 sm:px-6 lg:px-8">
      <div className="min-w-0 flex">
        <div className="flex-col">
          <div className="flex items-center">
            <h2 className="min-w-0 text-sm font-semibold leading-6 text-white">
              <Link href={`/documents/${document.id}`} className="flex gap-x-2">
                <span className="truncate">{document.name}</span>
                <span className="text-gray-400">/</span>
                <span className="whitespace-nowrap text-gray-500">
                  {getExtension(document.file)}
                </span>
                <span className="absolute inset-0" />
              </Link>
            </h2>
            <div className="flex ml-2">
              <button
                className="text-gray-500 hover:text-gray-700 z-10"
                onClick={() => handleCopyToClipboard(document.links[0].id)}
                title="Copy to clipboard"
              >
                <DocumentDuplicateIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-x-2.5 text-xs leading-5 text-gray-400">
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

import Skeleton from "../Skeleton";
import { DocumentDuplicateIcon } from "@heroicons/react/24/outline";
import Notification from "../Notification";
import toast from "react-hot-toast";
import { useDocumentLinks } from "@/lib/swr/use-document";
import { formatDistance, parseISO } from "date-fns";
import { useRouter } from "next/router";
import { useState } from "react";
import { mutate } from "swr";

export default function LinksContainer() {
  const { links } = useDocumentLinks();

  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const documentId = router.query.id as string;

  const handleCopyToClipboard = (id: string) => {
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
  };

  async function addNewLink() {
    setIsLoading(true);
    const response = await fetch("/api/links", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        documentId: documentId,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const newLink = await response.json();

    // Update local data with the new link
    mutate(
      `/api/documents/${encodeURIComponent(documentId)}/links`,
      [...(links || []), newLink],
      false
    );

    setIsLoading(false);
  }

  return (
    <div className="border-t border-white/10 pt-11">
      <h2 className="px-4 text-base font-semibold leading-7 text-white sm:px-6 lg:px-8">
        All links
      </h2>
      <table className="mt-6 w-full whitespace-nowrap text-left">
        <colgroup>
          <col className="w-full sm:w-4/12" />
          <col className="lg:w-4/12" />
          <col className="lg:w-2/12" />
          <col className="lg:w-2/12" />
        </colgroup>
        <thead className="border-b border-white/10 text-sm leading-6 text-white">
          <tr>
            <th
              scope="col"
              className="py-2 pl-4 pr-8 font-semibold sm:pl-6 lg:pl-8"
            >
              Link URL
            </th>
            <th
              scope="col"
              className="hidden py-2 pl-0 pr-8 font-semibold sm:table-cell"
            >
              Views
            </th>
            <th
              scope="col"
              className="py-2 pl-0 pr-4 text-right font-semibold sm:pr-8 sm:text-left lg:pr-20"
            >
              Status
            </th>
            <th
              scope="col"
              className="hidden py-2 pl-0 pr-4 text-right font-semibold sm:table-cell sm:pr-6 lg:pr-8"
            >
              Last Viewed
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {links ? (
            links.map((link) => (
              <tr key={link.id}>
                <td className="py-4 pl-4 pr-8 sm:pl-6 lg:pl-8">
                  <div className="flex items-center gap-x-4">
                    <div className="truncate text-sm font-medium leading-6 text-white">
                      {link.id}
                    </div>
                    <button
                      className="text-gray-500 hover:text-gray-700"
                      onClick={() => handleCopyToClipboard(link.id)}
                      title="Copy to clipboard"
                    >
                      <DocumentDuplicateIcon
                        className="h-5 w-5"
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                </td>
                <td className="hidden py-4 pl-0 pr-4 sm:table-cell sm:pr-8">
                  <div className="flex gap-x-3">
                    <div className="font-mono text-sm leading-6 text-gray-400">
                      {`${link._count.views} ${
                        link._count.views === 1 ? "View" : "Views"
                      }`}
                    </div>
                  </div>
                </td>
                <td className="py-4 pl-0 pr-4 text-sm leading-6 sm:pr-8 lg:pr-20">
                  <div className="flex items-center justify-end gap-x-2 sm:justify-start">
                    <div className="text-green-400 bg-green-400/10 flex-none rounded-full p-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-current" />
                    </div>
                    <div className="hidden text-white sm:block">Active</div>
                  </div>
                </td>
                <td className="hidden py-4 pl-0 pr-4 text-right text-sm leading-6 text-gray-400 sm:table-cell sm:pr-6 lg:pr-8">
                  {link.views[0] ? (
                    <time
                      dateTime={new Date(link.views[0].viewedAt).toISOString()}
                    >
                      {formatDistance(
                        parseISO(
                          new Date(link.views[0].viewedAt).toISOString()
                        ),
                        new Date(),
                        { addSuffix: true }
                      )}
                    </time>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))
          ) : (
            <>
              <tr>
                <td className="py-4 pl-4 pr-8 sm:pl-6 lg:pl-8">
                  <Skeleton className="h-5 w-full" />
                </td>
              </tr>
              <tr>
                <td className="py-4 pl-4 pr-8 sm:pl-6 lg:pl-8">
                  <Skeleton className="h-5 w-full" />
                </td>
              </tr>
            </>
          )}
          {isLoading && (
            <tr>
              <td className="py-4 pl-4 pr-8 sm:pl-6 lg:pl-8">
                <Skeleton className="h-5 w-full" />
              </td>
            </tr>
          )}
          <tr>
            <td className="py-4 pl-4 pr-8 sm:pl-6 lg:pl-8">
              <button
                onClick={() => addNewLink()}
                className="text-gray-400 hover:text-gray-50"
              >
                Add another link
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

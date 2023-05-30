import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import prisma from "@/lib/prisma";
import Sidebar from "@/components/Sidebar";
import { classNames, getExtension } from "@/lib/utils";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]";
import { CustomUser } from "@/lib/types";
import { Link as DocumentLink, Document, View } from "@prisma/client";
import Link from "next/link";
import { DocumentDuplicateIcon } from "@heroicons/react/24/outline";
import { parseISO, format, formatDistance } from "date-fns";
import { useState } from "react";
import Skeleton from "@/components/Skeleton";
import toast from "react-hot-toast";
import Notification from "@/components/Notification";

interface LinkWithView extends DocumentLink {
  views: { viewedAt: string }[];
  _count: {
    views: number;
  };
}

const DocumentPage = ({
  document,
  links,
  views,
  groupedViews,
}: {
  document: Document;
  links: LinkWithView[];
  views: View[];
  groupedViews: { viewerEmail: string; _count: { id: number } }[];
}) => {
  const router = useRouter();
  const [localLinks, setLocalLinks] = useState<LinkWithView[]>(links);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  if (router.isFallback) {
    return <div>Loading...</div>;
  }

  const stats = [
    { name: "Number of views", value: views.length.toString(), active: true },
    {
      name: "Number of unique viewers",
      value: groupedViews.length.toString(),
      active: true,
    },
    {
      name: "Average view duration",
      value: "3.65",
      unit: "mins",
      active: false,
    },
    { name: "TBD", value: "98.5%", active: false },
  ];

  const handleCopyToClipboard = (id: string) => {
    navigator.clipboard.writeText(
      `${process.env.NEXT_PUBLIC_BASE_URL}/view/${id}`
    );

    toast.custom((t) => (
      <Notification t={t} closeToast={() => toast.dismiss(t.id)} message={``} />
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
        documentId: document.id,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const newLink = await response.json();
    setIsLoading(false);

    // Create a new array that includes the new link, then set it as the new state
    setLocalLinks([...localLinks, newLink]);
  }

  return (
    <>
      <div>
        <Sidebar>
          <main>
            <header>
              {/* Heading */}
              <div className="flex flex-col items-start justify-between gap-x-8 gap-y-4 bg-gray-700/10 px-4 py-4 sm:flex-row sm:items-center sm:px-6 lg:px-8">
                <div>
                  <div className="flex items-center gap-x-3">
                    <h1 className="flex gap-x-3 text-base leading-7">
                      <span className="font-semibold text-white">
                        {document.name}
                      </span>
                      <span className="text-gray-600">/</span>
                      <span className="font-semibold text-gray-500">
                        {getExtension(document.file)}
                      </span>
                    </h1>
                  </div>
                  <p className="mt-2 text-xs leading-6 text-gray-400">
                    {document.description}
                  </p>
                </div>
                <Link
                  className="order-first rounded flex-none px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-50 sm:order-none"
                  href={document.file}
                >
                  View Document
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 bg-gray-700/10 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, statIdx) => (
                  <div
                    key={stat.name}
                    className={classNames(
                      statIdx % 2 === 1
                        ? "sm:border-l"
                        : statIdx === 2
                        ? "lg:border-l"
                        : "",
                      "border-t border-white/5 py-6 px-4 sm:px-6 lg:px-8"
                    )}
                  >
                    <p
                      className={classNames(
                        !stat.active ? "text-gray-700" : "text-gray-400",
                        "text-sm font-medium leading-6"
                      )}
                    >
                      {stat.name}
                    </p>
                    <p className="mt-2 flex items-baseline gap-x-2">
                      <span
                        className={classNames(
                          !stat.active ? "text-gray-700" : "text-white",
                          "text-4xl font-semibold tracking-tight "
                        )}
                      >
                        {stat.value}
                      </span>
                      {stat.unit ? (
                        <span
                          className={classNames(
                            !stat.active ? "text-gray-700" : "text-gray-400",
                            "text-sm"
                          )}
                        >
                          {stat.unit}
                        </span>
                      ) : null}
                    </p>
                  </div>
                ))}
              </div>
            </header>

            {/* Links list */}
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
                  {localLinks.map((link) => (
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
                          <div className="hidden text-white sm:block">
                            Active
                          </div>
                        </div>
                      </td>
                      <td className="hidden py-4 pl-0 pr-4 text-right text-sm leading-6 text-gray-400 sm:table-cell sm:pr-6 lg:pr-8">
                        {link.views[0] && (
                          <time dateTime={link.views[0].viewedAt}>
                            {formatDistance(
                              parseISO(link.views[0].viewedAt),
                              new Date(),
                              { addSuffix: true }
                            )}
                          </time>
                        )}
                      </td>
                    </tr>
                  ))}
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
          </main>
        </Sidebar>
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  if (
    !context.params ||
    !context.params.id ||
    Array.isArray(context.params.id)
  ) {
    return {
      notFound: true,
    };
  }
  const { id } = context.params;

  const session = await getServerSession(context.req, context.res, authOptions);
  const userId = (session?.user as CustomUser)?.id;

  if (!userId) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  const document = await prisma.document.findUnique({
    where: { id: id },
  });

  if (!document) {
    return {
      notFound: true,
    };
  }

  if (document.ownerId !== userId) {
    return {
      redirect: {
        destination: "/dashboard",
        permanent: false,
      },
    };
  }

  const links = await prisma.link.findMany({
    where: { documentId: id },
    include: {
      _count: {
        select: { views: true },
      },
      views: {
        take: 1,
        orderBy: { viewedAt: "desc" },
        select: { viewedAt: true },
      },
    },
  });

  const views = await prisma.view.findMany({
    where: { documentId: id },
    orderBy: { viewedAt: "desc" },
  });

  const groupedViews = await prisma.view.groupBy({
    by: ["viewerEmail"],
    where: { documentId: id },
    _count: { id: true },
  });

  const serializedDocument = {
    ...document,
    createdAt: document.createdAt.toISOString(),
  };

  const serializedLinks = links.map((link) => ({
    ...link,
    views: link.views.map((view) => ({
      ...view,
      viewedAt: view.viewedAt.toISOString(),
    })),
  }));

  const serializedViews = views.map((view) => ({
    ...view,
    viewedAt: view.viewedAt.toISOString(),
  }));

  return {
    props: {
      document: serializedDocument,
      links: serializedLinks,
      views: serializedViews,
      groupedViews: groupedViews,
    },
  };
};

export default DocumentPage;

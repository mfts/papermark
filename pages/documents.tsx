import { GetServerSideProps } from "next";
import prisma from "@/lib/prisma";
import { ChevronRightIcon } from "@heroicons/react/20/solid";
import Sidebar from "@/components/Sidebar";
import { getServerSession } from "next-auth/next";
import { CustomUser } from "@/lib/types";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { Document, Link as DocumentLink } from "@prisma/client";
import Link from "next/link";
import { getExtension } from "@/lib/utils";
import { DocumentDuplicateIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import Notification from "@/components/Notification";

export const getServerSideProps: GetServerSideProps = async (context) => {
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

  const page = context.query.page ? parseInt(context.query.page as string) : 1;
  const pageSize = 10; // Change this to adjust the number of documents per page

  const skip = (page - 1) * pageSize;

  const documents = await prisma.document.findMany({
    where: {
      ownerId: userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      _count: {
        select: { links: true },
      },
      links: true,
    },
    skip: skip,
    take: pageSize,
  });

  const totalDocuments = await prisma.document.count({
    where: {
      ownerId: userId,
    },
  });

  const totalPages = Math.ceil(totalDocuments / pageSize);

  console.log("documents: ", documents);

  const serializedDocuments = documents.map((document) => ({
    ...document,
    createdAt: document.createdAt.toISOString(),
  }));

  return {
    props: { documents: serializedDocuments, currentPage: page, totalPages },
  };
};

// Define a type for the props expected by your Documents component
interface DocumentsWithCount extends Document {
  _count: {
    links: number;
  };
  links: DocumentLink[];
}

interface DocumentsProps {
  documents: DocumentsWithCount[];
}

export default function Documents({
  documents,
  currentPage,
  totalPages,
}: DocumentsProps & { currentPage: number; totalPages: number }) {
  const handleCopyToClipboard = (id: string) => {
    navigator.clipboard.writeText(
      `${process.env.NEXT_PUBLIC_BASE_URL}/view/${id}`
    );

    toast.custom((t) => (
      <Notification t={t} closeToast={() => toast.dismiss(t.id)} />
    ));
  };

  return (
    <>
      <div>
        <Sidebar>
          <main className="">
            <header className="flex items-center justify-between border-b border-white/5 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
              <h1 className="text-base font-semibold leading-7 text-white">
                My Documents
              </h1>
            </header>

            {/* Document list */}
            <ul role="list" className="divide-y divide-white/5">
              {documents.map((document) => {
                return (
                  <li
                    key={document.id}
                    className="relative flex justify-between items-center space-x-4 px-4 py-4 sm:px-6 lg:px-8"
                  >
                    <div className="min-w-0 flex">
                      <div className="flex-col">
                        <div className="flex items-center">
                          <h2 className="min-w-0 text-sm font-semibold leading-6 text-white">
                            <Link
                              href={`/documents/${document.id}`}
                              className="flex gap-x-2"
                            >
                              <span className="truncate">{document.name}</span>
                              <span className="text-gray-400">/</span>
                              <span className="whitespace-nowrap text-gray-500">
                                {getExtension(document.file)}
                              </span>
                              {/* <span className="absolute inset-0" /> */}
                            </Link>
                          </h2>
                          <div className="flex ml-2">
                            <button
                              className="text-gray-500 hover:text-gray-700"
                              onClick={() =>
                                handleCopyToClipboard(document.links[0].id)
                              }
                              title="Copy to clipboard"
                            >
                              <DocumentDuplicateIcon
                                className="h-5 w-5"
                                aria-hidden="true"
                              />
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
              })}
            </ul>
            <div className="flex justify-between mx-10">
              <Link
                href={currentPage > 1 ? `?page=${currentPage - 1}` : "#"}
                passHref
              >
                <button disabled={currentPage === 1}>Previous</button>
              </Link>
              <Link
                href={
                  currentPage < totalPages ? `?page=${currentPage + 1}` : "#"
                }
                passHref
              >
                <button disabled={currentPage === totalPages}>Next</button>
              </Link>
            </div>
          </main>
        </Sidebar>
      </div>
    </>
  );
}

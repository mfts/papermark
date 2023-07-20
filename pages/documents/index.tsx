import Sidebar from "@/components/Sidebar";
import useDocuments from "@/lib/swr/use-documents";
import DocumentCard from "@/components/documents/document-card";
import Skeleton from "@/components/Skeleton";
import { PlusIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { AddDocumentModal } from "@/components/documents/add-document-modal";

export default function Documents() {
  const { documents } = useDocuments();

  return (
    <>
      <div className="flex flex-col lg:flex-row min-h-screen bg-gradient-to-tl from-black to-gray-950">
        <Sidebar></Sidebar>
        <main className="lg:m-2 grow w-full bg-gray-900 shadow rounded-xl">
          <div className="border-b border-white/5 px-4 py-5 sm:px-6 lg:px-8">
            <div className="-ml-4 -mt-2 flex flex-wrap items-center justify-between sm:flex-nowrap">
              <div className="ml-4 mt-2">
                <h3 className="text-base font-semibold leading-6 text-white">
                  My Documents
                </h3>
              </div>
              {documents && documents.length !== 0 && (
                <div className="ml-4 mt-2 flex-shrink-0">
                  <AddDocumentModal>
                    <button
                      type="button"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <PlusIcon
                        className="-ml-1 mr-2 h-5 w-5"
                        aria-hidden="true"
                      />
                      New Document
                    </button>
                  </AddDocumentModal>
                </div>
              )}
            </div>
          </div>

          {documents && documents.length === 0 && (
            <div className="flex items-center justify-center h-96">
              <EmptyDocuments />
            </div>
          )}

          {/* Documents list */}
          <ul role="list" className="divide-y divide-white/5 overflow-y-hidden">
            {documents
              ? documents.map((document) => {
                  return <DocumentCard key={document.id} document={document} />;
                })
              : Array.from({ length: 3 }).map((_, i) => (
                  <li
                    key={i}
                    className="flex flex-col space-y-4 px-4 py-4 sm:px-6 lg:px-8"
                  >
                    <Skeleton key={i} className="h-5 w-20" />
                    <Skeleton key={i} className="mt-3 h-3 w-10" />
                  </li>
                ))}
          </ul>
        </main>
      </div>
    </>
  );
}

export function EmptyDocuments() {
  return (
    <div className="text-center">
      <svg
        className="mx-auto h-12 w-12 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
        />
      </svg>
      <h3 className="mt-2 text-sm font-medium text-white">No documents</h3>
      <p className="mt-1 text-sm text-gray-400">
        Get started by uploading a new document.
      </p>
      <div className="mt-6">
        <AddDocumentModal>
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            New Document
          </button>
        </AddDocumentModal>
      </div>
    </div>
  );
}

import { getExtension } from "@/lib/utils";
import { useDocument } from "@/lib/swr/use-document";
import ErrorPage from "next/error";
import StatsCard from "@/components/documents/stats-card";
import StatsChart from "@/components/documents/stats-chart";
import AppLayout from "@/components/layouts/app";
import LinkSheet from "@/components/links/link-sheet";
import Image from "next/image"
import LinksTable from "@/components/links/links-table";
import VisitorsTable from "@/components/visitors/visitors-table";

export default function DocumentPage() {
  const { document, error } = useDocument();

  if (error && error.status === 404) {
    return <ErrorPage statusCode={404} />;
  }

  return (
    <AppLayout>
      <div>
        {document ? (
          <>
            {/* Heading */}
            <div className="flex flex-col items-start justify-between gap-x-8 gap-y-4 p-4 sm:flex-row sm:items-center sm:m-4">
              <div className="space-y-2">
                <div className="flex space-x-4 items-center">
                  <div className="w-8">
                    <Image
                      src={`/_icons/${getExtension(document.file)}.svg`}
                      alt="File icon"
                      width={50}
                      height={50}
                      className=""
                    />
                  </div>
                  <h2 className="leading-7 text-2xl text-white font-semibold tracking-tight">
                    {document.name}
                  </h2>
                </div>
              </div>
              <LinkSheet>
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-gray-950 bg-gray-300 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Create Link
                </button>
              </LinkSheet>
            </div>
            {/* Stats */}
            {document.numPages !== null && (
              <StatsChart
                documentId={document.id}
                totalPages={document.numPages}
              />
            )}
            <StatsCard />
            {/* Visitors */}
            <VisitorsTable numPages={document.numPages!} />
            {/* Links */}
            <LinksTable />
          </>
        ) : (
          <div>Loading...</div>
        )}
      </div>
    </AppLayout>
  );
}

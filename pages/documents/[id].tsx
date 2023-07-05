import Sidebar from "@/components/Sidebar";
import { getExtension } from "@/lib/utils";
import Link from "next/link";
import { useDocument } from "@/lib/swr/use-document";
import ErrorPage from "next/error";
import LinksContainer from "@/components/links/links-container";
import StatsCard from "@/components/documents/stats-card";
import BarChartComponent from "@/components/charts/bar-chart";
import StatsChart from "@/components/documents/stats-chart";

export default function DocumentPage() {
  const { document, error } = useDocument();

  if (error && error.status === 404) {
    return <ErrorPage statusCode={404} />;
  }

  return (
    <>
      <div>
        <Sidebar>
          <main>
            {document ? (
              <>
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
                  {document.numPages !== null && (
                    <StatsChart
                      documentId={document.id}
                      totalPages={document.numPages}
                    />
                  )}
                  <StatsCard />
                </header>

                <LinksContainer />
              </>
            ) : (
              <div>Loading...</div>
            )}
          </main>
        </Sidebar>
      </div>
    </>
  );
}

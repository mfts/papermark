import Sidebar from "@/components/Sidebar";
import useDocuments from "@/lib/swr/use-documents";
import DocumentCard from "@/components/documents/document-card";
import Skeleton from "@/components/Skeleton";

export default function Documents() {
  const { documents } = useDocuments();

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

            {/* Documents list */}
            <ul role="list" className="divide-y divide-white/5">
              {documents
                ? documents.map((document) => {
                    return (
                      <DocumentCard key={document.id} document={document} />
                    );
                  })
                : Array.from({ length: 3 }).map((_, i) => (
                    <li className="flex flex-col space-y-4 px-4 py-4 sm:px-6 lg:px-8">
                      <Skeleton key={i} className="h-5 w-20" />
                      <Skeleton key={i} className="mt-3 h-3 w-10" />
                    </li>
                  ))}
            </ul>
          </main>
        </Sidebar>
      </div>
    </>
  );
}

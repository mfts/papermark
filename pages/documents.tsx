import Sidebar from "@/components/Sidebar";
import useDocuments from "@/lib/swr/use-documents";
import DocumentCard from "@/components/documents/document-card";

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
              {documents ? (
                documents.map((document) => {
                  return <DocumentCard key={document.id} document={document} />;
                })
              ) : (
                <div className="flex justify-center items-center h-96">
                  <p className="text-gray-400">Loading documents</p>
                </div>
              )}
            </ul>
          </main>
        </Sidebar>
      </div>
    </>
  );
}

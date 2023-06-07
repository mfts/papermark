import Sidebar from "@/components/Sidebar";
import { useState, useMemo } from "react";
import { useRouter } from "next/router";
// @ts-ignore
import type { PutBlobResult } from "@vercel/blob";
import toast from "react-hot-toast";
import Notification from "@/components/Notification";
import { ArrowUpTrayIcon } from "@heroicons/react/24/outline";

export default function Form() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  const imageBlobUrl = useMemo(
    () => (currentFile ? URL.createObjectURL(currentFile) : ""),
    [currentFile]
  );

  const handleSubmit = async (event: any) => {
    event.preventDefault();

    const data = new FormData(event.target);

    try {
      setUploading(true);

      // upload the file to the blob storage
      const blobResponse = await fetch("/api/file/upload", {
        method: "POST",
        body: data,
      });

      if (!blobResponse.ok) {
        throw new Error(`HTTP error! status: ${blobResponse.status}`);
      }

      // get the blob url from the response
      const blob = (await blobResponse.json()) as PutBlobResult;

      // create a document in the database with the blob url
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: blob.pathname,
          description: data.get("description"),
          url: blob.url,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const document = await response.json();

      navigator.clipboard.writeText(
        `${process.env.NEXT_PUBLIC_BASE_URL}/view/${document.links[0].id}`
      );

      toast.custom((t) => (
        <Notification
          visible={t.visible}
          closeToast={() => toast.dismiss(t.id)}
          message={
            "Document uploaded and link copied to clipboard. Redirecting to document page..."
          }
        />
      ));

      setTimeout(() => {
        router.push("/documents/" + document.id);
      }, 4000);
    } catch (error) {
      console.error("An error occurred while uploading the file: ", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <div>
        <Sidebar>
          {/* Main content */}
          <main className="mx-10 mt-8">
            <form encType="multipart/form-data" onSubmit={handleSubmit}>
              <div className="space-y-12">
                <div className="border-b border-white/10 pb-12">
                  <h2 className="text-base font-semibold leading-7 text-white">
                    Share a document
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-gray-400">
                    After you upload the document, a shareable link will be
                    generated and copied to your clipboard.
                  </p>

                  <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                    <div className="col-span-full">
                      <label className="block text-sm font-medium leading-6 text-white">
                        Upload a document
                      </label>
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer font-semibold text-white hover:text-gray-400 hover:bg-gray-900 block group"
                      >
                        <div className="mt-2 flex justify-center rounded-lg border border-dashed border-white/25 px-6 py-10">
                          {currentFile ? (
                            <div
                              className="absolute inset-0 opacity-10 pointer-events-none group-hover:opacity-5 transition-opacity"
                              style={{
                                backgroundImage: `url(${imageBlobUrl})`,
                                backgroundPosition: "center",
                                backgroundSize: "cover",
                              }}
                            />
                          ) : null}
                          <div className="text-center">
                            {currentFile ? (
                              <div>
                                <img
                                  className="h-12 w-12 mx-auto"
                                  src={imageBlobUrl}
                                  alt={currentFile.name}
                                />
                              </div>
                            ) : (
                              <ArrowUpTrayIcon
                                className="mx-auto h-12 w-12 text-gray-500"
                                aria-hidden="true"
                              />
                            )}

                            <div className="mt-4 flex text-sm leading-6 text-gray-400">
                              <span className="mx-auto">
                                {currentFile
                                  ? currentFile.name
                                  : "Choose file to upload"}
                              </span>

                              {/* <p className="pl-1">or drag and drop</p> */}
                            </div>
                            <p className="text-xs leading-5 text-gray-400">
                              {currentFile
                                ? "Replace file?"
                                : ".pdf, .docx, .pptx, image files and more"}
                            </p>
                          </div>
                        </div>
                      </label>
                      <input
                        id="file-upload"
                        name="file"
                        type="file"
                        className="sr-only"
                        required
                        onChange={(e) =>
                          setCurrentFile(e.target.files?.[0] || null)
                        }
                      />
                    </div>

                    <div className="col-span-full">
                      <label
                        htmlFor="about"
                        className="block text-sm font-medium leading-6 text-white"
                      >
                        Description
                      </label>
                      <div className="mt-2">
                        <textarea
                          id="about"
                          name="description"
                          rows={1}
                          className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                          defaultValue={""}
                          placeholder="Acme Presentation"
                        />
                      </div>
                      <p className="mt-3 text-sm leading-6 text-gray-400">
                        This description will help you find your document later.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-center w-full">
                <button
                  type="submit"
                  className="rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                  disabled={uploading}
                >
                  {uploading ? "Uploading..." : "Create a link"}
                </button>
              </div>
            </form>
          </main>
          {/* End: Main content */}
        </Sidebar>
      </div>
    </>
  );
}

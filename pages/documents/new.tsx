import { PhotoIcon, UserCircleIcon } from "@heroicons/react/20/solid";
import Sidebar from "@/components/Sidebar";
import { useState, useMemo } from "react";
import { useRouter } from "next/router";
import type { PutBlobResult } from "@vercel/blob";
import toast from "react-hot-toast";
import Notification from "@/components/Notification";

export default function Form() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  const imageBlobUrl = useMemo(
    () => (currentFile ? URL.createObjectURL(currentFile) : ""),
    [currentFile]
  );

  const handleSubmit = async (event) => {
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

      console.log("Blob uploaded successfully!", blob);

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

      const { document, linkId } = await response.json();

      console.log("Document created successfully!", document);

      navigator.clipboard.writeText(
        `${process.env.NEXT_PUBLIC_BASE_URL}/view/${linkId}`
      );

      toast.custom((t) => (
        <Notification t={t} closeToast={() => toast.dismiss(t.id)} />
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
                    This information will be displayed publicly so be careful
                    what you share.
                  </p>

                  <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                    <div className="col-span-full">
                      <label
                        htmlFor="cover-photo"
                        className="block text-sm font-medium leading-6 text-white"
                      >
                        Upload a document
                      </label>
                      <div className="mt-2 flex justify-center rounded-lg border border-dashed border-white/25 px-6 py-10">
                        <div className="text-center">
                          {currentFile && (
                            <div>
                              <img
                                className="h-12 w-12 mx-auto"
                                src={imageBlobUrl}
                                alt="File preview"
                              />
                            </div>
                          )}
                          <PhotoIcon
                            className="mx-auto h-12 w-12 text-gray-500"
                            aria-hidden="true"
                          />
                          <div className="mt-4 flex text-sm leading-6 text-gray-400">
                            <label
                              htmlFor="file-upload"
                              className="relative cursor-pointer rounded-md bg-gray-900 font-semibold text-white focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 focus-within:ring-offset-gray-900 hover:text-indigo-500"
                            >
                              <span>Upload a file</span>
                              <input
                                id="file-upload"
                                name="file"
                                type="file"
                                className="sr-only"
                                onChange={(e) =>
                                  setCurrentFile(e.target.files?.[0] || null)
                                }
                              />
                            </label>
                            {/* <p className="pl-1">or drag and drop</p> */}
                          </div>
                          <p className="text-xs leading-5 text-gray-400">
                            PDF, DOCX, PPTX and more up to 4MB
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* <div className="sm:col-span-4">
                      <label
                        htmlFor="linkname"
                        className="block text-sm font-medium leading-6 text-white"
                      >
                        Pick a Link
                      </label>
                      <div className="mt-2">
                        <div className="flex rounded-md bg-white/5 ring-1 ring-inset ring-white/10 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500">
                          <span className="flex select-none items-center pl-3 text-gray-500 sm:text-sm">
                            papermark.io/view/
                          </span>
                          <input
                            type="text"
                            name="name"
                            id="linkname"
                            autoComplete="linkname"
                            className="flex-1 border-0 bg-transparent py-1.5 pl-1 text-white focus:ring-0 sm:text-sm sm:leading-6"
                            placeholder="acme-presentation"
                          />
                        </div>
                      </div>
                    </div> */}

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
                        This is description will help you find your document
                        later.
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

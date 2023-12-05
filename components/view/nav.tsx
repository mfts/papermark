import Link from "next/link";
import { useRouter } from "next/router";
import { Button } from "../ui/button";
import PapermarkSparkle from "../shared/icons/papermark-sparkle";
import { Download } from "lucide-react";

export default function Nav({
  pageNumber,
  numPages,
  allowDownload,
  assistantEnabled,
  file,
}: {
  pageNumber: number;
  numPages: number;
  allowDownload?: boolean;
  assistantEnabled?: boolean;
  file?: { name: string; url: string };
}) {
  const router = useRouter();
  const { linkId } = router.query as { linkId: string };

  async function downloadFile(e: React.MouseEvent<HTMLButtonElement>) {
    if (!allowDownload || !file) return;
    try {
      //get file data
      const response = await fetch(file.url);
      const fileData = await response.blob();

      //create <a/> to download the file
      const a = document.createElement("a");
      a.href = window.URL.createObjectURL(fileData);
      a.download = file.name;
      document.body.appendChild(a);
      a.click();

      //clean up used resources
      document.body.removeChild(a);
      window.URL.revokeObjectURL(a.href);
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  }

  return (
    <nav className="bg-black">
      <div className="mx-auto px-2 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          <div className="flex flex-1 items-stretch justify-start">
            <div className="flex flex-shrink-0 items-center">
              <p className="text-2xl font-bold tracking-tighter text-white">
                Papermark
              </p>
            </div>
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0 space-x-2">
            {assistantEnabled ? (
              <Link href={`/view/${linkId}/chat`}>
                <Button
                  className="group space-x-1 bg-gradient-to-r from-[#16222A] via-emerald-500 to-[#16222A] duration-200 ease-linear hover:bg-right"
                  variant={"special"}
                  style={{
                    backgroundSize: "200% auto",
                  }}
                >
                  <PapermarkSparkle className="h-5 w-5 animate-pulse group-hover:animate-none" />{" "}
                  <span>AI Assistant</span>
                </Button>
              </Link>
            ) : null}
            {allowDownload ? (
              <div className="bg-gray-900 text-white rounded-md px-2 py-1 text-sm  m-1">
                <Button onClick={downloadFile} size="icon">
                  <Download className="w-6 h-6" />
                </Button>
              </div>
            ) : null}
            <div className="bg-gray-900 text-white rounded-md h-10 px-4 py-2 items-center flex text-sm font-medium">
              <span>{pageNumber}</span>
              <span className="text-gray-400"> / {numPages}</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

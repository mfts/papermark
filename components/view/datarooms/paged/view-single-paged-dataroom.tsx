
import { Button } from "@/components/ui/button";
import { DataroomWithFiles } from "@/lib/types";

export default function ViewSinglePagedDataroom({
  dataroom
}: {
  dataroom: DataroomWithFiles,
}) {
  const files = dataroom.files;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="flex-grow text-center my-8">
    
          <img
            src="/favicon.ico"
            alt="Dataroom Logo"
            className="mb-4 mx-auto max-w-full"
            style={{ maxWidth: '150px' }} // Set a maximum width for the logo
          />
      
        <h2 className="text-2xl font-bold mb-4">{dataroom.name}</h2>
        <p className="text-gray-600 mb-4">{dataroom.description || ""}</p>
        <div className="flex flex-col justify-center mt-12">
          {files.map((files, index) => (
            <a key={index} href={files.url} target="_blank" rel="noopener noreferrer" className="mb-2">
              <Button className="w-96 text-black font-bold py-2 px-4 rounded m-2">
                {files.name}
              </Button>
            </a>
          ))}
        </div>
      </div>
      <footer className="mt-auto text-gray-500">
        <p>&copy; {new Date().getFullYear()} {'papermark.io'}</p>
      </footer>
    </div>
  )
}
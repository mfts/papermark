import Image from "next/image";
import michaelImg from "public/_static/michael.png";

export default function Example() {
  return (
    <div className="bg-white">
      <div className="relative isolate px-6  lg:px-8">
        <div className="mx-auto max-w-2xl pt-24 sm:pt-32 lg:pt-48">
          <div className="hidden sm:mb-8 sm:flex sm:justify-center">
            <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-gray-600 ring-1 ring-gray-900/10 hover:ring-gray-900/20">
              4-8 Dec |{" "}
              <span className="font-semibold text-black">
                things will get busy
              </span>
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Papermark Launch Week
            </h1>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <a
                href="https://x.com/papermarkio"
                target="_blank"
                className="rounded-md bg-black px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Follow live updates
              </a>
            </div>
            <div className="mt-10 mx-auto w-full max-w-xs">
              <Image
                src={michaelImg}
                alt="Description of Image"
                className="mx-auto w-48 h-auto object-cover rounded-md "
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

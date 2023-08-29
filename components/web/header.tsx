import Link from "next/link";
import GitHubIcon from "@/components/shared/icons/github";

export default function Header() {
  return (
    <div className="relative bg-white">
      <div className="mx-auto max-w-7xl lg:grid lg:grid-cols-12 lg:gap-x-8 lg:px-8">
        <div className="px-6 pb-24 pt-10 sm:pb-32 lg:col-span-7 lg:px-0 lg:pb-56 lg:pt-48 xl:col-span-6">
          <div className="mx-auto max-w-2xl lg:mx-0">
            <div className="hidden sm:mt-32 sm:flex lg:mt-16"></div>
            <h1 className="mt-24 text-4xl font-bold tracking-tight text-gray-900 sm:mt-10 sm:text-5xl">
              Papermark will make your deck stand out
            </h1>
            <p className="mt-2 text-lg leading-8 text-gray-600">
              The Open-Source Docsend Alternative
            </p>
            <div className="mt-10 flex items-center gap-x-6">
              <Link
                className="rounded-md bg-black px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
                href={"/login"}
              >
                Get started
              </Link>
              <Link
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md  px-3.5 py-2.5 text-sm font-semibold text-black hover:text-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 flex items-center"
                href="https://github.com/mfts/papermark"
              >
                <GitHubIcon className="mr-2 h-5 w-5" /> Star on Github
              </Link>
            </div>
          </div>
          <div className="relative md:col-span-5 lg:-mr-8 xl:absolute xl:inset-0 xl:left-1/2 xl:mr-0 mt-6   ">
            <img
              className="aspect-[3/2] w-full  object-contain lg:absolute lg:inset-0 lg:aspect-auto lg:h-full lg:w-3/4"
              src="https://www.papermark.io/_static/image3.png"
              alt=""
            />
          </div>
        </div>
      </div>
    </div>
  );
}

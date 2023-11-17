import Link from "next/link";
import GitHubIcon from "@/components/shared/icons/github";

export default function Header() {
  return (
    <div className="relative bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Flex container with direction changing based on screen size */}
        <div className="flex flex-col lg:items-center lg:flex-row lg:gap-x-8">
          {/* Text container */}
          <div className="pb-4 pt-10 lg:pb-56 lg:pt-48 lg:flex-1">
            <div className="mx-auto max-w-2xl">
              <div className="mt-24 sm:mt-10">
                <a
                  target="_blank"
                  href="https://www.producthunt.com/posts/papermark-3?utm_source=badge-top-post-badge&amp;utm_medium=badge&amp;utm_souce=badge-papermark"
                >
                  <img
                    src="https://api.producthunt.com/widgets/embed-image/v1/top-post-badge.svg?post_id=411605&amp;theme=light&amp;period=daily"
                    alt="Papermark - The open-source DocSend alternative | Product Hunt"
                    className="w-[250px] h-[54px]"
                  />
                </a>
              </div>
              <h1 className="mt-10 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                Founder friendly document sharing platform
              </h1>
              <p className="mt-2 text-lg leading-8 text-gray-600">
                The Open-Source Docsend Alternative to securely share pitch deck
                and other docs with real-time analytics.
              </p>
              <div className="mt-10 flex items-center gap-x-6">
                <Link
                  className="rounded-md bg-black px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:shadow-md hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
                  href={"/login"}
                >
                  Get started
                </Link>
                <Link
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md px-3.5 py-2.5 text-sm font-semibold text-black hover:shadow-md hover:text-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 flex items-center"
                  href="https://github.com/mfts/papermark"
                >
                  <GitHubIcon className="mr-2 h-5 w-5" /> Star on GitHub
                </Link>
              </div>
            </div>
          </div>
          <div className="hidden lg:flex lg:mt-0 lg:flex-1">
            <img
              className="aspect-[3/2] w-full object-contain"
              src="https://www.papermark.io/_static/image3.png"
              alt=""
            />
          </div>
        </div>
      </div>
    </div>
  );
}

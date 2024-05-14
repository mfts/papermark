import Link from "next/link";

import GitHubIcon from "@/components/shared/icons/github";

export default function Section2() {
  return (
    <div className="bg-white">
      <div className="px-6 py-12 sm:px-6 sm:py-12 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Build strong relationships with investors
            <br />
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-600">
            By sending presentations via Papermark
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              href="/login"
              className="rounded-md bg-black px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Start now
            </Link>
            <Link
              target="_blank"
              rel="noopener noreferrer"
              className="flex  items-center rounded-md px-3.5 py-2.5 text-sm font-semibold text-black hover:text-gray-800 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
              href="https://github.com/mfts/papermark"
            >
              <GitHubIcon className="mr-2 h-5 w-5" /> Star on GitHub
            </Link>
          </div>
          {/* Image added below */}
          <div className="mx-auto mt-10 w-full max-w-md">
            <img
              src="https://www.papermark.io/_static/image2.png"
              alt="Description of Image"
              className="mx-auto h-auto w-full rounded-md object-cover "
            />
          </div>
        </div>
      </div>
    </div>
  );
}

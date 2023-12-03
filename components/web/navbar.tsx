import Link from "next/link";
import GitHubIcon from "@/components/shared/icons/github";

function classNames(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}

export default function Navbar() {
  return (
    <>
      <nav className=" fixed top-0 w-full z-50 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
          <div className="relative flex h-16 justify-between">
            <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
              {/* Mobile menu button */}
            </div>
            <div className="flex flex-1 items-stretch justify-start">
              <div className="flex flex-shrink-0 items-center">
                <Link href="/">
                  <span className="text-xl font-bold tracking-tighter text-black">
                    Papermark
                  </span>
                </Link>
              </div>
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
              <Link
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md  px-3.5 py-2.5 text-sm font-semibold text-black hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 flex items-center"
                href="https://github.com/mfts/papermark"
              >
                <GitHubIcon className="mr-2 h-5 w-5" /> GitHub
              </Link>
              <Link
                className="rounded-md bg-black px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
                href="/login"
              >
                Send Deck
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}


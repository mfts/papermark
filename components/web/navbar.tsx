import Image from "next/image";
import Link from "next/link";

import PapermarkLogo from "@/public/_static/papermark-logo.svg";

import GitHubIcon from "@/components/shared/icons/github";

export default function Navbar() {
  return (
    <>
      <div className="sticky top-0 z-50">
        <div className="mx-auto flex h-14 w-full items-center justify-center bg-white/75 backdrop-blur-lg">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between self-center px-4 md:px-8">
            <div className="flex items-center space-x-10">
              <Link
                aria-label="Return home"
                className="flex h-full flex-none items-center rounded-md text-black ring-0"
                href="/"
              >
                <div className="flex items-center space-x-2">
                  <Image
                    src={PapermarkLogo}
                    width={119}
                    height={32}
                    alt="Papermark Logo"
                  />
                </div>
              </Link>
              <div className="hidden items-center gap-2 md:flex">
                <Link
                  className="group inline-flex h-10 w-max items-center justify-center rounded-md px-2.5 py-1 font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
                  href="/data-room"
                >
                  <span className="relative z-[2] flex items-center gap-1">
                    <span>Data Room</span>
                  </span>
                </Link>
                <Link
                  className="group inline-flex h-10 w-max items-center justify-center rounded-md px-2.5 py-1 font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
                  href="/pricing"
                >
                  <span className="relative z-[2] flex items-center gap-1">
                    <span>Pricing</span>
                  </span>
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-2 justify-self-end">
              <Link
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex h-10 w-max items-center justify-center rounded-md px-2.5 py-1 font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
                href="https://github.com/mfts/papermark"
              >
                <GitHubIcon className="mr-2 h-6 w-6" /> 2.6k
              </Link>
              <Link
                className="group inline-flex h-10 w-max items-center justify-center rounded-md px-2.5 py-1 font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
                href="/login"
              >
                <span className="relative z-[2] flex items-center gap-1">
                  <span>Log in</span>
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

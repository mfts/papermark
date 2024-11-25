import Link from "next/link";

import NotFound from "@/pages/404";

import { Button } from "@/components/ui/button";

import { generateChecksum } from "@/lib/utils/generate-checksum";

export default function VerifyPage({
  searchParams,
}: {
  searchParams: { verification_url?: string; checksum?: string };
}) {
  const { verification_url, checksum } = searchParams;

  if (!verification_url || !checksum) {
    return <NotFound />;
  }

  // Server-side validation
  const isValidVerificationUrl = (url: string, checksum: string): boolean => {
    try {
      const urlObj = new URL(url);
      if (urlObj.origin !== process.env.NEXTAUTH_URL) return false;
      const expectedChecksum = generateChecksum(url);
      return checksum === expectedChecksum;
    } catch {
      return false;
    }
  };

  if (!isValidVerificationUrl(verification_url, checksum)) {
    return <NotFound />;
  }

  return (
    <div className="flex h-screen w-full flex-wrap">
      {/* Left part */}
      <div className="flex w-full justify-center bg-white md:w-1/2 lg:w-2/5">
        <div
          className="absolute inset-x-0 top-10 -z-10 flex transform-gpu justify-center overflow-hidden blur-3xl"
          aria-hidden="true"
        ></div>
        <div className="z-10 mx-5 mt-[calc(20vh)] h-fit w-full max-w-md overflow-hidden rounded-lg sm:mx-0">
          <div className="flex flex-col items-center justify-center space-y-3 px-4 py-6 pt-8 text-center sm:px-16">
            <Link href="/">
              <span className="text-balance text-2xl font-semibold text-gray-800">
                Welcome to Papermark
              </span>
            </Link>
            <h3 className="text-balance text-sm text-gray-800">
              Share documents. Not attachments.
            </h3>
          </div>
          <div className="flex flex-col gap-4 px-4 pt-8 sm:px-16">
            <div className="relative">
              <Link href={verification_url}>
                <Button className="focus:shadow-outline w-full transform rounded bg-gray-800 px-4 py-2 text-white transition-colors duration-300 ease-in-out hover:bg-gray-900 focus:outline-none">
                  Verify login
                </Button>
              </Link>
            </div>
          </div>
          <p className="mt-10 w-full max-w-md px-4 text-xs text-muted-foreground sm:px-16">
            By clicking continue, you acknowledge that you have read and agree
            to Papermark&apos;s{" "}
            <a
              href="https://www.papermark.io/terms"
              target="_blank"
              className="underline"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="https://www.papermark.io/privacy"
              target="_blank"
              className="underline"
            >
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
      <div className="hidden w-full justify-center bg-gray-800 md:flex md:w-1/2 lg:w-3/5">
        <div className="flex w-full max-w-5xl px-4 py-20 md:px-8">
          <div
            className="mx-auto flex w-full max-w-5xl justify-center rounded-3xl bg-gray-800 px-4 py-20 md:px-8"
            id="features"
          >
            <div className="flex flex-col items-center">
              {/* Image container */}
              <div className="mb-4 h-64 w-64">
                <img
                  className="h-full w-full rounded-2xl object-cover shadow-2xl"
                  src="/_static/testimonials/jaski.jpeg"
                  alt="Jaski"
                />
              </div>
              {/* Text content */}
              <div className="max-w-xl text-center">
                <blockquote className="text-l text-balance leading-8 text-gray-100 sm:text-xl sm:leading-9">
                  <p>
                    True builders listen to their users and build what they
                    need. Thanks Papermark team for solving a big pain point.
                    DocSend monopoly will end soon!
                  </p>
                </blockquote>
                <figcaption className="mt-4">
                  <div className="text-balance font-semibold text-white">
                    Jaski
                  </div>
                  <div className="text-balance text-gray-400">
                    Founder, Townhall Network
                  </div>
                </figcaption>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

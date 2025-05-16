import { Metadata } from "next";
import Link from "next/link";

import NotFound from "@/pages/404";

import { generateChecksum } from "@/lib/utils/generate-checksum";

import { LogoCloud } from "@/components/shared/logo-cloud";
import { Button } from "@/components/ui/button";

const data = {
  description: "Verify login to Papermark",
  title: "Verify | Papermark",
  url: "/verify",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.papermark.com"),
  title: data.title,
  description: data.description,
  openGraph: {
    title: data.title,
    description: data.description,
    url: data.url,
    siteName: "Papermark",
    images: [
      {
        url: "/_static/meta-image.png",
        width: 800,
        height: 600,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: data.title,
    description: data.description,
    creator: "@papermarkio",
    images: ["/_static/meta-image.png"],
  },
};

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
      <div className="flex w-full justify-center bg-gray-50 md:w-1/2 lg:w-1/2">
        <div
          className="absolute inset-x-0 top-10 -z-10 flex transform-gpu justify-center overflow-hidden blur-3xl"
          aria-hidden="true"
        ></div>
        <div className="z-10 mx-5 mt-[calc(1vh)] h-fit w-full max-w-md overflow-hidden rounded-lg sm:mx-0 sm:mt-[calc(2vh)] md:mt-[calc(3vh)]">
          <div className="items-left flex flex-col space-y-3 px-4 py-6 pt-8 sm:px-12">
            <img
              src="/_static/papermark-logo.svg"
              alt="Papermark Logo"
              className="-mt-8 mb-36 h-7 w-auto self-start sm:mb-32 md:mb-48"
            />
            <Link href="/">
              <span className="text-balance text-3xl font-semibold text-gray-900">
                Verify your login
              </span>
            </Link>
            <h3 className="text-balance text-sm text-gray-800">
              Share documents. Not attachments.
            </h3>
          </div>
          <div className="flex flex-col gap-4 px-4 pt-8 sm:px-12">
            <div className="relative">
              <Link href={verification_url}>
                <Button className="focus:shadow-outline w-full transform rounded bg-gray-800 px-4 py-2 text-white transition-colors duration-300 ease-in-out hover:bg-gray-900 focus:outline-none">
                  Verify email
                </Button>
              </Link>
            </div>
          </div>
          <p className="mt-10 w-full max-w-md px-4 text-xs text-muted-foreground sm:px-12">
            By clicking continue, you acknowledge that you have read and agree
            to Papermark&apos;s{" "}
            <a
              href={`${process.env.NEXT_PUBLIC_MARKETING_URL}/terms`}
              target="_blank"
              className="underline"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href={`${process.env.NEXT_PUBLIC_MARKETING_URL}/privacy`}
              target="_blank"
              className="underline"
            >
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
      <div className="relative hidden w-full justify-center overflow-hidden bg-black md:flex md:w-1/2 lg:w-1/2">
        <div className="relative m-0 flex h-full min-h-[700px] w-full p-0">
          <div
            className="relative flex h-full w-full flex-col justify-between"
            id="features"
          >
            {/* Testimonial top 2/3 */}
            <div
              className="flex w-full flex-col items-center justify-center"
              style={{ height: "66.6666%" }}
            >
              {/* Image container */}
              <div className="mb-4 h-64 w-80">
                <img
                  className="h-full w-full rounded-2xl object-cover shadow-2xl"
                  src="/_static/testimonials/backtrace.jpeg"
                  alt="Backtrace Capital"
                />
              </div>
              {/* Text content */}
              <div className="max-w-xl text-center">
                <blockquote className="text-balance font-normal leading-8 text-white sm:text-xl sm:leading-9">
                  <p>
                    &quot;We raised our €30M Fund with Papermark Data Rooms.
                    Love the customization, security and ease of use.&quot;
                  </p>
                </blockquote>
                <figcaption className="mt-4">
                  <div className="text-balance font-normal text-white">
                    Michael Münnix
                  </div>
                  <div className="text-balance font-light text-gray-400">
                    Partner, Backtrace Capital
                  </div>
                </figcaption>
              </div>
            </div>
            {/* White block with logos bottom 1/3, full width/height */}
            <div
              className="absolute bottom-0 left-0 flex w-full flex-col items-center justify-center bg-white"
              style={{ height: "33.3333%" }}
            >
              <div className="mb-4 max-w-xl text-balance text-center font-semibold text-gray-900">
                Trusted by teams at
              </div>
              <LogoCloud />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

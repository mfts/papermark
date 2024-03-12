import Head from "next/head";
import Footer from "@/components/web/footer";
import { cn } from "@/lib/utils";
import FAQ from "@/components/web/faq";
import Testimonial from "@/components/web/testimonials";
import { GetStaticProps, GetStaticPropsContext } from "next";
import { CheckIcon, XIcon } from "lucide-react";

import {
  Plus as PlusSmallIcon,
  Minus as MinusSmallIcon,
  RefreshCw as ArrowPathIcon,
  GitPullRequestArrow as CloudArrowUpIcon,
  Settings as Cog6ToothIcon,
  Fingerprint as FingerPrintIcon,
  Lock as LockClosedIcon,
  HardDrive as ServerIcon,
} from "lucide-react";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/web/navbar";
import Testimonials from "@/components/web/testimonials";
import prisma from "@/lib/prisma";
import { Page } from "@prisma/client";

// This function is for static generation, adjust if you prefer server-side generation
export async function getStaticPaths() {
  const pages = await prisma.page.findMany({
    select: { slug: true },
  });
  const paths = pages.map((page) => ({
    params: { slug: page.slug },
  }));

  return { paths, fallback: false };
}

export async function getStaticProps({ params }: GetStaticPropsContext) {
  const { slug } = params as { slug: string };
  const page = await prisma.page.findUnique({
    where: { slug: slug },
  });

  if (!page) {
    return { notFound: true };
  }

  const serializablePage = {
    ...page,
    createdAt: page.createdAt.toISOString(),
    updatedAt: page.updatedAt.toISOString(),
  };

  return { props: { page: serializablePage } };
}

export default function PagePage({ page }: { pages: Page }) {
  return (
    <>
      <div>
        <Head>
          <Head>
            <title>{page.metatitle}</title>
            <meta name="description" content={page.metadescription!} />

            <meta property="og:type" content="website" />
            <meta property="og:title" content={page.metadescription!} />
            <meta property="og:description" content={page.metadescription!} />
            <meta
              property="og:image"
              content="https://www.papermark.io/_static/meta-image.png"
            />
            <meta property="og:url" content="https://www.papermark.io" />
            <meta name="twitter:card" content="summary_large_image" />
          </Head>
        </Head>

        {/* Hero section */}
        <div className="flex flex-1 flex-col bg-white text-black justify-center">
          <Navbar />
          <div className="max-w-5xl w-full mx-auto px-4 md:px-8 text-center">
            <div className="pt-32">
              {/* <div className=" pb-4">
                <img
                  src={page.imageUrl}
                  alt="App screenshot"
                  className="mx-auto"
                  width={150}
                  height={50}
                />
              </div> */}
              <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-black ring-black/10  hover:ring-white/20 text-balance">
                Use first Linkedin management platform
              </div>
              <h1 className="text-6xl text-balance">{page.title}</h1>
              <p className="text-xl mt-8 text-balance max-w-3xl  text-balance mx-auto md:text-2xl">
                {page.description}
              </p>
              <div className="pt-8 space-x-2">
                <Link href="/login">
                  <Button className="text-white bg-blue-800 rounded-3xl hover:bg-gray-500 justify-center text-balance">
                    {page.button}
                  </Button>
                </Link>
              </div>
            </div>
            <div className="mt-24 mx-auto w-full">
              <video
                width="100%"
                id="video1"
                style={{ borderRadius: "6px" }}
                aria-hidden="true"
                playsInline
                autoPlay
                muted
                loop
                controls
              >
                <source src={page.imageUrl} type="video/mp4" />
              </video>
            </div>
          </div>

          <div className="overflow-hidden bg-white py-24 sm:py-32">
            <div className="mx-auto max-w-7xl md:px-6 lg:px-8">
              <div className="grid grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:grid-cols-2 lg:items-start">
                <div className="px-6 lg:px-0 lg:pr-4 lg:pt-4">
                  <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-lg">
                    <h2 className="mt-2 text-3xl text-gray-900 sm:text-4xl text-balance">
                      {page.subtitle1}
                    </h2>
                    <p className="mt-6 text-lg leading-8 text-gray-600 text-balance">
                      {page.description1}
                    </p>
                  </div>
                </div>
                <div className="sm:px-6 lg:px-0">
                  <div className="relative isolate overflow-hidden bg-orange-500 px-6 pt-8 sm:mx-auto sm:max-w-2xl sm:rounded-3xl sm:pl-16 sm:pr-0 sm:pt-16 lg:mx-0 lg:max-w-none">
                    <div
                      className="absolute -inset-y-px -left-3 -z-10 w-full origin-bottom-left skew-x-[-30deg] bg-orange-200 opacity-20 ring-1 ring-inset ring-white"
                      aria-hidden="true"
                    />
                    <div className="mx-auto max-w-2xl sm:mx-0 sm:max-w-none">
                      <img
                        src={page.image1}
                        alt="Product screenshot"
                        width={2432}
                        height={1442}
                        className="-mb-12 w-[57rem] max-w-none rounded-tl-xl bg-gray-800 ring-1 ring-white/10"
                      />
                    </div>
                    <div
                      className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/10 sm:rounded-3xl"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden bg-white py-24 sm:py-32">
            <div className="mx-auto max-w-7xl md:px-6 lg:px-8">
              <div className="grid grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:grid-cols-2 lg:items-start">
                <div className="sm:px-6 lg:px-0">
                  <div className="relative isolate overflow-hidden bg-orange-500 px-6 pt-8 sm:mx-auto sm:max-w-2xl sm:rounded-3xl sm:pl-16 sm:pr-0 sm:pt-16 lg:mx-0 lg:max-w-none">
                    <div
                      className="absolute -inset-y-px -left-3 -z-10 w-full origin-bottom-left skew-x-[-30deg] bg-orange-200 opacity-20 ring-1 ring-inset ring-white"
                      aria-hidden="true"
                    />
                    <div className="mx-auto max-w-2xl sm:mx-0 sm:max-w-none">
                      <img
                        src={page.image2}
                        alt="Product screenshot"
                        width={2432}
                        height={1442}
                        className="-mb-12 w-[57rem] max-w-none rounded-tl-xl bg-gray-800 ring-1 ring-white/10"
                      />
                    </div>
                    <div
                      className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/10 sm:rounded-3xl"
                      aria-hidden="true"
                    />
                  </div>
                </div>
                <div className="px-6 lg:px-0 lg:pr-4 lg:pt-4">
                  <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-lg">
                    <h2 className="mt-2 text-3xl text-gray-900 sm:text-4xl text-balance">
                      {page.subtitle2}
                    </h2>
                    <p className="mt-6 text-lg leading-8 text-gray-600 text-balance">
                      {page.description2}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Testimonial section */}
          <Testimonials />

          {/* CTA */}
          <div className="bg-[#fb7a00]">
            <div className="w-full mx-auto max-w-5xl py-32 px-4 md:px-8">
              <h2 className="text-4xl text-balance  ">{page.cta}</h2>

              <div className="pt-8 space-x-2">
                <Link href="/login">
                  <Button className="text-balance rounded-3xl">
                    Start for free
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div>
        <Footer />
      </div>
    </>
  );
}

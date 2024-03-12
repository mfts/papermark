import Head from "next/head";
import Footer from "@/components/web/footer";
import { cn } from "@/lib/utils";
import Features from "@/components/web/alternatives/features";
import FAQ from "@/components/web/faq";
import Testimonial from "@/components/web/testimonials";
import { GetStaticProps, GetStaticPropsContext } from "next";
import { CheckIcon, XIcon } from "lucide-react";
import Navbar from "@/components/web/navbar";

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
import Testimonials from "@/components/web/testimonials";
import prisma from "@/lib/prisma";
import { Alternative } from "@prisma/client";

// This function is for static generation, adjust if you prefer server-side generation
export async function getStaticPaths() {
  const alternatives = await prisma.alternative.findMany({
    select: { slug: true },
  });
  const paths = alternatives.map((alternative) => ({
    params: { slug: alternative.slug },
  }));

  return { paths, fallback: false };
}

export async function getStaticProps({ params }: GetStaticPropsContext) {
  const { slug } = params as { slug: string };
  const alternative = await prisma.alternative.findUnique({
    where: { slug: slug },
  });

  if (!alternative) {
    return { notFound: true };
  }

  const serializableAlternative = {
    ...alternative,
    createdAt: alternative.createdAt.toISOString(),
    updatedAt: alternative.updatedAt.toISOString(),
  };

  return { props: { alternative: serializableAlternative } };
}

export default function AlternativePage({
  alternative,
}: {
  alternative: Alternative;
}) {
  return (
    <>
      <div>
        <Head>
          <Head>
            <title>{alternative.metatitle}</title>
            <meta name="description" content={alternative.metadescription!} />

            <meta property="og:type" content="website" />
            <meta property="og:title" content={alternative.metadescription!} />
            <meta
              property="og:description"
              content={alternative.metadescription!}
            />
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
                  src={alternative.imageUrl}
                  alt="App screenshot"
                  className="mx-auto"
                  width={150}
                  height={50}
                />
              </div> */}
              {/* <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-black ring-black/10  hover:ring-white/20">
                Free DocSend alternative
              </div> */}
              <h1 className="text-6xl text-balance">{alternative.title}</h1>
              <p className="text-xl mt-8 text-balance max-w-3xl  mx-auto md:text-2xl">
                {alternative.description}
              </p>
              <div className="pt-8 space-x-2">
                <Link href="/login">
                  <Button className="text-white bg-blue-800 rounded-3xl hover:bg-gray-500 justify-center">
                    Create Linkedin Post
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
                <source
                  src="https://dknlay9ljaq1f.cloudfront.net/short-video.mp4"
                  type="video/mp4"
                />
              </video>
            </div>
          </div>
          {/* Comparison section */}
          <div className="max-w-5xl w-full mx-auto px-4 md:px-8">
            <div className="pt-32 pb-2">
              <h2 className="text-5xl  text-balance">
                {alternative.subtitlecompare}
              </h2>
              <p className="text-xl mt-8 text-balance max-w-3xl">
                {alternative.descriptioncompare}
              </p>
            </div>
            <div className="bg-white py-16">
              <div className="mx-auto max-w-5xl ">
                <div className="grid grid-cols-1 md:grid-cols-2 border border-black rounded-xl overflow-hidden">
                  {/* Column 1 - Papermark */}
                  <div className="flex flex-col justify-between border-black border-r-0 md:odd:border-r xl:even:border-r xl:last:!border-r-0">
                    <div>
                      <div className="border-b border-black p-6 bg-gray-100">
                        <h3 className="text-xl leading-8 text-gray-800">
                          Papermark
                        </h3>
                      </div>
                      <div className="p-6">
                        <p className="mt-4 text-sm leading-6 text-gray-500">
                          Papermark plans start from freemium
                        </p>
                        <ul className="mt-8 space-y-3 text-sm leading-6 text-gray-500">
                          <li className="flex items-center gap-x-3">
                            <CheckIcon
                              className="h-6 w-6 text-green-500"
                              aria-hidden="true"
                            />
                            Open Source
                          </li>
                          {/* Add additional features here */}
                        </ul>
                      </div>
                    </div>
                    <Link
                      href="https://cal.com/marcseitz/papermark"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        variant="outline"
                        className="text-balance rounded-3xl bg-transparent border-black"
                      >
                        Start for free
                      </Button>
                    </Link>
                  </div>

                  {/* Column 2 - Docsend */}
                  <div className="flex flex-col justify-between">
                    <div>
                      <div className="border-b border-black p-6 bg-gray-100">
                        <h3 className="text-xl leading-8 text-gray-800">
                          {alternative.name}
                        </h3>
                      </div>
                      <div className="p-6">
                        <p className="mt-4 text-sm leading-6 text-gray-500">
                          {alternative.title}
                        </p>
                        <p className="mt-4 text-xl font-bold leading-6 text-gray-500">
                          {alternative.price}
                        </p>
                        <ul className="mt-8 space-y-3 text-sm leading-6 text-gray-500">
                          <li className="flex items-center gap-x-3">
                            <XIcon
                              className="h-6 w-6 text-red-500"
                              aria-hidden="true"
                            />
                            {alternative.feature1}
                          </li>
                          <li className="flex items-center gap-x-3">
                            <XIcon
                              className="h-6 w-6 text-red-500"
                              aria-hidden="true"
                            />
                            {alternative.feature2}
                          </li>
                          <li className="flex items-center gap-x-3">
                            <XIcon
                              className="h-6 w-6 text-red-500"
                              aria-hidden="true"
                            />
                            {alternative.feature3}
                          </li>
                          <li className="flex items-center gap-x-3">
                            <XIcon
                              className="h-6 w-6 text-red-500"
                              aria-hidden="true"
                            />
                            {alternative.feature4}
                          </li>
                          <li className="flex items-center gap-x-3">
                            <XIcon
                              className="h-6 w-6 text-red-500"
                              aria-hidden="true"
                            />
                            {alternative.feature5}
                          </li>
                          <li className="flex items-center gap-x-3">
                            <XIcon
                              className="h-6 w-6 text-red-500"
                              aria-hidden="true"
                            />
                            {alternative.feature6}
                          </li>
                          {/* Add additional features here */}
                        </ul>
                      </div>
                    </div>

                    <Link
                      href="https://cal.com/marcseitz/papermark"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        variant="outline"
                        className="text-balance rounded-3xl bg-transparent border-black"
                      >
                        Start with alterntive
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features*/}
          <div
            className="w-full mx-auto max-w-5xl px-4 md:px-8 py-20"
            id="features"
          >
            <h2 className="text-4xl text-balance pt-12 pb-20 max-w-3xl">
              {alternative.subtitlefeatures}
              <span className="text-gray-500">
                {alternative.descriptionfeatures}
              </span>
            </h2>
            <Features />
          </div>
          {/* Testimonial section */}
          <Testimonials />

          {/* FAQ section */}
          <div
            className="w-full mx-auto max-w-5xl px-4 md:px-8 py-32 "
            id="features"
          >
            <h2 className="text-4xl text-balance pt-6  max-w-3xl">
              FAQ{" "}
              <span className="text-gray-500">
                {alternative.descriptionfaq}
              </span>
            </h2>
            <FAQ />
          </div>

          {/* CTA */}
          <div className="bg-[#fb7a00]">
            <div className="w-full mx-auto max-w-5xl py-32 px-4 md:px-8">
              <h2 className="text-4xl text-balance  ">
                {alternative.subtitlecta}
              </h2>

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

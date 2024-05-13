import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CheckIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import Features from "@/components/web/alternatives/features";
import FAQ from "@/components/web/faq";
import Testimonials from "@/components/web/testimonials";

import { getAlternative, getAlternatives } from "@/lib/content/alternative";
import { constructMetadata } from "@/lib/utils";

export async function generateStaticParams() {
  const alternatives = await getAlternatives();
  return alternatives.map((alternative) => ({ slug: alternative.slug }));
}

export const generateMetadata = async ({
  params,
}: {
  params: {
    slug: string;
  };
}): Promise<Metadata> => {
  const alternative = (await getAlternatives()).find(
    (alternative) => alternative.slug === params.slug,
  );
  const { metatitle, metadescription } = alternative || {};

  return constructMetadata({
    title: metatitle ? `${metatitle} - Papermark` : undefined,
    description: metadescription ?? undefined,
  });
};

export default async function AlternativePage({
  params,
}: {
  params: { slug: string };
}) {
  const alternative = await getAlternative(params.slug);
  if (!alternative) return notFound();

  return (
    <div className="flex flex-1 flex-col justify-center bg-white text-black">
      <div className="mx-auto w-full max-w-5xl px-4 text-center md:px-8">
        <div className="pt-32">
          <div className=" pb-4">
            <img
              src={alternative.imageUrl!}
              alt="App screenshot"
              className="mx-auto"
              width={100}
              height={50}
            />
          </div>
          {/* <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-black ring-black/10  hover:ring-white/20">
            Free {alternative.name} alternative
          </div> */}
          <h1 className="text-balance text-6xl">{alternative.title}</h1>
          <p className="mx-auto mt-8 max-w-3xl text-balance  text-xl md:text-2xl">
            {alternative.description}
          </p>
          <div className="space-x-2 pt-8">
            <Link href="/login">
              <Button className="justify-center rounded-3xl bg-gray-900 text-white hover:bg-gray-500">
                Send Document
              </Button>
            </Link>
          </div>
        </div>
        <div className="mx-auto mt-24 w-full">
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
              src="https://assets.papermark.io/short-video.mp4"
              type="video/mp4"
            />
          </video>
        </div>
      </div>
      {/* Comparison section */}
      <div className="mx-auto w-full max-w-5xl px-4 md:px-8">
        <div className="pb-2 pt-32">
          <h2 className="text-balance  text-5xl">
            {alternative.subtitlecompare}
          </h2>
          <p className="mt-8 max-w-3xl text-balance text-xl">
            {alternative.descriptioncompare}
          </p>
        </div>
        <div className="bg-white py-16">
          <div className="mx-auto max-w-5xl ">
            <div className="isolate grid  grid-cols-1  overflow-hidden  rounded-xl border border-black md:grid-cols-2">
              {/* Column 1 - Papermark */}
              <div className="flex flex-col justify-between border-r-0 border-black md:odd:border-r xl:last:!border-r-0 xl:even:border-r">
                <div>
                  <div className="border-b border-black bg-gray-100 p-6">
                    <h3 className="text-balance text-xl leading-8 text-gray-800">
                      Papermark
                    </h3>
                  </div>
                  <div className="p-6">
                    <p className="mt-4 text-balance text-sm leading-6 text-gray-500">
                      Papermark plans start from freemium
                    </p>
                    <div className="flex flex-col justify-between"></div>

                    <p className="mt-4 text-balance text-2xl font-semibold leading-6 text-gray-900">
                      $0
                    </p>
                    <ul className="mt-8 space-y-3 text-sm leading-6 text-gray-500">
                      <li className="flex items-center gap-x-3">
                        <CheckIcon
                          className="h-6 w-6 text-green-500"
                          aria-hidden="true"
                        />
                        Open Source & Self-hosted
                      </li>
                      <li className="flex items-center gap-x-3">
                        <CheckIcon
                          className="h-6 w-6 text-green-500"
                          aria-hidden="true"
                        />
                        Analytics for each page
                      </li>
                      <li className="flex items-center gap-x-3">
                        <CheckIcon
                          className="h-6 w-6 text-green-500"
                          aria-hidden="true"
                        />
                        Custom branding
                      </li>
                      <li className="flex items-center gap-x-3">
                        <CheckIcon
                          className="h-6 w-6 text-green-500"
                          aria-hidden="true"
                        />
                        Custom domain
                      </li>
                      <li className="flex items-center gap-x-3">
                        <CheckIcon
                          className="h-6 w-6 text-green-500"
                          aria-hidden="true"
                        />
                        Team access
                      </li>
                      <li className="flex items-center gap-x-3">
                        <CheckIcon
                          className="h-6 w-6 text-green-500"
                          aria-hidden="true"
                        />
                        Data Room
                      </li>

                      {/* Add additional features here */}
                    </ul>
                  </div>
                </div>
                <Link
                  href="/login"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-6"
                >
                  <Button
                    variant="outline"
                    className="text-balance rounded-3xl bg-[#fb7a00] bg-transparent hover:bg-gray-500"
                  >
                    Start for free
                  </Button>
                </Link>
              </div>

              {/* Column 2 - Docsend */}
              <div className="flex flex-col justify-between">
                <div>
                  <div className="border-b border-black bg-gray-100 p-6">
                    <h3 className="text-xl leading-8 text-gray-800">
                      {alternative.name}
                    </h3>
                  </div>
                  <div className="p-6">
                    <p className="mt-4 text-sm leading-6 text-gray-500">
                      {`${alternative.name} feature description`}
                    </p>
                    <p className="mt-4 text-balance text-2xl font-semibold leading-6 text-gray-900">
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
                  href="/login"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-6"
                >
                  <Button
                    variant="outline"
                    className="text-balance rounded-3xl border-black bg-transparent"
                  >
                    {`Start with ${alternative.name} alternative`}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features*/}
      <div
        className="mx-auto w-full max-w-5xl px-4 py-20 md:px-8"
        id="features"
      >
        <h2 className="max-w-3xl text-balance pb-20 pt-12 text-4xl">
          {alternative.subtitlefeatures}{" "}
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
        className="mx-auto w-full max-w-5xl px-4 py-32 md:px-8"
        id="features"
      >
        <h2 className="max-w-3xl text-balance pt-6 text-4xl">
          FAQ{" "}
          <span className="text-gray-500">{alternative.descriptionfaq}</span>
        </h2>
        <FAQ />
      </div>

      {/* CTA */}
      <div className="bg-[#fb7a00]">
        <div className="mx-auto w-full max-w-5xl px-4 py-32 md:px-8">
          <h2 className="text-balance text-4xl">{alternative.subtitlecta}</h2>

          <div className="space-x-2 pt-8">
            <Link href="/login">
              <Button className="text-balance rounded-3xl">
                Start sending documents for free
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

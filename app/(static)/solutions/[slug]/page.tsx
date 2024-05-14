import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import Testimonials from "@/components/web/testimonials";

import { getPage, getPages } from "@/lib/content/page";
import { constructMetadata } from "@/lib/utils";

export async function generateStaticParams() {
  const pages = await getPages();
  return pages.map((page) => ({ slug: page.slug }));
}

export const generateMetadata = async ({
  params,
}: {
  params: {
    slug: string;
  };
}): Promise<Metadata> => {
  const page = (await getPages()).find((page) => page.slug === params.slug);
  const { metatitle, metadescription } = page || {};

  return constructMetadata({
    title: metatitle ? `${metatitle} - Papermark` : undefined,
    description: metadescription ?? undefined,
  });
};

export default async function PagePage({
  params,
}: {
  params: { slug: string };
}) {
  const page = await getPage(params.slug);
  if (!page) return notFound();

  return (
    <div className="flex flex-1 flex-col justify-center bg-white text-black">
      <div className="mx-auto w-full max-w-5xl px-4 text-center md:px-8">
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
          {/* <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-black ring-black/10  hover:ring-white/20 text-balance">
            Join 1000s happy users
          </div> */}
          <h1 className="text-balance text-6xl">{page.title}</h1>
          <p className="mx-auto mt-8 max-w-3xl text-balance text-xl md:text-2xl">
            {page.description}
          </p>
          <div className="space-x-2 pt-8">
            <Link href="/login">
              <Button className="justify-center text-balance rounded-3xl bg-gray-900 text-white hover:bg-gray-800">
                {page.button}
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

      <div className="overflow-hidden bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl md:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:grid-cols-2 lg:items-start">
            <div className="px-6 lg:px-0 lg:pr-4 lg:pt-4">
              <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-lg">
                <h2 className="mt-2 text-balance text-3xl text-gray-900 sm:text-4xl">
                  {page.subtitle1}
                </h2>
                <p className="mt-6 text-balance text-lg leading-8 text-gray-600">
                  {page.description1}
                </p>
              </div>
              <div className="space-x-2 pt-8">
                <Link href="/login">
                  <Button className="justify-center text-balance rounded-3xl bg-gray-900 text-white hover:bg-gray-800">
                    {page.button}
                  </Button>
                </Link>
              </div>
            </div>
            <div className="sm:px-6 lg:px-0">
              <div className="relative isolate overflow-hidden bg-gray-900 px-6 pt-8 sm:mx-auto sm:max-w-2xl sm:rounded-3xl sm:pl-16 sm:pr-0 sm:pt-16 lg:mx-0 lg:max-w-none">
                <div
                  className="absolute -inset-y-px -left-3 -z-10 w-full origin-bottom-left skew-x-[-30deg] bg-orange-200 opacity-20 ring-1 ring-inset ring-white"
                  aria-hidden="true"
                />
                <div className="mx-auto max-w-2xl sm:mx-0 sm:max-w-none">
                  <img
                    src={
                      page.image1 ??
                      "https://aicontentfy-customer-images.s3.eu-central-1.amazonaws.com/a0ebbbe4-55f2-4f4a-b7f8-f251d3880386.png"
                    }
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
              <div className="relative isolate overflow-hidden bg-gray-900 px-6 pt-8 sm:mx-auto sm:max-w-2xl sm:rounded-3xl sm:pl-16 sm:pr-0 sm:pt-16 lg:mx-0 lg:max-w-none">
                <div
                  className="absolute -inset-y-px -left-3 -z-10 w-full origin-bottom-left skew-x-[-30deg] bg-orange-200 opacity-20 ring-1 ring-inset ring-white"
                  aria-hidden="true"
                />
                <div className="mx-auto max-w-2xl sm:mx-0 sm:max-w-none">
                  <img
                    src={
                      page.image2 ??
                      "https://aicontentfy-customer-images.s3.eu-central-1.amazonaws.com/f30a8c8a-3fee-414e-bb4b-51f6910f406c.png"
                    }
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
                <h2 className="mt-2 text-balance text-3xl text-gray-900 sm:text-4xl">
                  {page.subtitle2}
                </h2>
                <p className="mt-6 text-balance text-lg leading-8 text-gray-600">
                  {page.description2}
                </p>
              </div>
              <div className="space-x-2 pt-8">
                <Link href="/login">
                  <Button className="justify-center text-balance rounded-3xl bg-gray-900 text-white hover:bg-gray-800">
                    {page.button}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonial section */}
      <Testimonials />

      {/* CTA */}
      <div className="bg-[#fb7a00]">
        <div className="mx-auto w-full max-w-5xl px-4 py-32 md:px-8">
          <h2 className="text-balance text-4xl  ">{page.cta}</h2>

          <div className="space-x-2 pt-8">
            <Link href="/login">
              <Button className="text-balance rounded-3xl">
                Start for free
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

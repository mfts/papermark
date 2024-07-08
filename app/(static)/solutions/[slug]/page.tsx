import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import Features from "@/components/web/alternatives/features";
import { LogoCloud } from "@/components/web/landing-page/logo-cloud";
import Testimonial from "@/components/web/testimonials/testimonial";
import Testimonials from "@/components/web/testimonials/testimonials";

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
    title: metatitle ? `${metatitle} ` : undefined,
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
      <div className="w-full bg-white pt-24 lg:pt-24">
        <div className="w-full px-4 lg:px-2">
          <div className="mx-auto w-full max-w-7xl px-4 md:px-8">
            <div className="flex w-full flex-col items-center">
              <div className="pb-1"></div>
              <div className="prose w-full text-center prose-headings:font-medium prose-h2:mb-2 prose-h2:mt-10 first:prose-h2:mt-0 sm:max-w-screen-md sm:pr-2 md:pr-0">
                <div className="my-6 text-balance text-black lg:text-7xl">
                  <h1 className="mb-1 text-5xl lg:text-7xl">{page.title}</h1>
                </div>

                <p className="text-m my-4 text-balance text-gray-500 sm:text-xl">
                  {page.description}
                </p>
              </div>
              <div className="space-x-2 pt-8">
                <Link href="/login">
                  <Button className="rounded-3xl bg-black text-base text-white hover:bg-black/90">
                    {page.button}
                  </Button>
                </Link>
                <Link
                  href="https://cal.com/marcseitz/papermark"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="outline"
                    className="rounded-3xl border-black bg-transparent text-base"
                  >
                    Book a demo
                  </Button>
                </Link>
              </div>
            </div>

            <div className="mt-16 flow-root sm:mt-24">
              <div className="-m-2 rounded-xl bg-gray-50 p-2 ring-1 ring-inset ring-gray-200 lg:-m-4 lg:rounded-2xl lg:p-4">
                <img
                  alt="App screenshot"
                  src={
                    page.imageUrl && page.imageUrl !== ""
                      ? page.imageUrl
                      : "https://assets.papermark.io/upload/file_6yutnL8q4gEc1iJxMbMiaZ-Screenshot-2024-05-18-at-1.02.30-PM.png"
                  }
                  width={2432}
                  height={1442}
                  className="rounded-md shadow-2xl ring-1 ring-white"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20 grid gap-16 md:gap-24 lg:gap-32">
          <div className="mx-auto mt-4 w-full px-0 lg:px-8 xl:p-0">
            <LogoCloud />
          </div>
        </div>
      </div>
      <Testimonial />
      {/* <div className="mx-auto w-full max-w-5xl px-4 text-center md:px-8">
        <div className="pt-32">
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
       
      </div> */}
      <div className="mx-auto w-full max-w-7xl px-4 md:px-8">
        <div className="overflow-hidden bg-white py-24 sm:py-24">
          <div className="mx-auto max-w-7xl">
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
                <div
                  className="absolute -inset-y-px -left-3 -z-10 w-full origin-bottom-left skew-x-[-30deg] bg-orange-200 opacity-20 ring-1 ring-inset ring-white"
                  aria-hidden="true"
                />
                <div className="mx-auto max-w-2xl sm:mx-0 sm:max-w-none">
                  <img
                    // src={
                    //   page.image1 ??
                    //   "https://assets.papermark.io/upload/file_Y1UuAt51v17QtBKTuP9Rj5-Screenshot-2024-05-18-at-12.56.35-PM.png"
                    // }
                    src={
                      "https://assets.papermark.io/upload/file_Y1UuAt51v17QtBKTuP9Rj5-Screenshot-2024-05-18-at-12.56.35-PM.png"
                    }
                    alt="Product screenshot"
                    width={2432}
                    height={1442}
                    className="-mb-12 w-[57rem] max-w-none rounded-tl-xl ring-1 ring-white/10"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto w-full max-w-7xl px-4 md:px-8">
        <div className="overflow-hidden bg-white py-24 sm:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:grid-cols-2 lg:items-start">
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
                      Start now
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="sm:px-6 lg:px-0">
                <div
                  className="absolute -inset-y-px -left-3 -z-10 w-full origin-bottom-left skew-x-[-30deg] bg-orange-200 opacity-20 ring-1 ring-inset ring-white"
                  aria-hidden="true"
                />
                <div className="mx-auto max-w-2xl sm:mx-0 sm:max-w-none">
                  <img
                    src={
                      page.image2 ??
                      "https://assets.papermark.io/upload/file_Y1UuAt51v17QtBKTuP9Rj5-Screenshot-2024-05-18-at-12.56.35-PM.png"
                    }
                    // src={
                    //   "https://assets.papermark.io/upload/file_Y1UuAt51v17QtBKTuP9Rj5-Screenshot-2024-05-18-at-12.56.35-PM.png"
                    // }
                    alt="Product screenshot"
                    width={2432}
                    height={1442}
                    className="-mb-12 w-[57rem] max-w-none rounded-tl-xl ring-1 ring-white/10"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto my-4 rounded-xl bg-[#fb7a00] px-6 py-12">
          <div className="item-center flex flex-col justify-between space-y-10 lg:flex-row lg:space-y-0">
            <h2 className="text-nowrap text-3xl">{page.cta}</h2>
            <div className="flex items-center space-x-2">
              <Link href="/login" target="_blank" rel="noopener noreferrer">
                <Button
                  variant="outline"
                  className="rounded-3xl border-black bg-transparent text-base hover:bg-gray-200 hover:text-black"
                >
                  Start now
                </Button>
              </Link>
              <Link
                href="https://cal.com/marcseitz/papermark"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="rounded-3xl bg-black text-base text-gray-200 hover:bg-gray-900">
                  Book a demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <div className="mx-auto w-full max-w-7xl py-20" id="features">
          <h2 className="max-w-7xl text-balance pb-20 pt-12 text-4xl">
            Papermark features <br />
            <span className="text-gray-500">For {page.title}</span>
          </h2>
          <Features />
        </div>

        <div className="mx-auto w-full max-w-7xl">
          <h2 className="text-balance py-12 text-4xl">
            {page.title} with a modern UI
            <br />
            <span className="text-gray-500">See the demo below</span>
          </h2>
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
              src="https://assets.papermark.io/upload/file_A4qNV68jr3MAUayMNi3WmY-Data-Room-demo-2.mp4"
              type="video/mp4"
            />
          </video>
        </div>
      </div>{" "}
      {/* Testimonial section */}
      <Testimonials />
      {/* CTA */}
      <div className="bg-[#fb7a00]">
        <div className="mx-auto w-full max-w-7xl px-4 py-32 md:px-8">
          <h2 className="text-balance text-4xl">{page.cta}</h2>
          <div className="space-x-2 pt-8">
            <Link
              href="https://cal.com/marcseitz/papermark"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="outline"
                className="rounded-3xl border-black bg-transparent text-base"
              >
                Book a demo
              </Button>
            </Link>
            <Link href="/login">
              <Button className="rounded-3xl text-base">Start for free</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

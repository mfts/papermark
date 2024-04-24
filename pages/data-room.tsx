import Head from "next/head";
import { useState } from "react";
import DataRoom from "@/components/web/dataroom-component";

import Article from "@/components/web/alternatives/docsendtext";
import Testimonials from "@/components/web/testimonials2";
import CTA from "@/components/web/cta";
import Footer from "@/components/web/footer";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/web/navbar";

const features = [
  "send unlimited documents",
  "email capture",
  "analytics on each page",
  "custom domain",
  "team access",
  "large files upload",
];

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [optimizedPost, setOptimizedPost] = useState<string>("");
  const [usecase, setUsecase] = useState<string>("");
  const [plan, setPlan] = useState<string>("");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  const shouldRenderSteps = () => {
    return selectedFeatures.length > 0;
  };

  return (
    <>
      <Head>
        <title>
          Papermark: Share Notion Pages with Custom Domains and Analytics
        </title>
        <meta
          name="description"
          content="Discover Papermark, the ultimate tool for sharing Notion pages. Add custom domains, secure your pages, capture emails, and track detailed analytics."
        />
        <meta
          property="og:title"
          content="Papermark: Advanced Notion Sharing with Custom Domains"
        />
        <meta
          property="og:description"
          content="Enhance your Notion experience with Papermark. Share Notion documents securely, use custom domains, and gain insightful analytics."
        />
        <meta
          property="og:image"
          content="https://www.papermark.io/_static/notion.png"
        />
        <meta property="og:url" content="https://www.papermark.io" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <Head>
        <title>Virtual Data Room | Powered by Papermark</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <meta
          name="description"
          content="Secure and manage your business documents with Papermark Virtual Data Room. Designed for optimal security and collaboration, our solution adapts to your unique needs."
        />

        <meta
          property="og:description"
          content="Papermark Virtual Data Room offers a secure platform for your business’s document storage and collaboration needs. Enhance your operational efficiency with tailored features."
        />
        <meta
          property="og:title"
          content="Virtual Data Room Powered by Papermark | Tailored for Your Business"
        />

        <meta
          property="og:image"
          content="https://www.papermark.io/cover.png"
        />
      </Head>

      <div className="flex flex-1 flex-col bg-white text-black">
        <Navbar />
        <main className="flex flex-col items-center w-full">
          <section className="pt-24 lg:pt-24 bg-white w-full">
            <div className="px-4 lg:px-2 w-full">
              <div className="max-w-7xl mx-auto px-4 md:px-8 w-full">
                <div className="w-full flex flex-col items-center">
                  <div className="pb-1">
                    {/* <img
                      src="https://media.licdn.com/dms/image/C560BAQF0P4VJimYMZw/company-logo_200_200/0/1630615035618?e=1720656000&v=beta&t=gWnITXssNMEKBqbdPrGev6pbQf9iLywYEr404OFtKV0"
                      alt="App screenshot"
                      className="mx-auto"
                      width={100}
                      height={50}
                    /> */}
                  </div>
                  <div className="prose prose-h2:mb-2 first:prose-h2:mt-0 prose-h2:mt-10 prose-headings:font-medium sm:max-w-screen-md sm:pr-2 md:pr-0 w-full text-center">
                    {/* <span className="inline-block text-sm lg:text-base py-1 px-2 bg-gray-50 rounded-3xl text-gray-500 text-xs text-balance">
                      Powered by Papermark
                    </span> */}
                    <div className="text-black lg:text-7xl my-6 text-balance">
                      <h1 className="text-5xl lg:text-7xl mb-1">Data Room</h1>
                    </div>

                    <p className="text-m my-4  text-gray-500 sm:text-xl text-balance">
                      Learn more about Papermark Data Room and all available
                      features on 3 core plans including full-whitelabelling and
                      self-hosting
                    </p>
                  </div>
                  <div className="pt-8 space-x-2">
                    <Link href="/login">
                      <Button className="text-base rounded-3xl bg-black text-white hover:bg-black/90">
                        Create Data Room
                      </Button>
                    </Link>
                    <Link
                      href="https://cal.com/marcseitz/papermark"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        variant="outline"
                        className="text-base rounded-3xl bg-transparent border-black"
                      >
                        Book a demo
                      </Button>
                    </Link>
                  </div>
                </div>
                {/* <DataRoomTable /> */}
              </div>
            </div>

            <div className="bg-white py-16">
              <div className="mx-auto max-w-7xl px-4 md:px-8">
                <DataRoom />
              </div>

              <div className="w-full max-w-7xl px-4 md:px-8 mx-auto ">
                <div className="py-12 bg-[#fb7a00] rounded-xl mx-auto px-6 my-4">
                  <div className="flex lg:flex-row flex-col item-center justify-between space-y-10 lg:space-y-0">
                    <h2 className="text-3xl text-nowrap">
                      Create secure data room on Papermark
                    </h2>
                    <div className="space-x-2 flex items-center">
                      <Link
                        href="https:papermark.io/login"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button
                          variant="outline"
                          className="text-base rounded-3xl bg-transparent border-black hover:bg-gray-200 hover:text-black"
                        >
                          Crate Data Room
                        </Button>
                      </Link>
                      <Link
                        href="https://cal.com/marcseitz/papermark"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button className="text-base rounded-3xl text-gray-200 bg-black hover:bg-gray-900">
                          Book a demo
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden bg-white py-24 sm:py-24">
                  <div className="mx-auto max-w-7xl ">
                    <div className="grid grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:grid-cols-2 lg:items-start">
                      <div className="px-6 lg:px-0 lg:pr-4 lg:pt-4">
                        <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-lg">
                          <h2 className="mt-2 text-3xl text-gray-900 sm:text-4xl text-balance">
                            Track activity in your data room
                          </h2>
                          <p className="mt-6 text-lg leading-8 text-gray-600 text-balance">
                            Papermark let you share your data room from a link,
                            but track activty on each document insight the Data
                            Room. Including time and views per each page.
                          </p>
                        </div>
                        <div className="pt-8 space-x-2">
                          <Link href="/login">
                            <Button className="text-white text-balance bg-gray-900 rounded-3xl hover:bg-gray-800 justify-center text-balance">
                              Get insights
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
                              src="https://aicontentfy-customer-images.s3.eu-central-1.amazonaws.com/a0ebbbe4-55f2-4f4a-b7f8-f251d3880386.png"
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

                <div className="overflow-hidden bg-white py-24 sm:py-24">
                  <div className="mx-auto max-w-7xl">
                    <div className="grid grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:grid-cols-2 lg:items-start">
                      <div className="sm:px-6 lg:px-0">
                        <div className="relative isolate overflow-hidden bg-gray-900 px-6 pt-8 sm:mx-auto sm:max-w-2xl sm:rounded-3xl sm:pl-16 sm:pr-0 sm:pt-16 lg:mx-0 lg:max-w-none">
                          <div
                            className="absolute -inset-y-px -left-3 -z-10 w-full origin-bottom-left skew-x-[-30deg] bg-orange-200 opacity-20 ring-1 ring-inset ring-white"
                            aria-hidden="true"
                          />
                          <div className="mx-auto max-w-2xl sm:mx-0 sm:max-w-none">
                            <img
                              src="https://aicontentfy-customer-images.s3.eu-central-1.amazonaws.com/f30a8c8a-3fee-414e-bb4b-51f6910f406c.png"
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
                            Share branded data room
                          </h2>
                          <p className="mt-6 text-lg leading-8 text-gray-600 text-balance">
                            With Papermark you can have unlimited branded data
                            rooms for your business. Customize the design of
                            each data room and create white-labelling.
                          </p>
                        </div>
                        <div className="pt-8 space-x-2">
                          <Link href="/login">
                            <Button className="text-white text-balance bg-gray-900 rounded-3xl hover:bg-gray-800 justify-center text-balance">
                              Create branded data room
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
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
                      src="https://assets.papermark.io/short-video.mp4"
                      type="video/mp4"
                    />
                  </video>
                </div>
              </div>
            </div>

            <Testimonials />
            {/* <CTA /> */}
          </section>
        </main>
        <div className="bg-[#fb7a00]">
          <div className="w-full mx-auto max-w-7xl py-32 px-4 md:px-8">
            <h2 className="text-4xl text-balance  ">
              Create secure and modern data room
            </h2>
            <div className="pt-8 space-x-2">
              <Link
                href="https://cal.com/marcseitz/papermark"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="outline"
                  className="text-base rounded-3xl bg-transparent border-black"
                >
                  Book a demo
                </Button>
              </Link>
              <Link href="/login">
                <Button className="text-base rounded-3xl">Start now</Button>
              </Link>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}

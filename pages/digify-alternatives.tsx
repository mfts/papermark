import Head from "next/head";

import { useState } from "react";

import LoadingDots from "@/components/ui/loading-dots";
import Grid from "@/components/web/alternatives/alternativesgrid";
import Article from "@/components/web/alternatives/digifytext";
import Feature from "@/components/web/alternatives/feature";
import FeaturesTable from "@/components/web/alternatives/digifytable";
import { PlanSelect } from "@/components/web/alternatives/plan";
import PricingTable from "@/components/web/alternatives/pricingtable";
import { UsecaseSelect } from "@/components/web/alternatives/usecase";
import UseCaseTable from "@/components/web/alternatives/usecasetable";
import CTA from "@/components/web/cta";
import Footer from "@/components/web/footer";
import Navbar from "@/components/web/navbar";
import Testimonials from "@/components/web/testimonials2";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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
          Top 10 Digify Alternatives in 2024 | Create Secure and Branded Data Room
        </title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <meta
          name="description"
          content="Explore the best Digify alternatives in 2024 for creating data room and sharing documents securely. Get the right document sharing and tracking solution for your use case."
        />

        <meta
          property="og:description"
          content="Looking for Digify alternatives? Discover best document sharing platforms that fits your needs."
        />
        <meta
          property="og:title"
          content="Best 10 Digify Alternatives in 2024 for your business"
        />

        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Explore Best Digify Alternatives | Create secure Data Room"
        />
        <meta
          name="twitter:description"
          content="Explore the best Digify alternatives in 2024 for creating data room and sharing documents securely. Get the right document sharing and tracking solution for your use case."
        />
      </Head>
      <div className="flex flex-1 flex-col bg-white text-black">
        <Navbar/>
        <main className="flex w-full flex-col items-center">
          <section className="w-full bg-white pt-24 lg:pt-24">
            <div className="w-full px-4 lg:px-2">
              <div className="mx-auto w-full max-w-7xl px-4 md:px-8">
                <div className="flex w-full flex-col items-center">
                  <div className="pb-1">
                    <img
                      src="https://assets.papermark.io/upload/file_AS7Wf6aZ7Xp4gphvo6JeCH-Digify_Logo_Horizontal__big.png"
                      alt="App screenshot"
                      className="mx-auto"
                      width={120}
                      height={70}
                    />
                  </div>
                  <div className="prose w-full text-center prose-headings:font-medium prose-h2:mb-2 prose-h2:mt-10 first:prose-h2:mt-0 sm:max-w-screen-md sm:pr-2 md:pr-0">
                    <h1 className="my-8 text-5xl font-bold text-black lg:text-7xl">
                      Top 10 Digify alternatives 2024
                    </h1>

                    <p className="text-m my-4 tracking-tight text-gray-500 sm:text-xl">
                      Compare best Digify alternatives for creating data room
                    </p>
                  </div>
                </div>
                <FeaturesTable />
              </div>
            </div>

            <Article />
            {/* <PricingTable />
            <UseCaseTable /> */}
            {/* <Grid /> */}
            {/* <div className="mx-auto max-w-5xl px-8 lg:px-28">
              <div className="mx-auto max-w-5xl">
                <div className="mx-auto my-1 w-full "></div>
                <h2 className="my-8 text-center text-4xl  font-bold text-black">
                  Find Digify alterntive based on your requirements
                </h2>
                <p className="text-1xl mb-5 mt-3 text-center font-semibold text-black ">
                  Step 1. Select features you prioritize the most <br />
                </p>
                <Feature
                  selectedFeatures={selectedFeatures}
                  setSelectedFeatures={setSelectedFeatures}
                />

                <div className="mx-auto my-1 w-full">
                  <div className="flex space-x-4">
                    <div className="w-full">
                      {shouldRenderSteps() && (
                        <>
                          <p className="text-1xl mb-5 mt-10 text-center font-semibold text-black ">
                            Step 2. Select your plan
                            <br />
                          </p>
                          <div className="flex space-x-4">
                            <div className="mx-auto w-full lg:w-1/2">
                              <PlanSelect plan={plan} setPlan={setPlan} />
                            </div>
                          </div>
                          <p className="text-1xl mb-5 mt-10 text-center font-semibold text-black ">
                            Step 3. Select your use case
                            <br />
                          </p>
                          <div className="mx-auto w-full lg:w-1/2">
                            <UsecaseSelect
                              usecase={usecase}
                              setUsecase={setUsecase}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mx-auto my-1 w-full">
                  <div className="flex space-x-6"></div>
                </div>

               
              </div>
              <div className="flex md:flex-col lg:flex-col">
                {optimizedPost && (
                  <div className="my-1">
                    <div className="flex items-center justify-between border-gray-300 py-2 pb-2">
                      <h2 className="mx-auto text-xl font-bold text-white">
                        Docsend alternatives just for you
                      </h2>
                    </div>

                    
                  </div>
                )}
              </div>
              
            </div> */}

            <Testimonials />
             <div className="bg-[#fb7a00]">
          <div className="mx-auto w-full max-w-7xl px-4 py-32 md:px-8">
            <h2 className="text-balance text-4xl  ">
              Sharing with Papermark is secure, fast, and free.
            </h2>
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
                <Button className="rounded-3xl text-base">
                  Start for free
                </Button>
              </Link>
            </div>
          </div>
        </div>
            <CTA />
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}

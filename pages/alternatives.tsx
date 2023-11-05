import Head from "next/head";
import { useEffect, useState, useRef } from "react";
import Feature from "@/components/web/alternatives/feature";

import { Toaster, toast } from "react-hot-toast";
// import LoadingDots from "@/components/web/alternatives/loadingdots";
import Footer from "@/components/web/footer";
import Navbar from "@/components/web/navbar";
import { PlanSelect } from "@/components/web/alternatives/plan";
import { UsecaseSelect } from "@/components/web/alternatives/usecase";
import LoadingDots from "@/components/ui/loading-dots";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [optimizedPost, setOptimizedPost] = useState<string>("");
  const [usecase, setUsecase] = useState<string>("");
  const [plan, setPlan] = useState<string>("");
  const [selectedFeature, setSelectedFeature] = useState<string>("");

  const shouldRenderSteps = () => {
    return selectedFeature !== "";
  };

  const handlePrompt = () => {
    let prompt = `Provide me the list of 5 Docsend alternatives, based on the requested ${plan}, ${usecase}, and ${
      selectedFeature ? selectedFeature : ""
    }. The first one should be Papermark- it fits in every case. Provide only names`;

    return prompt;
  };

  // function to send post to OpenAI and get response
  const optimizePost = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    const prompt = handlePrompt();

    const response = await fetch("/api/optimize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
      }),
    });

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    // This data is a ReadableStream
    const data = await response.text(); // get the full response text

    // Handle no data case
    if (!data) {
      setOptimizedPost("Nothing found, try another search.");
      setLoading(false);
      return;

      // Set the response data directly to state
      setOptimizedPost(data);
      setLoading(false);
    }

    const formattedData = data.replace(/\n/g, "<br>");
    setOptimizedPost(formattedData);
    setLoading(false);
  };

  return (
    <>
      <Head>
        <script
          defer
          data-domain="vc.papermark.io"
          src="https://plausible.io/js/script.js"
        ></script>

        <title>Top 10 Docsend alternatives personalised for you</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <meta
          name="description"
          content="Find investors and vc funds near you"
        />
        <meta property="og:site_name" content="startupinvestors.vercel.app" />
        <meta
          property="og:description"
          content="Unlock global startup funding with our app. Generate curated investor lists, connect with funds in various countries, and propel your startup to new heights today."
        />
        <meta property="Startup investors:title" content="Startup investors" />

        <meta name="StartupsFunding:card" content="summary_large_image" />
        <meta name="Startups:title" content="Startups funding" />
        <meta name="StartupsFunding:description" content="Startups funding" />
        <meta property="og:image" content="cover.png" />
      </Head>

      <div className="flex flex-col min-h-screen justify-between bg-slate-900">
        <main className="h-full bg-slate-900">
          <Navbar />

          <section className="py-20 lg:py-40 bg-white">
            {/* bg-[url('/image1.svg')] */}
            <div className="px-4">
              <div className="max-w-5xl mx-auto">
                <div className="w-full mx-auto">
                  <h1 className="text-4xl text-center font-bold pb-1 text-black lg:text-6xl ">
                    Find Docsend alternatives personalised for you
                  </h1>
                  <p className="mt-3 mb-10 text-center text-white">
                    Raise capital with help of AI generated list of investors{" "}
                    <br />
                  </p>
                  <div className="max-w-5xl mx-auto px-8 lg:px-28">
                    <div className="max-w-5xl mx-auto">
                      <div className="w-full my-1 mx-auto "></div>
                      <p className="text-1xl mt-3 mb-5 text-center text-black font-semibold ">
                        Step 1. Select features you prioritize the most <br />
                      </p>
                      <Feature
                        selectedFeature={selectedFeature}
                        setSelectedFeature={setSelectedFeature}
                      />
                      <div className="w-full my-1 mx-auto">
                        <div className="flex space-x-4">
                          <div className="w-full">
                            {shouldRenderSteps() && (
                              <>
                                <p className="text-1xl mt-10 mb-5 text-center text-black font-semibold ">
                                  Step 2. Select your plan
                                  <br />
                                </p>
                                <div className="flex space-x-4">
                                  {/* PlanSelect's width is decreased to half on larger screens using w-1/2 */}
                                  <div className="w-full lg:w-1/2 mx-auto">
                                    <PlanSelect plan={plan} setPlan={setPlan} />
                                  </div>
                                </div>
                                <p className="text-1xl mt-10 mb-5 text-center text-black font-semibold ">
                                  Step 3. Select your use case
                                  <br />
                                </p>
                                <div className="w-full lg:w-1/2 mx-auto">
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

                      <div className="w-full my-1 mx-auto">
                        <div className="flex space-x-6"></div>
                      </div>

                      <div className="my-4 lg:px-72 ">
                        <button
                          disabled={loading}
                          onClick={(e) => optimizePost(e)}
                          className="bg-black font-medium rounded-md w-full text-white px-4 py-2 hover:bg-gray-900 disabled:bg-indigo-500"
                        >
                          {loading && (
                            <LoadingDots color="white" style="large" />
                          )}
                          {!loading && ` Find alternatives `}
                        </button>
                      </div>
                    </div>
                    <div className="flex md:flex-col lg:flex-col">
                      <Toaster
                        position="top-right"
                        reverseOrder={false}
                        toastOptions={{ duration: 2000 }}
                      />
                      {optimizedPost && (
                        <div className="my-1">
                          <div className="flex justify-between items-center pb-2 py-2 border-gray-300">
                            <h2 className="text-xl font-bold text-white mx-auto">
                              Docsend alternatives just for you
                            </h2>
                          </div>

                          <div
                            className="bg-gray-200 text-black rounded-xl p-4 hover:bg-gray-300 transition  border"
                            onClick={() => {
                              navigator.clipboard.write([
                                new ClipboardItem({
                                  "text/html": new Blob([optimizedPost], {
                                    type: "text/html",
                                  }),
                                }),
                              ]);
                              toast("List copied to clipboard", {
                                icon: "📋",
                              });
                            }}
                            key={optimizedPost}
                          >
                            <p
                              className="text-black-700"
                              dangerouslySetInnerHTML={{
                                __html: optimizedPost,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="my-4 lg:px-80">
                      {optimizedPost && (
                        <a
                          href="/login"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-black text-xs rounded-md w-full text-white px-1 py-1 hover:bg-black disabled:bg-purple-500 inline-block text-center"
                        >
                          Send document with Papermark
                        </a>
                      )}
                    </div>
                  </div>
                  {optimizedPost && (
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 ">
                      {/* <Grid /> */}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </main>
        <Footer />
        //{" "}
      </div>
    </>
  );
}

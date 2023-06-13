import Link from "next/link";
import Footer from "@/components/Footer";
import Head from "next/head";

export default function Home() {

  return (
    <>
      <Head>
        <title>Papermark – The Open-Source Alternative to DocSend</title>
        <meta
          name="description"
          content="Papermark is an open-source document infrastructure for sharing and collaboration. Manage secure document sharing with real-time analytics."
        />
        <meta
          property="og:title"
          content="Papermark – The Open-Source Alternative to DocSend"
        />
        <meta
          property="og:description"
          content="Papermark is an open-source document infrastructure for sharing and collaboration. Manage secure document sharing with real-time analytics."
        />
        <meta
          property="og:image"
          content="https://www.papermark.io/_static/meta-image.png"
        />
        <meta property="og:url" content="https://www.papermark.io" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <div>
        <div className="max-h-screen relative isolate overflow-hidden bg-black">
          <div
            className="absolute left-[calc(50%-4rem)] top-10 -z-10 transform-gpu blur-3xl sm:left-[calc(50%-18rem)] lg:left-48 lg:top-[calc(50%-30rem)] xl:left-[calc(50%-24rem)]"
            aria-hidden="true"
          >
            <div
              className="aspect-[1108/632] w-[69.25rem] bg-gradient-to-r from-[#80caff] to-[#4f46e5] opacity-20"
              style={{
                clipPath:
                  "polygon(73.6% 51.7%, 91.7% 11.8%, 100% 46.4%, 97.4% 82.2%, 92.5% 84.9%, 75.7% 64%, 55.3% 47.5%, 46.5% 49.4%, 45% 62.9%, 50.3% 87.2%, 21.3% 64.1%, 0.1% 100%, 5.4% 51.1%, 21.4% 63.9%, 58.9% 0.2%, 73.6% 51.7%)",
              }}
            />
          </div>
          <div className="mx-auto max-w-7xl px-6 pb-24 pt-10 sm:pb-32 lg:flex lg:px-8 lg:py-40">
            <div className="mx-auto max-w-2xl flex-shrink-0 lg:mx-0 lg:max-w-xl lg:pt-8">
              <h1 className="mt-10 text-4xl font-bold text-white sm:text-6xl tracking-tighter">
                Papermark
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-300">
                The dynamic open-source alternative to DocSend. We&apos;re on a
                mission to revolutionize content sharing and collaboration.
              </p>
              <div className="mt-10 flex items-center gap-x-6">
                <Link
                  className="rounded-md bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
                  href={"/login"}
                >
                  Get started
                </Link>
                <Link
                  href="https://github.com/mfts/papermark"
                  className="text-sm font-semibold leading-6 text-white"
                >
                  Star on GitHub
                </Link>
              </div>
            </div>
            <div className="mx-auto mt-16 flex max-w-2xl sm:mt-24 lg:ml-10 lg:mr-0 lg:mt-0 lg:max-w-none lg:flex-none xl:ml-32">
              <div className="max-w-3xl flex-none sm:max-w-5xl lg:max-w-none">
                <img
                  src={`${process.env.NEXT_PUBLIC_BASE_URL}/_static/papermark.png`}
                  alt="App screenshot"
                  width={2432}
                  height={1442}
                  className="w-[76rem] rounded-md bg-white/5 shadow-2xl ring-1 ring-white/10"
                />
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
}

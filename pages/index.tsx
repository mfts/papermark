import Footer from "@/components/web/footer";
import Navbar from "@/components/web/navbar";
import Decks from "@/components/web/decks";
import Header from "@/components/web/header";
import Section from "@/components/web/section";
import Section2 from "@/components/web/section2";
import Testimonials from "@/components/web/testimonials";
import Logos from "@/components/web/logos";
import Head from "next/head";
import Section3 from "@/components/web/section3";

export default function Home() {
  return (
    <>
      <Head>
        <meta
          name="description"
          content="Papermark is an open-source document infrastructure for sharing and collaboration. Free alternative to Docsend with custom domain. Manage secure document sharing with real-time analytics."
        />
        <meta
          property="og:title"
          content="Papermark | The Open Source DocSend Alternative"
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
      <Navbar />

      <div className="mt-8">
        <div className="relative isolate overflow-hidden bg-white ">
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

          <Header />
          <Logos />
          <Decks />
          <Section />
          <Section3 />
          <Testimonials />
          <Section2 />
        </div>
      </div>
      <Footer />

      <div className="fixed bottom-5 z-20 mx-5 flex flex-col space-y-4 rounded-lg border border-gray-400 bg-white p-5 shadow-lg sm:right-5 sm:mx-auto sm:max-w-sm">
        <h3 className="text-lg font-semibold text-black">
          Thank you, Papermark Community ✨
        </h3>
        <p className="text-sm text-gray-500">
          With the support of the open-source community, we launched on Product
          Hunt to <span className="font-bold">#1 of the day</span>.
        </p>
        <div className="flex justify-center">
          <div className="">
            <a
              target="_blank"
              href="https://www.producthunt.com/posts/papermark-3?utm_source=badge-top-post-badge&amp;utm_medium=badge&amp;utm_souce=badge-papermark"
            >
              <img
                src="https://api.producthunt.com/widgets/embed-image/v1/top-post-badge.svg?post_id=411605&amp;theme=light&amp;period=daily"
                alt="Papermark - The open-source DocSend alternative | Product Hunt"
                className="w-[250px] h-[54px]"
              />
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

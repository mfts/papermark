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
          content="Papermark is an open-source document infrastructure for sharing and collaboration. Manage secure document sharing with real-time analytics. It is a free alternative to DocSend."
        />
        <meta
          property="og:image"
          content="https://www.papermark.io/_static/meta-image.png"
        />
        <meta property="og:url" content="https://www.papermark.io" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <Navbar />

      <div>
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
    </>
  );
}

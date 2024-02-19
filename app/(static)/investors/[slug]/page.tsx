import { getInvestor } from "@/lib/content/investor";
import { notFound } from "next/navigation";
import Link from "next/link";
import Head from "next/head";
import Navbar from "@/components/web/navbar";
import { Button } from "@/components/ui/button";

export default async function InvestorPage({
  params,
}: {
  params: { slug: string };
}) {
  const investor = await getInvestor(params.slug);
  if (!investor) return notFound();

  return (
    <>
      <div>
        <Head>
          <title>{investor.name} deatails and fundraising information </title>
          <meta
            name="description"
            content="Looking to raise capital, check profile of one of the venture capital funds {investor.name}"
          />
          <meta
            property="og:title"
            content="{investor.name} investor page and information"
          />
          <meta
            property="og:description"
            content="Looking to raise capital, check profile of one of the venture capital funds {investor.name}"
          />
          <meta
            property="og:image"
            content="https://www.papermark.io/_static/meta-image.png"
          />
          <meta property="og:url" content="https://www.papermark.io" />
          <meta name="twitter:card" content="summary_large_image" />
        </Head>

        {/* Hero section */}
        <div className="flex flex-1 flex-col bg-white text-black justify-center ">
          <div className="max-w-5xl w-full mx-auto px-4 md:px-8 ">
            <div className="pt-24">
              <div className=" pb-4">
                <img
                  src="{investor.imageURL}"
                  alt="App screenshot"
                  className=""
                  width={100}
                  height={50}
                />
              </div>
              <div className="max-w-xl relative rounded-full px-3 py-1 text-sm leading-6 text-black dark:text-white ring-1 ring-black/10 dark:ring-white/10 hover:ring-white/20">
                active
              </div>
              <h1 className="text-6xl md:text-6xl text-balance ">
                {investor.name}
              </h1>
              <p className="text-2xl mt-8 text-balance max-w-3xl">
                Venture capital and investor firm
              </p>
              <div className="pt-8 space-x-2">
                <Link href="/login">
                  <Button className="text-white bg-gray-800 rounded-3xl hover:bg-gray-600">
                    {investor.name} website link
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
        </div>
      </div>
    </>
  );
}

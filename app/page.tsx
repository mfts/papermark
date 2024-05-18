import Image from "next/image";
import Link from "next/link";

import {
  RefreshCw as ArrowPathIcon,
  BarChart3Icon,
  Settings as Cog6ToothIcon,
  PaletteIcon,
  ServerIcon,
  SlidersIcon,
} from "lucide-react";

import ProductHuntIcon from "@/components/shared/icons/producthunt";
import TwitterIcon from "@/components/shared/icons/twitter";
import { Button } from "@/components/ui/button";
import Footer from "@/components/web/footer";
import { LogoCloud } from "@/components/web/landing-page/logo-cloud";
import Navbar from "@/components/web/navbar";
import Testimonials from "@/components/web/testimonials2";
import ImageSwitcher from "@/components/web/landing-page/imageswitcher";

const features = [
  {
    name: "Fine-tune access control",
    description:
      "Control who can view your documents and for how long. Revoke access at any time.",
    icon: SlidersIcon,
  },
  {
    name: "Real-time insights",
    description:
      "Receive page-by-page analytics on your visitors and get notified in real-time.",
    icon: ArrowPathIcon,
  },
  {
    name: "Total brand customization",
    description:
      "Connect your domain and bring your own brand to customize your viewers' experience.",
    icon: PaletteIcon,
  },
  {
    name: "Rich analytics",
    description:
      "Dive into detailed analytics and understand how your documents are being viewed.",
    icon: BarChart3Icon,
  },
  {
    name: "AI-powered",
    description: "Chat with your document using large language models.",
    icon: Cog6ToothIcon,
  },
  {
    name: "Self-host",
    description: "Papermark is open-source. Run it on your own infrastructure.",
    icon: ServerIcon,
  },
];

export default function Home() {
  return (
    <>
      <div className="flex flex-1 flex-col bg-white text-black">
        <Navbar />

        <div className="mx-auto w-full max-w-7xl px-4 md:px-8">
          <div className="pt-24">
            <h1 className="text-balance text-6xl md:text-8xl">
              The Open-Source DocSend Alternative
            </h1>
            <p className="mt-8 max-w-3xl text-balance text-2xl">
              Papermark is a modern document sharing infrastructure with
              built-in page analytics and full white-labeling
            </p>
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
                <Button className="rounded-3xl text-base">Send document</Button>
              </Link>
            </div>
            {/* <div className="mx-auto mt-24 w-full">
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
            </div> */}
          </div>

          <div className="mx-auto mt-24 w-full">
            <ImageSwitcher />
          </div>

          <div className="mt-20 grid gap-16 md:gap-24 lg:gap-32">
            <div className="mx-auto mt-4 w-full px-0 lg:px-8 xl:p-0">
              <LogoCloud />
            </div>
          </div>
        </div>

        <div className="mt-24 w-full overflow-x-hidden bg-gray-50">
          <div className="mx-auto w-full max-w-7xl px-4 md:px-8">
            <h2 className="text-balance pb-20 pt-20 text-4xl">
              Share your documents, securely.{" "}
              <span className="text-gray-500">
                {/* Fine-tune access control. Receive real-time page analytics.
                Customize the experience with your brand and domain. Papermark
                is 100% open source. */}
              </span>
            </h2>
          </div>
          <div className="mx-4 mb-6 gap-6 text-balance sm:mx-0 sm:flex sm:translate-x-[-30px] sm:flex-nowrap lg:mb-10 lg:gap-10">
            <div className="mb-6 flex-none rounded-xl bg-gray-200 p-6 sm:mb-0 sm:max-w-[300px] sm:p-6 md:max-w-[360px] lg:max-w-[500px] lg:p-8 xl:max-w-[560px] xl:p-10 2xl:max-w-[640px]">
              <p className="font-380 text-base leading-none tracking-tight text-black/90 lg:text-base xl:text-base 2xl:-ml-0.5 2xl:text-lg">
                Real Estate
              </p>
              <p className="font-380 -ml-0.5 text-xl leading-tight tracking-tighter text-black/90 md:-ml-0.5 md:text-2xl md:leading-none lg:-ml-0.5 lg:text-4xl xl:-ml-0.5 xl:text-4xl ">
                Securely share property documents with clients
              </p>
            </div>
            <div className="mb-6 flex-none rounded-xl bg-black/80 p-6 sm:mb-0 sm:max-w-[300px] sm:p-6 md:max-w-[360px] lg:max-w-[500px] lg:p-8 xl:max-w-[560px] xl:p-10 2xl:max-w-[640px]">
              <p className="font-380 text-base leading-none tracking-tight text-gray-50 lg:text-base xl:text-base 2xl:-ml-0.5 2xl:text-lg">
                Startups
              </p>
              <p className="font-380 -ml-0.5 text-xl leading-tight tracking-tighter text-gray-50 md:-ml-0.5 md:text-2xl md:leading-none lg:-ml-0.5 lg:text-4xl xl:-ml-0.5 xl:text-4xl ">
                Take ownership of your fundraising process
              </p>
            </div>
            <div className="mb-6 flex-none rounded-xl bg-gray-200 p-6 sm:mb-0 sm:max-w-[300px] sm:p-6 md:max-w-[360px] lg:max-w-[500px] lg:p-8 xl:max-w-[560px] xl:p-10 2xl:max-w-[640px]">
              <p className="font-380 text-base leading-none tracking-tight text-black/90 lg:text-base xl:text-base 2xl:-ml-0.5 2xl:text-lg">
                Growth
              </p>
              <p className="font-380 -ml-0.5 text-xl leading-tight tracking-tighter text-black/90 md:-ml-0.5 md:text-2xl md:leading-none lg:-ml-0.5 lg:text-4xl xl:-ml-0.5 xl:text-4xl ">
                Capture marketing-qualified leads on social media
              </p>
            </div>
          </div>
          <div className="mx-4 mb-6 gap-6 text-balance sm:mx-0 sm:flex sm:translate-x-[50px] sm:flex-nowrap lg:mb-10 lg:gap-10">
            <div className="mb-6 flex-none rounded-xl bg-black/80 p-6 sm:mb-0 sm:max-w-[300px] sm:p-6 md:max-w-[360px] lg:max-w-[500px] lg:p-8 xl:max-w-[560px] xl:p-10 2xl:max-w-[640px]">
              <p className="font-380 text-base leading-none tracking-tight text-gray-50 lg:text-base xl:text-base 2xl:-ml-0.5 2xl:text-lg">
                Sales
              </p>
              <p className="font-380 -ml-0.5 text-xl leading-tight tracking-tighter text-gray-50 md:-ml-0.5 md:text-2xl md:leading-none lg:-ml-0.5 lg:text-4xl xl:-ml-0.5 xl:text-4xl ">
                Spend time on only engaged prospects
              </p>
            </div>
            <div className="mb-6 flex-none rounded-xl bg-gray-200 p-6 sm:mb-0 sm:max-w-[300px] sm:p-6 md:max-w-[360px] lg:max-w-[500px] lg:p-8 xl:max-w-[560px] xl:p-10 2xl:max-w-[640px]">
              <p className="font-380 text-base leading-none tracking-tight text-black/90 lg:text-base xl:text-base 2xl:-ml-0.5 2xl:text-lg">
                Investors
              </p>
              <p className="font-380 -ml-0.5 text-xl leading-tight tracking-tighter text-black/90 md:-ml-0.5 md:text-2xl md:leading-none lg:-ml-0.5 lg:text-4xl xl:-ml-0.5 xl:text-4xl">
                Take the guess-work out of LP updates
              </p>
            </div>
            <div className="mb-6 flex-none rounded-xl bg-black/80 p-6 sm:mb-0 sm:max-w-[300px] sm:p-6 md:max-w-[360px] lg:max-w-[500px] lg:p-8 xl:max-w-[560px] xl:p-10 2xl:max-w-[640px]">
              <p className="font-380 text-base leading-none tracking-tight text-gray-50 lg:text-base xl:text-base 2xl:-ml-0.5 2xl:text-lg">
                Non-Profits
              </p>
              <p className="font-380 -ml-0.5 text-xl leading-tight tracking-tighter text-gray-50 md:-ml-0.5 md:text-2xl md:leading-none lg:-ml-0.5 lg:text-4xl xl:-ml-0.5 xl:text-4xl ">
                Securely share and track grant applications
              </p>
            </div>
          </div>
        </div>

        <div
          className="mx-auto w-full max-w-7xl px-4 py-20 md:px-8"
          id="features"
        >
          <h2 className="max-w-3xl text-balance pb-20 pt-12 text-4xl">
            Built for modern teams.{" "}
            <span className="text-gray-500">
              Share your documents with an impression that lasts.
            </span>
          </h2>
          <div className="">
            <dl className="mx-auto grid max-w-2xl grid-cols-1 gap-x-6 gap-y-10 leading-7  sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-x-8 lg:gap-y-16">
              {features.map((feature) => (
                <div
                  key={feature.name}
                  className="flex flex-col justify-start space-y-2"
                >
                  <feature.icon
                    className="h-10 w-10 text-gray-800"
                    aria-hidden="true"
                  />
                  <dt className="inline text-2xl text-gray-800">
                    {feature.name}
                  </dt>{" "}
                  <dd className="inline text-balance text-base">
                    {feature.description}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div>
          <Testimonials />
        </div>

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

        <Footer />
      </div>
    </>
  );
}

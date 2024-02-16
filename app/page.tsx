import Link from "next/link";
import GitHubIcon from "@/components/shared/icons/github";
import TwitterIcon from "@/components/shared/icons/twitter";
import LinkedinIcon from "@/components/shared/icons/linkedin";
import ProductHuntIcon from "@/components/shared/icons/producthunt";
import { Button } from "@/components/ui/button";

import {
  RefreshCw as ArrowPathIcon,
  Settings as Cog6ToothIcon,
  ServerIcon,
  PaletteIcon,
  SlidersIcon,
  BarChart3Icon,
} from "lucide-react";

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
        <div className="sticky top-0 z-50">
          <div className="flex h-14 w-full mx-auto items-center justify-center bg-white/75 backdrop-blur-lg">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between self-center px-4 md:px-8">
              <div className="flex items-center space-x-10">
                <Link
                  aria-label="Return home"
                  className="flex h-full flex-none items-center rounded-md text-black ring-0"
                  href="/"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold tracking-tighter text-black">
                      Papermark
                    </span>
                  </div>
                </Link>
                <div className="hidden items-center gap-2 md:flex">
                  <Link
                    className="group inline-flex h-10 w-max items-center justify-center rounded-md px-2.5 py-1 font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
                    href="#"
                  >
                    <span className="relative z-[2] flex items-center gap-1">
                      <span>Features</span>
                    </span>
                  </Link>
                  <Link
                    className="group inline-flex h-10 w-max items-center justify-center rounded-md px-2.5 py-1 font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
                    href="/pricing"
                  >
                    <span className="relative z-[2] flex items-center gap-1">
                      <span>Pricing</span>
                    </span>
                  </Link>
                </div>
              </div>
              <div className="flex items-center gap-2 justify-self-end">
                <Link
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex h-10 w-max items-center justify-center rounded-md px-2.5 py-1 font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
                  href="https://github.com/mfts/papermark"
                >
                  <GitHubIcon className="mr-2 h-6 w-6" /> 1.8k
                </Link>
                <Link
                  className="group inline-flex h-10 w-max items-center justify-center rounded-md px-2.5 py-1 font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
                  href="/login"
                >
                  <span className="relative z-[2] flex items-center gap-1">
                    <span>Log in</span>
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl w-full mx-auto px-4 md:px-8">
          <div className="pt-24">
            <h1 className="text-6xl md:text-8xl text-balance">
              The Open-Source DocSend Alternative
            </h1>
            <p className="text-2xl mt-8 text-balance max-w-3xl">
              Papermark is an open-source document sharing infrastructure with
              built-in page analytics and custom domains.
            </p>
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
                <Button className="text-base rounded-3xl">
                  Start for free
                </Button>
              </Link>
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

          <div className="grid gap-16 md:gap-24 lg:gap-32 mt-20">
            <div className="mx-auto mt-4 w-full px-0 lg:px-8 xl:p-0">
              <LogoCloud />
            </div>
          </div>
        </div>

        <div className="mt-24 bg-gray-50 w-full overflow-x-hidden">
          <div className="w-full mx-auto max-w-7xl px-4 md:px-8">
            <h2 className="text-4xl text-balance pt-20 pb-20">
              Share your documents, securely.{" "}
              <span className="text-gray-500">
                {/* Fine-tune access control. Receive real-time page analytics.
                Customize the experience with your brand and domain. Papermark
                is 100% open source. */}
              </span>
            </h2>
          </div>
          <div className="mx-4 sm:mx-0 sm:flex sm:flex-nowrap gap-6 lg:gap-10 mb-6 lg:mb-10 sm:translate-x-[-30px] text-balance">
            <div className="bg-gray-200 flex-none rounded-xl p-6 mb-6 sm:max-w-[300px] sm:p-6 sm:mb-0 md:max-w-[360px] lg:max-w-[500px] lg:p-8 xl:max-w-[560px] xl:p-10 2xl:max-w-[640px]">
              <p className="text-black/90 font-380 text-base lg:text-base xl:text-base 2xl:text-lg 2xl:-ml-0.5 tracking-tight leading-none">
                Real Estate
              </p>
              <p className="text-black/90 font-380 text-xl -ml-0.5 md:text-2xl md:-ml-0.5 md:leading-none lg:text-4xl lg:-ml-0.5 xl:text-4xl xl:-ml-0.5 tracking-tighter leading-tight ">
                Securely share property documents with clients
              </p>
            </div>
            <div className="bg-black/80 flex-none rounded-xl p-6 mb-6 sm:max-w-[300px] sm:p-6 sm:mb-0 md:max-w-[360px] lg:max-w-[500px] lg:p-8 xl:max-w-[560px] xl:p-10 2xl:max-w-[640px]">
              <p className="text-gray-50 font-380 text-base lg:text-base xl:text-base 2xl:text-lg 2xl:-ml-0.5 tracking-tight leading-none">
                Startups
              </p>
              <p className="text-gray-50 font-380 text-xl -ml-0.5 md:text-2xl md:-ml-0.5 md:leading-none lg:text-4xl lg:-ml-0.5 xl:text-4xl xl:-ml-0.5 tracking-tighter leading-tight ">
                Take ownership of your fundraising process
              </p>
            </div>
            <div className="bg-gray-200 flex-none rounded-xl p-6 mb-6 sm:max-w-[300px] sm:p-6 sm:mb-0 md:max-w-[360px] lg:max-w-[500px] lg:p-8 xl:max-w-[560px] xl:p-10 2xl:max-w-[640px]">
              <p className="text-black/90 font-380 text-base lg:text-base xl:text-base 2xl:text-lg 2xl:-ml-0.5 tracking-tight leading-none">
                Growth
              </p>
              <p className="text-black/90 font-380 text-xl -ml-0.5 md:text-2xl md:-ml-0.5 md:leading-none lg:text-4xl lg:-ml-0.5 xl:text-4xl xl:-ml-0.5 tracking-tighter leading-tight ">
                Capture marketing-qualified leads on social media
              </p>
            </div>
          </div>
          <div className="mx-4 sm:mx-0 sm:flex sm:flex-nowrap gap-6 lg:gap-10 mb-6 lg:mb-10 sm:translate-x-[50px] text-balance">
            <div className="bg-black/80 flex-none rounded-xl p-6 mb-6 sm:max-w-[300px] sm:p-6 sm:mb-0 md:max-w-[360px] lg:max-w-[500px] lg:p-8 xl:max-w-[560px] xl:p-10 2xl:max-w-[640px]">
              <p className="text-gray-50 font-380 text-base lg:text-base xl:text-base 2xl:text-lg 2xl:-ml-0.5 tracking-tight leading-none">
                Sales
              </p>
              <p className="text-gray-50 font-380 text-xl -ml-0.5 md:text-2xl md:-ml-0.5 md:leading-none lg:text-4xl lg:-ml-0.5 xl:text-4xl xl:-ml-0.5 tracking-tighter leading-tight ">
                Spend time on only engaged prospects
              </p>
            </div>
            <div className="bg-gray-200 flex-none rounded-xl p-6 mb-6 sm:max-w-[300px] sm:p-6 sm:mb-0 md:max-w-[360px] lg:max-w-[500px] lg:p-8 xl:max-w-[560px] xl:p-10 2xl:max-w-[640px]">
              <p className="text-black/90 font-380 text-base lg:text-base xl:text-base 2xl:text-lg 2xl:-ml-0.5 tracking-tight leading-none">
                Investors
              </p>
              <p className="text-black/90 font-380 text-xl -ml-0.5 md:text-2xl md:-ml-0.5 md:leading-none lg:text-4xl lg:-ml-0.5 xl:text-4xl xl:-ml-0.5 tracking-tighter leading-tight">
                Take the guess-work out of LP updates
              </p>
            </div>
            <div className="bg-black/80 flex-none rounded-xl p-6 mb-6 sm:max-w-[300px] sm:p-6 sm:mb-0 md:max-w-[360px] lg:max-w-[500px] lg:p-8 xl:max-w-[560px] xl:p-10 2xl:max-w-[640px]">
              <p className="text-gray-50 font-380 text-base lg:text-base xl:text-base 2xl:text-lg 2xl:-ml-0.5 tracking-tight leading-none">
                Non-Profits
              </p>
              <p className="text-gray-50 font-380 text-xl -ml-0.5 md:text-2xl md:-ml-0.5 md:leading-none lg:text-4xl lg:-ml-0.5 xl:text-4xl xl:-ml-0.5 tracking-tighter leading-tight ">
                Securely share and track grant applications
              </p>
            </div>
          </div>
        </div>

        <div
          className="w-full mx-auto max-w-7xl px-4 md:px-8 py-20"
          id="features"
        >
          <h2 className="text-4xl text-balance pt-12 pb-20 max-w-3xl">
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
                  <dt className="inline text-gray-800 text-2xl">
                    {feature.name}
                  </dt>{" "}
                  <dd className="inline text-base text-balance">
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
          <div className="w-full mx-auto max-w-7xl py-32 px-4 md:px-8">
            <h2 className="text-4xl text-balance  ">
              Sharing with Papermark is secure, fast, and free.
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
                <Button className="text-base rounded-3xl">
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

const navigation = {
  product: [
    { name: "AI Document Assistant", href: "/ai" },
    { name: "Notion", href: "/share-notion-page" },
    { name: "Pricing", href: "/pricing" },
  ],
  resources: [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Launch Week", href: "/launch-week" },
  ],
  tools: [
    { name: "Open Source Friends", href: "/oss-friends" },
    { name: "Open Source Investors", href: "/open-source-investors" },
    { name: "Investor Database", href: "/investors" },
    {
      name: "YC Application GPT",
      href: "https://chat.openai.com/g/g-LYDRCiZB9-yc-application-gpt",
    },
    {
      name: "FindVC GPT",
      href: "https://chat.openai.com/g/g-G5orSgI31-findvc",
    },
    {
      name: "DocSend Alternatives Finder",
      href: "/docsend-alternatives",
    },
  ],
  alternatives: [
    { name: "DocSend", href: "/alternatives/docsend" },
    { name: "BriefLink", href: "/alternatives/brieflink" },
    { name: "PandaDoc", href: "/alternatives/pandadoc" },
    { name: "Google Drive", href: "/alternatives/google-drive" },
    { name: "Pitch", href: "/alternatives/pitch" },
  ],
  social: [
    {
      name: "GitHub",
      href: "https://github.com/mfts/papermark",
      icon: () => <GitHubIcon className="h-6 w-6" aria-hidden="true" />,
    },
    {
      name: "X / Twitter",
      href: "https://twitter.com/papermarkio",
      icon: () => <TwitterIcon className="h-5 w-5" aria-hidden="true" />,
    },
    {
      name: "LinkedIn",
      href: "https://www.linkedin.com/company/papermarkio",
      icon: () => <LinkedinIcon className="h-5 w-5" aria-hidden="true" />,
    },
  ],
};

function Footer() {
  return (
    <footer className="bg-white" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="mx-auto max-w-7xl pt-20 pb-4 px-4 md:px-8">
        {" "}
        {/* px-6 pb-8 pt-16 sm:pt-24 lg:px-8 lg:pt-32 */}
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-4">
            <span className="text-2xl font-bold tracking-tighter text-black">
              Papermark
            </span>
            <p className="leading-6 text-gray-500">
              Sharing documents, securely and on brand.
            </p>
            <div className="flex space-x-2">
              {navigation.social.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center h-10 rounded-md px-2.5 py-1 font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
                >
                  <span className="sr-only">{item.name}</span>
                  <item.icon />
                </a>
              ))}
            </div>
          </div>
          <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="font-semibold leading-6 text-black">Product</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {navigation.product.map((item) => (
                    <li key={item.name}>
                      <a
                        href={item.href}
                        className="leading-6 text-gray-500 hover:text-black"
                      >
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="font-semibold leading-6 text-black">
                  Resources
                </h3>
                <ul role="list" className="mt-6 space-y-4">
                  {navigation.resources.map((item) => (
                    <li key={item.name}>
                      <a
                        href={item.href}
                        className="leading-6 text-gray-500 hover:text-black"
                      >
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="font-semibold leading-6 text-black">Tools</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {navigation.tools.map((item) => (
                    <li key={item.name}>
                      <a
                        href={item.href}
                        className="leading-6 text-gray-500 hover:text-black"
                      >
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="font-semibold leading-6 text-black">
                  Alternatives
                </h3>
                <ul role="list" className="mt-6 space-y-4">
                  {navigation.alternatives.map((item) => (
                    <li key={item.name}>
                      <a
                        href={item.href}
                        className="leading-6 text-gray-500 hover:text-black"
                      >
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-16 border-t border-black/10 pt-4 sm:mt-20 lg:mt-24">
          <p className="text-sm leading-5 text-gray-500">
            &copy; 2024 Papermark. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

import Image from "next/image";
import { LogoCloud } from "@/components/web/landing-page/logo-cloud";

const testimonials = [
  {
    body: "best thing is that all the save DocSend to PDF plugins that VCs use probably won't work 😁",
    author: {
      name: "Jonathan Reimer",
      handle: "jonathimer",
      imageUrl:
        "https://pbs.twimg.com/profile_images/1704777684046209024/_JdBcXWp_400x400.jpg",
      link: "https://twitter.com/jonathimer/status/1663651278872891395",
    },
    producthunt: false,
  },
  {
    body: "This looks awesome!! Incredible work for an MVP – love how the link was automatically copied to clipboard when it's created! 🤩",
    author: {
      name: "Steven Tey",
      handle: "steventey",
      imageUrl:
        "https://pbs.twimg.com/profile_images/1506792347840888834/dS-r50Je_400x400.jpg",
      link: "https://twitter.com/steventey/status/1663611851807006721",
    },
    producthunt: false,
  },
  {
    body: "looks so good! gonna have to steal that upload component 😍 congrats & thanks for the great idea 😄",
    author: {
      name: "alana goyal",
      handle: "alanaagoyal",
      imageUrl:
        "https://pbs.twimg.com/profile_images/1679538379070005248/jwGUle5U_400x400.jpg",
      link: "https://twitter.com/alanaagoyal/status/1663522718015270912",
    },
    producthunt: false,
  },
  {
    body: "Currently getting a lot of use out of .@mfts0's \"papermark\" project! I'm looking to see how he implemented Resend/React Email into his NextAuth stack.",
    author: {
      name: "Lukas Lunzmann",
      handle: "lucaslunzmann",
      imageUrl:
        "https://pbs.twimg.com/profile_images/1738781878792921088/5kSW6ymD_400x400.jpg",
      link: "https://twitter.com/lucaslunzmann/status/1673052992541523968",
    },
    producthunt: false,
  },
  {
    body: "We self-host Papermark at Rubric Labs for doc-sharing. Brilliantly-simple alternative to Docsend. Features are well-executed, so I can't wait to try new stuff!",
    author: {
      name: "Ted Spare",
      handle: "TedSpare",
      imageUrl:
        "https://pbs.twimg.com/profile_images/1696951746587656192/xtLP8mHs_400x400.jpg",
      link: "https://www.producthunt.com/products/papermark-2#papermark-3",
    },
    producthunt: true,
  },
  {
    body: "True builders listen to their users and build what they need. Thanks @papermarkio for solving a big pain point. DocSend monopoly will end soon!",
    author: {
      name: "Jaski",
      handle: "Jas_Jaski",
      imageUrl:
        "https://pbs.twimg.com/profile_images/1681327970735251459/xYzLMVZ7_400x400.jpg",
      link: "https://twitter.com/Jas_Jaski/status/1731957497487868390",
    },
    producthunt: false,
  },
  // More testimonials...
];

function Testimonials() {
  return (
    <div className="bg-white py-24">
      <div className="w-full mx-auto max-w-7xl px-4 md:px-8">
        <h2 className="text-4xl text-balance">
          Loved by over 3000 users.
          <br />
          <span className="text-gray-500">
            Here&apos;s what they have to say about us.
          </span>
        </h2>
        <div className="mx-auto max-w-2xl lg:max-w-none mt-8">
          <div className="space-y-6 py-8 sm:block sm:columns-2 sm:gap-6 lg:columns-3">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.author.handle}
                className="flex w-full relative"
              >
                <div className="rounded-lg shadow-lg border-gray-500 bg-white p-6 text-base leading-6 border  relative">
                  <div className="flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-x-4">
                      <div className="flex items-center gap-x-4">
                        <Image
                          className="h-10 w-10 rounded-full bg-gray-50"
                          src={testimonial.author.imageUrl}
                          width={40}
                          height={40}
                          alt={testimonial.author.name}
                        />
                        <div>
                          <div className="font-semibold text-gray-900">
                            {testimonial.author.name}
                          </div>
                          <a
                            className="text-gray-600 hover:text-gray-800"
                            href={testimonial.author.link}
                            target="_blank"
                            rel="noopener noreferrer"
                          >{`@${testimonial.author.handle}`}</a>
                        </div>
                      </div>
                      <a
                        href={testimonial.author.link} // Using the link from the testimonial
                        target="_blank"
                        rel="noopener noreferrer"
                        className=""
                      >
                        {testimonial.producthunt ? (
                          <ProductHuntIcon className="w-6 h-6 text-gray-800" />
                        ) : (
                          <TwitterIcon className="w-5 h-5 text-gray-800" />
                        )}
                      </a>
                    </div>

                    <blockquote className="my-4 text-gray-900">
                      <p>{testimonial.body}</p>
                    </blockquote>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

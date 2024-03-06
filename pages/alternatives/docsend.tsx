import Head from "next/head";
import Footer from "@/components/web/footer";
import { Disclosure } from "@headlessui/react";
import { CheckIcon } from "lucide-react";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Plus as PlusSmallIcon,
  Minus as MinusSmallIcon,
  RefreshCw as ArrowPathIcon,
  GitPullRequestArrow as CloudArrowUpIcon,
  Settings as Cog6ToothIcon,
  Fingerprint as FingerPrintIcon,
  Lock as LockClosedIcon,
  HardDrive as ServerIcon,
} from "lucide-react";
import Link from "next/link";
import { LogoCloud } from "@/components/web/landing-page/logo-cloud";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/web/navbar";

const frequencies: {
  value: "monthly" | "annually";
  label: "Monthly" | "Annually";
  priceSuffix: "/month" | "/year";
}[] = [
  { value: "monthly", label: "Monthly", priceSuffix: "/month" },
  { value: "annually", label: "Annually", priceSuffix: "/year" },
];

const features = [
  {
    name: "Open Source",
    description:
      "This gives you the freedom to adapt and customize the tool to your specific needs.",
    icon: CloudArrowUpIcon,
  },
  {
    name: "Secure Document Sharing",
    description:
      "Papermark provides a secure platform to share your documents. ",
    icon: LockClosedIcon,
  },
  {
    name: "Real-Time Analytics",
    description:
      "Track all activity on each slide and get textual feedback on your deck",
    icon: ArrowPathIcon,
  },
  {
    name: "Custom Link Sharing",
    description: "Make your link memorable for all investors.",
    icon: FingerPrintIcon,
  },
  {
    name: "AI-powered",
    description:
      "Papermark leverages artificial intelligence to enhance its document sharing and tracking.",
    icon: Cog6ToothIcon,
  },
  {
    name: "Community Support",
    description:
      "Being an open-source project, Papermark is backed by a community of developers  ",
    icon: ServerIcon,
  },
];

const tiers: {
  name: string;
  id: string;
  href: string;
  price: {
    monthly: string;
    annually: string;
  };
  description: string;
  features: string[];
  bgColor: string;
  borderColor: string;
  textColor: string;
  buttonText: string;
  mostPopular: boolean;
}[] = [
  {
    name: "Papermark",
    id: "tier-free",
    href: "/login",
    price: { monthly: "$0", annually: "$144" },
    description: "Papermark plans start from freemium",
    features: [
      "Open Source",
      "Custom domain",
      "Advanced tracking system",
      "Work as a team",
      "Host by yourself",
      "Pitchdeck analytics",
    ],

    bgColor: "#fb7a00",
    borderColor: "#fb7a00",
    textColor: "#black",
    buttonText: "Start for free",
    mostPopular: false,
  },
  {
    name: "Docsend",
    id: "tier-freelancer",
    href: "/login",
    price: { monthly: "$15", annually: "$288" },
    description: "DocSend has no free plan available",
    features: [
      "Custom domain",
      "Pitchdeck feedback",
      "Hosting",
      "AI-recommendations",
      "Team access",
      "Hosting",
    ],
    bgColor: "bg-gray-100",
    borderColor: "#bg-gray-800",
    textColor: "#bg-gray-800",
    buttonText: "Start with DocSend alternative",
    mostPopular: false,
  },
];

const faqs = [
  {
    question: "What is Papermark?",
    answer:
      "Papermark is a dynamic, open-source alternative to DocSend. It enables secure document sharing, tracking, and storage, providing users with real-time analytics. Like your Pitchdeck.",
  },
  {
    question: "How can I use Papermark?",
    answer:
      "You can subscribe to one of our plans or use it for free and host it yourself. Simply visit our GitHub page, clone the repository, follow the setup instructions and start using Papermark. You can customize it according to your specific needs as it is open-source. https://github.com/mfts/papermark",
  },
  {
    question: "Is Papermark free?",
    answer:
      "Yes, Papermark is completely open-source. This means you are free to use, modify, and distribute it as you see fit according to the terms of our license.",
  },
  {
    question: "Can I add my custom domain to look professional?",
    answer:
      "Yes, with Papermark you can connect your custom domain and send your Pitchdeck or document via it. While continue tracking the analytics",
  },
  {
    question: "How I can reach more investors with Papermark?",
    answer:
      "Papermark has recommendations for more similar investors for your specific startup build in.",
  },
  {
    question: "How I can use Papermark as a VC?",
    answer:
      "You can use it to summarise and analyse data for different Pitchdecks",
  },
  {
    question: "Can I contribute to the Papermark project?",
    answer:
      "Yes, contributions are welcome! Please visit our GitHub repository to learn about how you can contribute. Whether it&apos;s by improving the code, adding new features, or even reporting bugs, all contributions are appreciated. https://github.com/mfts/papermark",
  },

  // More questions...
];

export default function DocsendPage() {
  const frequency = frequencies[0];
  return (
    <>
      <div>
        <Head>
          <title>
            Papermark: Best Free & Open-Source Alternative to DocSend
          </title>
          <meta
            name="description"
            content="Looking for DocSend alternatives? Papermark is the leading open-source alternative to DocSend. Enjoy secure document sharing, real-time analytics, and collaboration tools for free."
          />
          <meta
            property="og:title"
            content="Papermark: Best Free & Open-Source Alternative to DocSend"
          />
          <meta
            property="og:description"
            content="Looking for DocSend alternatives? Papermark is the leading open-source alternative to DocSend in 2024. Experience the advantages of secure document sharing, real-time analytics, and more."
          />
          <meta
            property="og:image"
            content="https://www.papermark.io/_static/meta-image.png"
          />
          <meta property="og:url" content="https://www.papermark.io" />
          <meta name="twitter:card" content="summary_large_image" />
        </Head>

        {/* Hero section */}
        <div className="flex flex-1 flex-col bg-white text-black justify-center">
          <Navbar />
          <div className="max-w-5xl w-full mx-auto px-4 md:px-8 text-center">
            <div className="pt-32">
              <div className=" pb-4">
                <img
                  src="https://www.papermark.io/_static/docsend/logo.png"
                  alt="App screenshot"
                  className="mx-auto"
                  width={150}
                  height={50}
                />
              </div>
              {/* <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-black ring-black/10  hover:ring-white/20">
                Free DocSend alternative
              </div> */}
              <h1 className="text-6xl text-balance">
                Open Source
                <br />
                DocSend alternative
              </h1>
              <p className="text-xl mt-8 text-balance max-w-3xl  mx-auto md:text-2xl">
                Powerful software to send PitchDeck and other documents with
                custom domain
              </p>
              <div className="pt-8 space-x-2">
                <Link href="/login">
                  <Button className="text-white bg-gray-800 rounded-3xl hover:bg-gray-500 justify-center">
                    Send document for free
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

            <div className="grid gap-16 md:gap-24 lg:gap-32 mt-20">
              <div className="mx-auto mt-4 w-full px-0 lg:px-8 xl:p-0">
                <LogoCloud />
              </div>
            </div>
          </div>
          {/* Comparison section */}
          <div className="max-w-5xl w-full mx-auto px-4 md:px-8">
            <div className="pt-32 pb-2">
              <h2 className="text-5xl  text-balance">
                Select Free
                <br />
                DocSend alternative
              </h2>
              <p className="text-xl mt-8 text-balance max-w-3xl">
                AI-powered platform revolutionizing document sharing and
                collaboration. It enables secure document sharing, tracking, and
                storage, providing users with real-time analytics
              </p>
            </div>
          </div>
          <div className="bg-white py-16">
            <div className="mx-auto max-w-5xl px-4 md:px-8">
              <div className="isolate grid  grid-cols-1  md:grid-cols-2  border border-black rounded-xl overflow-hidden">
                {tiers.map((tier) => (
                  <div
                    key={tier.id}
                    className="border-black border-r-0 md:odd:border-r xl:even:border-r xl:last:!border-r-0 flex flex-col justify-between"
                  >
                    <div>
                      <div className="border-b border-black p-6 bg-gray-100">
                        <h3
                          id={tier.id}
                          className="text-balance text-gray-800 text-xl leading-8"
                        >
                          {tier.name}
                        </h3>
                      </div>
                      <div className="p-6">
                        <p className="mt-4 text-sm leading-6 text-gray-500 text-balance">
                          {tier.description}
                        </p>
                        <p className="mt-6 flex items-baseline gap-x-1">
                          <span className="text-balance text-4xl font-medium  text-gray-800">
                            {tier.price[frequency.value]}
                          </span>
                          <span
                            className={cn(
                              "text-sm font-semibold leading-6 text-gray-500",
                              tier.id === "tier-enterprise" ? "hidden" : "",
                            )}
                          >
                            {frequency.priceSuffix}
                          </span>
                        </p>
                        <ul
                          role="list"
                          className="mt-8 space-y-3 text-sm leading-6 text-gray-500"
                        >
                          {tier.features.map((feature, index) => (
                            <li
                              key={index}
                              className="flex items-center gap-x-3"
                            >
                              {tier.id === "tier-free" ? (
                                <CheckIcon
                                  className="h-6 w-6 text-green-500"
                                  aria-hidden="true"
                                />
                              ) : (
                                <XIcon
                                  className="h-6 w-6 text-red-500"
                                  aria-hidden="true"
                                />
                              )}
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <a
                      href={tier.href}
                      aria-describedby={tier.id}
                      className="p-6"
                    >
                      <Button
                        className="rounded-3xl hover:bg-gray-100"
                        style={{
                          backgroundColor: tier.bgColor,
                          borderColor: tier.borderColor,
                          color: tier.textColor,
                          borderWidth: "1px", // Adjust as needed
                        }}
                      >
                        {tier.buttonText} {/* Use custom button text */}
                      </Button>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* /* Feature Section*/}

          <div
            className="w-full mx-auto max-w-5xl px-4 md:px-8 py-20"
            id="features"
          >
            <h2 className="text-4xl text-balance pt-12 pb-20 max-w-3xl">
              Share docs with ease{" "}
              <span className="text-gray-500">
                Share your document with custom domain and branding
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
                    <dt className="inline text-gray-500 text-xl">
                      {feature.name}
                    </dt>{" "}
                    <dd className="inline text-balance text-balance">
                      {feature.description}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
          {/* Testimonial section */}
          <div
            className="w-full mx-auto max-w-5xl px-4 md:px-8 py-20 bg-gray-100 rounded-3xl"
            id="features"
          >
            <div className="mx-auto flex flex-col items-center gap-x-8 gap-y-10 px-6 sm:gap-y-8 lg:px-8 xl:flex-row xl:items-stretch">
              <div className="-mt-8 w-full max-w-2xl xl:-mb-8 xl:w-96 xl:flex-none flex items-center justify-center">
                <div className="relative w-64 h-64">
                  {" "}
                  <img
                    className="absolute inset-0 object-cover rounded-2xl bg-gray-800  shadow-2xl"
                    src="https://www.papermark.io/_static/testimonials/jaski.jpeg"
                    alt=""
                  />
                </div>
              </div>
              <div className="w-full max-w-2xl xl:max-w-none xl:flex-auto xl:px-16 xl:py-24">
                <figure className="relative isolate pt-6 sm:pt-12">
                  <svg
                    viewBox="0 0 162 128"
                    fill="none"
                    aria-hidden="true"
                    className="absolute left-0 top-0 -z-10 h-32 stroke-white/20"
                  >
                    <path
                      id="b56e9dab-6ccb-4d32-ad02-6b4bb5d9bbeb"
                      d="M65.5697 118.507L65.8918 118.89C68.9503 116.314 71.367 113.253 73.1386 109.71C74.9162 106.155 75.8027 102.28 75.8027 98.0919C75.8027 94.237 75.16 90.6155 73.8708 87.2314C72.5851 83.8565 70.8137 80.9533 68.553 78.5292C66.4529 76.1079 63.9476 74.2482 61.0407 72.9536C58.2795 71.4949 55.276 70.767 52.0386 70.767C48.9935 70.767 46.4686 71.1668 44.4872 71.9924L44.4799 71.9955L44.4726 71.9988C42.7101 72.7999 41.1035 73.6831 39.6544 74.6492C38.2407 75.5916 36.8279 76.455 35.4159 77.2394L35.4047 77.2457L35.3938 77.2525C34.2318 77.9787 32.6713 78.3634 30.6736 78.3634C29.0405 78.3634 27.5131 77.2868 26.1274 74.8257C24.7483 72.2185 24.0519 69.2166 24.0519 65.8071C24.0519 60.0311 25.3782 54.4081 28.0373 48.9335C30.703 43.4454 34.3114 38.345 38.8667 33.6325C43.5812 28.761 49.0045 24.5159 55.1389 20.8979C60.1667 18.0071 65.4966 15.6179 71.1291 13.7305C73.8626 12.8145 75.8027 10.2968 75.8027 7.38572C75.8027 3.6497 72.6341 0.62247 68.8814 1.1527C61.1635 2.2432 53.7398 4.41426 46.6119 7.66522C37.5369 11.6459 29.5729 17.0612 22.7236 23.9105C16.0322 30.6019 10.618 38.4859 6.47981 47.558L6.47976 47.558L6.47682 47.5647C2.4901 56.6544 0.5 66.6148 0.5 77.4391C0.5 84.2996 1.61702 90.7679 3.85425 96.8404L3.8558 96.8445C6.08991 102.749 9.12394 108.02 12.959 112.654L12.959 112.654L12.9646 112.661C16.8027 117.138 21.2829 120.739 26.4034 123.459L26.4033 123.459L26.4144 123.465C31.5505 126.033 37.0873 127.316 43.0178 127.316C47.5035 127.316 51.6783 126.595 55.5376 125.148L55.5376 125.148L55.5477 125.144C59.5516 123.542 63.0052 121.456 65.9019 118.881L65.5697 118.507Z"
                    />
                    <use href="#b56e9dab-6ccb-4d32-ad02-6b4bb5d9bbeb" x={86} />
                  </svg>
                  <blockquote className="text-xl font-medium leading-8 text-balance  text-gray-800 text-black sm:text-2xl sm:leading-9">
                    <p>
                      True builders listen to their users and build what they
                      need. Thanks Papermark team for solving a big pain point.
                      DocSend monopoly will end soon!
                    </p>
                  </blockquote>
                  <figcaption className="mt-8 text-balance ">
                    <div className="font-semibold text-black ">Jaski</div>
                    <div className="mt-1 text-gray-500  ">
                      Founder in web3 space
                    </div>
                  </figcaption>
                </figure>
              </div>
            </div>
          </div>
          {/* FAQ section */}
          <div
            className="w-full mx-auto max-w-5xl px-4 md:px-8 py-32 "
            id="features"
          >
            <h2 className="text-4xl text-balance pt-6  max-w-3xl">
              FAQ{" "}
              <span className="text-gray-500">
                Everything you need to know about Papermark - DocSend
                alternative
              </span>
            </h2>
            <div className="">
              <dl className="mt-10 space-y-6 divide-y divide-gray-800/10 ">
                {faqs.map((faq) => (
                  <Disclosure as="div" key={faq.question} className="pt-6">
                    {({ open }) => (
                      <>
                        <dt>
                          <Disclosure.Button className="flex w-full items-start justify-between text-left text-gray-800">
                            <span className="text-balance  font-medium leading-7">
                              {faq.question}
                            </span>
                            <span className="ml-6 flex h-7 items-center">
                              {open ? (
                                <MinusSmallIcon
                                  className="h-6 w-6"
                                  aria-hidden="true"
                                />
                              ) : (
                                <PlusSmallIcon
                                  className="h-6 w-6"
                                  aria-hidden="true"
                                />
                              )}
                            </span>
                          </Disclosure.Button>
                        </dt>
                        <Disclosure.Panel as="dd" className="mt-2 pr-12">
                          <p className="text-balance leading-7 text-gray-500">
                            {faq.answer}
                          </p>
                        </Disclosure.Panel>
                      </>
                    )}
                  </Disclosure>
                ))}
              </dl>
            </div>
          </div>
          {/* CTA */}
          <div className="bg-[#fb7a00]">
            <div className="w-full mx-auto max-w-5xl py-32 px-4 md:px-8">
              <h2 className="text-4xl text-balance  ">
                Free and open source DocSend alternative.
              </h2>

              <div className="pt-8 space-x-2">
                <Link
                  href="https://cal.com/marcseitz/papermark"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="outline"
                    className="text-balance rounded-3xl bg-transparent border-black"
                  >
                    Book a demo
                  </Button>
                </Link>
                <Link href="/login">
                  <Button className="text-balance rounded-3xl">
                    Start for free
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div>
        <Footer />
      </div>
    </>
  );
}

import Head from "next/head";
import Footer from "@/components/web/footer";
import { Disclosure } from "@headlessui/react";
import { MinusSmallIcon, PlusSmallIcon } from "@heroicons/react/24/outline";
import {
  ArrowPathIcon,
  CloudArrowUpIcon,
  Cog6ToothIcon,
  FingerPrintIcon,
  LockClosedIcon,
  ServerIcon,
} from "@heroicons/react/20/solid";
import Link from "next/link";
import { classNames } from "@/lib/utils";

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

const tiers = [
  {
    // name: "Hobby",
    id: "tier-hobby",
    href: "#",
    priceMonthly: "Pitch",
    description: "Free version is not available",
    features: [
      "❌ Custom domain",
      "❌ Pitchdeck feedback",
      "❌ Secure sending",
      "❌ Advanced analytics",
      "❌ Team access",
      "❌ Hosting",
    ],
    featured: false,
  },
  {
    // name: "Enterprise",
    id: "tier-enterprise",
    href: "#",
    priceMonthly: "Papermark",
    description: "Free plan ",
    features: [
      "✅ Open Source",
      "✅ Custom domain",
      "✅ Advanced tracking system",
      "✅ Work as a team",
      "✅ Host by yourself",
      "✅ Pitchdeck analytics",
    ],
    featured: true,
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

export default function Home() {
  return (
    <div>
      <Head>
        <title>Papermark: Your Open-Source Pitch Alternative</title>
        <meta
          name="description"
          content="Looking for a superior alternative to the Pitch for sending deck? Explore Papermark, the open-source platform revolutionizing pitch presentation sharing with enhanced security and custom domains."
        />
        <meta
          property="og:title"
          content="Papermark: Your Open-Source Pitch Sending Deck Alternative"
        />
        <meta
          property="og:description"
          content="Discover Papermark: A game-changer in the world of pitch presentation sharing. As an open-source Pitch alternative for sending decks, it offers unrivaled security and the ability to use custom domains."
        />
        <meta
          property="og:image"
          content="https://www.papermark.io/_static/meta-image.png"
        />
        <meta property="og:url" content="https://www.papermark.io" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <main>
        {/* Hero section */}
        <div className="relative isolate overflow-hidden bg-white dark:bg-black pb-16 pt-14 sm:pb-20">
          <div
            className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
            aria-hidden="true"
          >
            <div
              className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
              style={{
                clipPath:
                  "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
              }}
            />
          </div>
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl py-12 sm:py-12 lg:py-32 ">
              <div className="hidden sm:mb-8 sm:flex sm:justify-center">
                <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-black dark:text-white ring-1 ring-black/10 dark:ring-white/10 hover:ring-white/20">
                  Free Pitch alternative
                </div>
              </div>
              <div className="text-center">
                <h1 className="text-4xl font-bold tracking-tight text-black dark:text-white sm:text-6xl">
                  Open Source Pitch alternative
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-500">
                  Powerful software to send PitchDeck with custom domain
                </p>
                <div className="mt-10 flex items-center justify-center gap-x-6">
                  <Link
                    className="rounded-md bg-black dark:bg-white px-3.5 py-2.5 text-sm font-semibold text-white dark:text-black shadow-sm hover:bg-gray-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
                    href="/login"
                  >
                    Send your deck
                  </Link>
                </div>
              </div>
            </div>

            {/* Pricing section */}
            <div className="relative isolate mt-32  px-6 sm:mt-36 lg:px-8">
              <div
                className="absolute inset-x-0 -top-3 -z-10 transform-gpu overflow-hidden px-36 blur-3xl"
                aria-hidden="true"
              >
                <div
                  className="mx-auto aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30"
                  style={{
                    clipPath:
                      "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
                  }}
                />
              </div>
              <div className="mx-auto max-w-2xl text-center lg:max-w-4xl">
                <h2 className="text-base font-semibold leading-7 text-black dark:text-white">
                  Feature comparison
                </h2>
                <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
                  Select Free Pitch alternative
                </p>
              </div>
              <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-gray-500 dark:text-gray-400">
                AI-powered platform revolutionizing document sharing and
                collaboration. It enables secure document sharing, tracking, and
                storage, providing users with real-time analytics.
              </p>
              <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 gap-x-6 items-center gap-y-6 sm:mt-20 sm:gap-y-0 lg:max-w-4xl lg:grid-cols-2">
                {tiers.map((tier, tierIdx) => (
                  <div
                    key={tier.id}
                    className={classNames(
                      tier.featured
                        ? " text-gray-800 dark:text-white relative shadow-2xl"
                        : " bg-white dark:bg-transparent sm:mx-8 lg:mx-0",
                      tier.featured
                        ? ""
                        : tierIdx === 0
                          ? "text-gray-800 dark:text-white rounded-t-3xl lg:rounded-bl-3xl"
                          : "bg-black dark:bg-transparent sm:rounded-t-none lg:rounded-tr-3xl lg:rounded-bl-none",
                      "rounded-3xl p-8 ring-1 ring-gray-900/10 dark:ring-gray-200/10 sm:p-10",
                    )}
                  >
                    <p className="mt-4 flex items-baseline gap-x-2">
                      <span
                        className={classNames(
                          tier.featured
                            ? "text-gray-800 dark:text-white"
                            : "text-gray-800 dark:text-gray-400",
                          "text-5xl font-bold tracking-tight",
                        )}
                      >
                        {tier.priceMonthly}
                      </span>
                      <span
                        className={classNames(
                          tier.featured
                            ? "text-gray-600 dark:text-white"
                            : "text-gray-400 dark:text-gray-100",
                          "text-base",
                        )}
                      ></span>
                    </p>
                    <p
                      className={classNames(
                        tier.featured
                          ? "text-gray-600 dark:text-gray-300"
                          : "text-gray-600 dark:text-gray-400",
                        "mt-6 text-base leading-7",
                      )}
                    >
                      {tier.description}
                    </p>
                    <ul
                      role="list"
                      className={classNames(
                        tier.featured
                          ? "text-gray-600 dark:text-gray-300"
                          : "text-gray-600 dark:text-gray-400",
                        "mt-8 space-y-3 text-sm leading-6 sm:mt-10",
                      )}
                    >
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex gap-x-3">
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/login"
                      aria-describedby={tier.id.toString()}
                      className={classNames(
                        tier.featured
                          ? "bg-black dark:bg-white text-white dark:text-black shadow-sm hover:bg-gray-500 focus:ring-2 focus:ring-indigo-500"
                          : "text-transparent ring-1 ring-inset ring-transparent focus:ring-2 focus:ring-indigo-600",
                        "mt-8 block rounded-md py-2.5 px-3.5 text-center text-sm font-semibold",
                      )}
                    >
                      Send Document
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature section */}
            <div className="mt-32 sm:mt-56">
              <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl sm:text-center">
                  <h2 className="text-base font-semibold leading-7 text-black dark:texxt-white">
                    Share docs with ease
                  </h2>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-black dark:text-white sm:text-4xl">
                    Share your Deck on custom domain
                  </p>
                  <p className="mt-6 text-lg leading-8 text-gray-500">
                    Free and open source Pitch alternative. Advanced analytics
                    and recommendations for VC funds to share your deck.
                  </p>
                </div>
              </div>
              <div className="relative overflow-hidden pt-16">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                  <img
                    src="https://www.papermark.io/_static/papermark.png"
                    alt="App screenshot"
                    className="mb-[-12%] rounded-xl shadow-2xl ring-1 ring-gray-900/10"
                    width={2432}
                    height={1442}
                  />
                  <div className="relative" aria-hidden="true">
                    <div className="absolute -inset-x-20 bottom-0 bg-gradient-to-t from-black pt-[7%]" />
                  </div>
                </div>
              </div>
              <div className="mx-auto mt-16 max-w-7xl px-6 sm:mt-20 md:mt-24 lg:px-8">
                <dl className="mx-auto grid max-w-2xl grid-cols-1 gap-x-6 gap-y-10 text-base leading-7 text-gray-500 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-x-8 lg:gap-y-16">
                  {features.map((feature) => (
                    <div key={feature.name} className="relative pl-9">
                      <dt className="inline font-semibold text-gray-600 dark:text-gray-200">
                        <feature.icon
                          className="absolute left-1 top-1 h-5 w-5 text-black dark:text-white"
                          aria-hidden="true"
                        />
                        {feature.name}
                      </dt>{" "}
                      <dd className="inline">{feature.description}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            {/* Testimonial section */}
            <div className="relative z-10 mt-32 bg-white dark:bg-gray-900 pb-20 sm:mt-56 sm:pb-24 xl:pb-0">
              <div
                className="absolute inset-0 overflow-hidden"
                aria-hidden="true"
              >
                <div className="absolute left-[calc(50%-19rem)] top-[calc(50%-36rem)] transform-gpu blur-3xl">
                  <div
                    className="aspect-[1097/1023] w-[68.5625rem] bg-gradient-to-r from-[#ff4694] to-[#776fff] opacity-25"
                    style={{
                      clipPath:
                        "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
                    }}
                  />
                </div>
              </div>
              <div className="mx-auto flex max-w-7xl flex-col items-center gap-x-8 gap-y-10 px-6 sm:gap-y-8 lg:px-8 xl:flex-row xl:items-stretch">
                <div className="-mt-8 w-full max-w-2xl xl:-mb-8 xl:w-96 xl:flex-none flex items-center justify-center">
                  <div className="relative w-64 h-64">
                    {" "}
                    <img
                      className="absolute inset-0 object-cover rounded-2xl bg-gray-800  shadow-2xl"
                      src="https://pbs.twimg.com/profile_images/1506792347840888834/dS-r50Je_400x400.jpg"
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
                      <use
                        href="#b56e9dab-6ccb-4d32-ad02-6b4bb5d9bbeb"
                        x={86}
                      />
                    </svg>
                    <blockquote className="text-xl font-semibold leading-8 text-gray-800 dark:text-white sm:text-2xl sm:leading-9">
                      <p>
                        This looks awesome!! Incredible work – love how the link
                        was automatically copied to clipboard when it&apos;s
                        created.
                      </p>
                    </blockquote>
                    <figcaption className="mt-8 text-base">
                      <div className="font-semibold text-black dark:text-white">
                        Steven Tey
                      </div>
                      <div className="mt-1 text-gray-500">
                        Senior Developer Advocate at Vercel
                      </div>
                    </figcaption>
                  </figure>
                </div>
              </div>
            </div>

            {/* FAQ section */}
            <div className="mx-auto mt-24 max-w-7xl px-6 sm:mt-32 lg:px-8">
              <div className="mx-auto max-w-4xl divide-y divide-gray-900/10">
                <h2 className="text-2xl font-bold leading-10 tracking-tight text-white">
                  Frequently asked questions
                </h2>
                <dl className="mt-10 space-y-6 divide-y divide-gray-900/10 dark:divide-gray-200/10">
                  {faqs.map((faq) => (
                    <Disclosure as="div" key={faq.question} className="pt-6">
                      {({ open }) => (
                        <>
                          <dt>
                            <Disclosure.Button className="flex w-full items-start justify-between text-left text-gray-900 dark:text-gray-200">
                              <span className="text-base font-semibold leading-7">
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
                            <p className="text-base leading-7 text-gray-500">
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
          </div>
        </div>
        <div>
          <Footer />
        </div>
      </main>
    </div>
  );
}

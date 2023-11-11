import Footer from "@/components/web/footer";
import Navbar from "@/components/web/navbar";
import Link from "next/link";
import Head from "next/head";

export default function Pricing() {
  const tiers = [
    {
      id: 1,
      title: "Free",
      priceMonthly: "$0/mo",
      description: "Enjoy free access",
      features: [
        "PDF up to 30 mb",
        "Unlimited links",
        "Analytics for each page",
        "Feedback on each page",
        "Email Notifications on views",
      ],
    },
    {
      id: 2,
      title: "Pro",
      priceMonthly: "$29/mo",
      description: "Use all freemium features+ ",
      features: [
        "Team members",
        "Custom domains",
        "Unlimited documents",
        "Large file uploads",
        "Full customization",
      ],
    },
    {
      id: 3,
      title: "Contact us",
      priceMonthly: "Custom",
      description: "Get more perfect plan for you",
      features: [
        "Priority Support",
        "Full customization",
        "Separate Hosting",
        "Custom features request",
        "Personal Onboarding",
      ],
    },
  ];

  return (
    <>
      <Head>
        <title>
          Papermark | How to launch Open Source project on Product Hunt?
        </title>
        <meta
          name="description"
          content="How to launch Open Source project on Product Hunt? Best tips to launch on Product Hunt and get first place"
        />
        <meta
          property="og:title"
          content="How to launch Open Source project on Product Hunt?"
        />
        <meta
          property="og:description"
          content="How to launch Open Source project on Product Hunt? Best tips to launch on Product Hunt and get first place"
        />
        <meta
          property="og:image"
          content="https://dev-to-uploads.s3.amazonaws.com/uploads/articles/fejivoe3vst4rsdzjblo.png"
        />
        <meta property="og:url" content="https://www.papermark.io" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <Navbar />

      <div className="min-h-screen bg-white text-black py-20">
        <Head>
          <title>Pricing Page</title>
        </Head>

        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center lg:max-w-4xl">
            <p className="mt-16 text-4xl font-bold tracking-tight text-gray-900  sm:text-5xl">
              Pricing
            </p>
          </div>

          <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-gray-500 ">
            Share your Pitch Deck, Sales Deck and oher documents and monitor
            results on any suitable for you plan. You always can start open
            source
          </p>

          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-6 items-center sm:grid-cols-3 sm:gap-4">
            {tiers.map((tier) => (
              <div
                key={tier.id}
                className="rounded-3xl p-8 ring-1 ring-gray-900/10  sm:p-10"
              >
                <h2 className="text-xl font-bold mb-4">{tier.title}</h2>
                <div className="text-3xl font-bold mb-4">
                  {tier.priceMonthly}
                </div>
                <div className="text-gray-900  mb-6">{tier.description}</div>
                {tier.features.map((feature) => (
                  <div key={feature} className="flex items-center mb-2">
                    <svg
                      className="h-5 w-5 text-green-500 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                    {feature}
                  </div>
                ))}
                <div className="mt-6 flex items-center justify-center gap-x-6">
                  {tier.id === 1 && (
                    <Link
                      href="/login?next=/settings/billing"
                      className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-black shadow-sm border-2 border-gray-700 hover:bg-gray-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                      Start for free
                    </Link>
                  )}
                  {tier.id === 2 && (
                    <Link
                      href="/login"
                      className="rounded-md bg-black px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                      Start for free
                    </Link>
                  )}
                  {tier.id === 3 && (
                    <Link
                      href="https://cal.com/marcseitz/papermark"
                      target="_blank"
                      className="rounded-md bg-black px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                      Contact us
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}

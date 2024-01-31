import Footer from "@/components/web/footer";
import Navbar from "@/components/web/navbar";
import Link from "next/link";
import Head from "next/head";

export default function Pricing() {
  const tiers = [
    {
      id: 1,
      title: "Free",
      priceMonthly: "€0/mo",
      description: "What's included:",
      features: [
        "Unlimited links",
        "30 MB document size limit",
        "Notion documents",
        "1 user",
        "Basic support",
        "Email notifications",
        "Basic Papermark AI",
        "100 credits, 3/day",
      ],
    },
    {
      id: 2,
      title: "Pro",
      priceMonthly: "€29/mo",
      description: "Everything in Free, plus:",
      features: [
        "Unlimited documents",
        "Large file uploads",
        "Team members",
        "Priority support",
        "Custom domains",
        "Custom branding",
        "Advanced Papermark AI",
        "1500 credits",
      ],
    },
    {
      id: 3,
      title: "Enterprise",
      priceMonthly: "Get in touch",
      description: "Custom tailored plans, incl.:",
      features: [
        "Up to 5TB file uploads",
        "Dedicated support",
        "Custom Papermark AI / BYO",
        "Unlimited credits",
      ],
    },
  ];

  return (
    <>
      <Head>
        <title>Papermark | Pricing</title>
      </Head>
      <Navbar />

      <div className="min-h-screen bg-white text-black py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center lg:max-w-4xl">
            <p className="mt-16 text-4xl font-bold tracking-tight text-gray-900  sm:text-5xl">
              Pricing
            </p>
          </div>

          <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-gray-500 ">
            Share your Pitch Deck, Sales Deck and other documents and monitor
            results on any suitable for you plan. You always can start
            <Link
              href="https://github.com/mfts/papermark"
              target="_blank"
              rel="noopener noreferrer"
              className="text-black hover:underline"
            >
              {" "}
              open source{" "}
            </Link>
            or
            <Link
              href="https://cal.com/marcseitz/papermark"
              target="_blank"
              rel="noopener noreferrer"
              className="text-black hover:underline"
            >
              {" "}
              contact us{" "}
            </Link>
            for custom requests, like self hosting, customization and AI
            document comparison.
          </p>

          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-6 items-stretch sm:grid-cols-3 sm:gap-4">
            {tiers.map((tier) => (
              <div
                key={tier.id}
                className="flex flex-col rounded-3xl p-8 ring-1 ring-gray-900/10 sm:p-10"
              >
                <h2 className="text-xl font-bold mb-4">{tier.title}</h2>
                <div className="text-3xl font-bold mb-4">
                  {tier.priceMonthly}
                </div>
                <div className="text-gray-900  mb-6">{tier.description}</div>
                <div className="flex-grow">
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
                </div>
                <div className="mt-6 flex items-center justify-center gap-x-6">
                  {tier.id === 1 && (
                    <Link
                      href="/login"
                      className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-black shadow-sm border-2 border-gray-700 hover:bg-gray-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                      Start for free
                    </Link>
                  )}
                  {tier.id === 2 && (
                    <Link
                      href="/login?next=/settings/billing"
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

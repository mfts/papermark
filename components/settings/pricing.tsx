import React from "react";
import Link from "next/link";

interface Tier {
  id: number;
  title: string;
  priceMonthly: string;
  description: string;
  features: string[];
}

const tiers: Tier[] = [
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

export default function PricingComponent() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-black dark:text-white py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center lg:max-w-4xl"></div>

        <div className="mx-auto mt-6 grid max-w-5xl grid-cols-1 gap-6 items-center sm:grid-cols-3 sm:gap-4">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className="rounded-3xl p-8 ring-1 ring-gray-900/10 dark:ring-gray-200/10 sm:p-10 bg-white dark:bg-gray-800"
            >
              <h2 className="text-xl font-bold mb-4">{tier.title}</h2>
              <div className="text-3xl font-bold mb-4">{tier.priceMonthly}</div>
              <div className="text-gray-900 dark:text-gray-400 mb-6">
                {tier.description}
              </div>
              {tier.features.map((feature) => (
                <div key={feature} className="flex items-center mb-2">
                  <svg
                    className="h-5 w-5 text-green-500 dark:text-green-300 mr-2"
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
                    href="/login"
                    className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-black shadow-sm border-2 border-gray-700 hover:bg-gray-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:text-black dark:bg-white"
                  >
                    Start for free
                  </Link>
                )}
                {tier.id === 2 && (
                  <Link
                    href="/login"
                    className="rounded-md bg-black px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:text-black dark:bg-white "
                  >
                    Start for free
                  </Link>
                )}
                {tier.id === 3 && (
                  <Link
                    href="/login"
                    className="rounded-md bg-black px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:text-black dark:bg-white"
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
  );
}

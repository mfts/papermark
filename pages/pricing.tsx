import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckIcon } from "lucide-react";
import Navbar from "@/components/web/navbar";
import Footer from "@/components/web/footer";
import Link from "next/link";
const frequencies = [
  { value: "monthly", label: "Monthly", priceSuffix: "/month" },
  { value: "annually", label: "Annually", priceSuffix: "/year" },
];
const tiers = [
  {
    name: "Free",
    id: "tier-free",
    href: "/login",
    price: { monthly: "€0", annually: "$144" },
    description: "The essentials to start sharing documents securely",
    features: [
      "1 user",
      "Unlimited links",
      "Analytics for each page",
      "Document sharing controls",
    ],

    bgColor: "bg-gray-200",
    borderColor: "#bg-gray-800",
    textColor: "#bg-gray-800",
    buttonText: "Start for free",
    mostPopular: false,
  },
  {
    name: "Pro",
    id: "tier-freelancer",
    href: "/login",
    price: { monthly: "€29", annually: "$288" },
    description:
      "The essentials to build data room and advanced document management.",
    features: [
      "Everything in Free, plus:",
      "Up to 3 active user",
      "Data Room",
      "Custom domain",
      "Papermark AI",
    ],
    bgColor: "bg-gray-200",
    borderColor: "#bg-gray-800",
    textColor: "#bg-gray-800",
    buttonText: "Start for free",
    mostPopular: false,
  },
  {
    name: "Business",
    id: "tier-startup",
    href: "/login",
    price: { monthly: "€79", annually: "$576" },
    description: "A plan that scales with your rapidly growing business.",
    features: [
      "Everything in Team, plus:",
      "Up to 10 active users",
      "Advanced Data Room controls",
      "Large file uploads",
      "Custom Branding",
      "24h Priority Support",
    ],
    bgColor: "#fb7a00",
    borderColor: "#fb7a00",
    textColor: "#black",
    buttonText: "Start for free",
    mostPopular: true,
  },
  {
    name: "Enterprise",
    id: "tier-enterprise",
    href: "https://cal.com/marcseitz/papermark",
    price: { monthly: "Custom", annually: "$864" },
    description: "Self-hosted and advanced infrastructure for your company.",
    features: [
      "Self-Hosted version",
      "Unlimited users",
      "Unlimited documents",
      "Different file types",
      "Up to 5TB file uploads",
      "Dedicated support",
      "Custom Papermark AI",
    ],
    bgColor: "bg-gray-200",
    borderColor: "#bg-gray-800",
    textColor: "#bg-gray-800",
    buttonText: "Book a demo",
    mostPopular: false,
  },
];
export default function PricingPage() {
  const frequency = frequencies[0];
  return (
    <>
      <div className="flex flex-1 flex-col bg-white text-black">
        <Navbar />
        <div className="max-w-7xl w-full mx-auto px-4 md:px-8">
          <div className="pt-32 pb-2">
            <h1 className="text-4xl md:text-6xl text-balance">
              Find the plan that
              <br />
              works for you
            </h1>
            {/* <p className="text-xl mt-8 text-balance max-w-3xl">
              Papermark is an open-source document sharing infrastructure with
              built-in page analytics and custom domains.
            </p> */}
            {/* <div className="pt-8 space-x-2">
              <Link
                href="https://cal.com/marcseitz/papermark"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="outline"
                  className="text-base rounded-3xl bg-transparent border-black"
                >
                  Help with pricing
                </Button>
              </Link>
              <Link href="/login">
                <Button className="text-base bg-[#fb7a00] rounded-3xl">
                  Start free
                </Button>
              </Link>
            </div> */}
          </div>
        </div>
        <div className="bg-white py-16">
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <div className="isolate grid  grid-cols-1  md:grid-cols-2  xl:grid-cols-4 border border-black rounded-xl overflow-hidden">
              {tiers.map((tier) => (
                <div
                  key={tier.id}
                  className="border-black border-r-0 md:odd:border-r xl:even:border-r xl:last:!border-r-0 flex flex-col justify-between"
                >
                  <div>
                    <div className="border-b border-black p-6 bg-gray-100">
                      <h3
                        id={tier.id}
                        className="text-balance text-gray-900 text-xl leading-8"
                      >
                        {tier.name}
                      </h3>
                    </div>
                    <div className="p-6">
                      <p className="mt-4 text-sm leading-6 text-gray-600 text-balance">
                        {tier.description}
                      </p>
                      <p className="mt-6 flex items-baseline gap-x-1">
                        <span className="text-balance text-4xl font-medium  text-gray-900">
                          {tier.price[frequency.value]}
                        </span>
                        <span
                          className={cn(
                            "text-sm font-semibold leading-6 text-gray-600",
                            tier.id === "tier-enterprise" ? "hidden" : "",
                          )}
                        >
                          {frequency.priceSuffix}
                        </span>
                      </p>
                      <ul
                        role="list"
                        className="mt-8 space-y-3 text-sm leading-6 text-gray-600"
                      >
                        {tier.features.map((feature) => (
                          <li key={feature} className="flex gap-x-3">
                            <CheckIcon
                              className="h-6 w-5 flex-none text-[#fb7a00]"
                              aria-hidden="true"
                            />
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
        <div className="bg-[#fb7a00] rounded-3xl xl:mx-20 md:mx-8 ">
          <div className="w-full mx-auto max-w-7xl py-12 px-4 md:px-8">
            <h2 className="text-4xl text-balance  ">
              Looking to self host your data room?
            </h2>
            <div className="pt-8 space-x-2">
              <Link
                href="https://cal.com/marcseitz/papermark"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="text-gray-200 bg-black rounded-3xl hover:bg-gray-900">
                  Book a demo
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

// import Footer from "@/components/web/footer";
// import Navbar from "@/components/web/navbar";
// import Link from "next/link";
// import Head from "next/head";

// export default function Pricing() {
//   const tiers = [
//     {
//       id: 1,
//       title: "Free",
//       priceMonthly: "€0/mo",
//       description: "What's included:",
//       features: [
//         "Unlimited links",
//         "30 MB document size limit",
//         "Notion documents",
//         "1 user",
//         "Basic support",
//         "Email notifications",
//         "Basic Papermark AI",
//         "100 credits, 3/day",
//       ],
//     },
//     {
//       id: 2,
//       title: "Pro",
//       priceMonthly: "€29/mo",
//       description: "Everything in Free, plus:",
//       features: [
//         "Unlimited documents",
//         "Large file uploads",
//         "Team members",
//         "Priority support",
//         "Custom domains",
//         "Custom branding",
//         "Advanced Papermark AI",
//         "1500 credits",
//       ],
//     },
//     {
//       id: 3,
//       title: "Enterprise",
//       priceMonthly: "Get in touch",
//       description: "Custom tailored plans, incl.:",
//       features: [
//         "Up to 5TB file uploads",
//         "Dedicated support",
//         "Custom Papermark AI / BYO",
//         "Unlimited credits",
//       ],
//     },
//   ];

//   return (
//     <>
//       <Head>
//         <title>Papermark | Pricing</title>
//       </Head>
//       <Navbar />

//       <div className="min-h-screen bg-white text-black py-20">
//         <div className="container mx-auto px-4">
//           <div className="mx-auto max-w-2xl text-center lg:max-w-4xl">
//             <p className="mt-16 text-4xl font-bold tracking-tight text-gray-900  sm:text-5xl">
//               Pricing
//             </p>
//           </div>

//           <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-gray-500 ">
//             Share your Pitch Deck, Sales Deck and other documents and monitor
//             results on any suitable for you plan. You always can start
//             <Link
//               href="https://github.com/mfts/papermark"
//               target="_blank"
//               rel="noopener noreferrer"
//               className="text-black hover:underline"
//             >
//               {" "}
//               open source{" "}
//             </Link>
//             or
//             <Link
//               href="https://cal.com/marcseitz/papermark"
//               target="_blank"
//               rel="noopener noreferrer"
//               className="text-black hover:underline"
//             >
//               {" "}
//               contact us{" "}
//             </Link>
//             for custom requests, like self hosting, customization and AI
//             document comparison.
//           </p>

//           <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-6 items-stretch sm:grid-cols-3 sm:gap-4">
//             {tiers.map((tier) => (
//               <div
//                 key={tier.id}
//                 className="flex flex-col rounded-3xl p-8 ring-1 ring-gray-900/10 sm:p-10"
//               >
//                 <h2 className="text-xl font-bold mb-4">{tier.title}</h2>
//                 <div className="text-3xl font-bold mb-4">
//                   {tier.priceMonthly}
//                 </div>
//                 <div className="text-gray-900  mb-6">{tier.description}</div>
//                 <div className="flex-grow">
//                   {tier.features.map((feature) => (
//                     <div key={feature} className="flex items-center mb-2">
//                       <svg
//                         className="h-5 w-5 text-green-500 mr-2"
//                         fill="none"
//                         stroke="currentColor"
//                         viewBox="0 0 24 24"
//                         xmlns="http://www.w3.org/2000/svg"
//                       >
//                         <path
//                           strokeLinecap="round"
//                           strokeLinejoin="round"
//                           strokeWidth="2"
//                           d="M5 13l4 4L19 7"
//                         ></path>
//                       </svg>
//                       {feature}
//                     </div>
//                   ))}
//                 </div>
//                 <div className="mt-6 flex items-center justify-center gap-x-6">
//                   {tier.id === 1 && (
//                     <Link
//                       href="/login"
//                       className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-black shadow-sm border-2 border-gray-700 hover:bg-gray-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
//                     >
//                       Start for free
//                     </Link>
//                   )}
//                   {tier.id === 2 && (
//                     <Link
//                       href="/login?next=/settings/billing"
//                       className="rounded-md bg-black px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
//                     >
//                       Start for free
//                     </Link>
//                   )}
//                   {tier.id === 3 && (
//                     <Link
//                       href="https://cal.com/marcseitz/papermark"
//                       target="_blank"
//                       className="rounded-md bg-black px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
//                     >
//                       Contact us
//                     </Link>
//                   )}
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       <Footer />
//     </>
//   );
// }

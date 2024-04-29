import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckIcon } from "lucide-react";
import Navbar from "@/components/web/navbar";
import Footer from "@/components/web/footer";
import Link from "next/link";
import GitHubIcon from "@/components/shared/icons/github";
import { usePlausible } from "next-plausible";
import { PricingComparison } from "@/components/web/pricing-component";
import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";

const frequencies: {
  value: "monthly" | "annually";
  label: "Monthly" | "Annually";
  priceSuffix: "/month" | "/month";
}[] = [
  { value: "monthly", label: "Monthly", priceSuffix: "/month" },
  { value: "annually", label: "Annually", priceSuffix: "/month" },
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
  featureIntro: string;
  features: string[];
  bgColor: string;
  borderColor: string;
  textColor: string;
  buttonText: string;
  mostPopular: boolean;
}[] = [
  {
    name: "Free",
    id: "tier-free",
    href: "/login",
    price: { monthly: "€0", annually: "€0" },
    description: "The essentials to start sharing documents securely.",
    featureIntro: "What's included:",
    features: [
      "1 user",
      "Unlimited links",
      "Page-by-page analytics",
      "30-day analytics retention",
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
    id: "tier-pro",
    href: "/login",
    price: { monthly: "€39", annually: "€25" },
    description: "The branded experience for your documents.",
    featureIntro: "Everything in Free, plus:",
    features: [
      "2 users",
      "Custom slug",
      "Custom branding",
      "1-year analytics retention",
      "Advanced access controls",
      "Folder organization",
    ],
    bgColor: "bg-gray-200",
    borderColor: "#bg-gray-800",
    textColor: "#bg-gray-800",
    buttonText: "Choose Pro",
    mostPopular: false,
  },
  {
    name: "Business",
    id: "tier-business",
    href: "/login",
    price: { monthly: "€79", annually: "€59" },
    description: "The one for more control, data room, and multi-file sharing.",
    featureIntro: "Everything in Pro, plus:",
    features: [
      "3 users",
      "1 dataroom",
      "Multi-file sharing",
      "Custom domain",
      "Unlimited documents",
      "Unlimited subfolder levels",
      "Large file uploads",
      "48h Priority Support",
    ],
    bgColor: "#fb7a00",
    borderColor: "#fb7a00",
    textColor: "#black",
    buttonText: "Choose Business",
    mostPopular: true,
  },
  {
    name: "Enterprise",
    id: "tier-enterprise",
    href: "https://cal.com/marcseitz/papermark",
    price: { monthly: "Custom", annually: "Custom" },
    description: "Self-hosted and advanced infrastructure for your company.",
    featureIntro: "Tailored solutions:",
    features: [
      "Self-hosted version",
      "Unlimited users",
      "Unlimited documents",
      "Unlimited folders and subfolders",
      "Unlimited data rooms",
      "Full white-labeling",
      "Up to 5TB file uploads",
      "Dedicated support",
      "Custom Onboarding",
    ],
    bgColor: "bg-gray-200",
    borderColor: "#bg-gray-800",
    textColor: "#bg-gray-800",
    buttonText: "Book a demo",
    mostPopular: false,
  },
];

export default function PricingPage() {
  const plausible = usePlausible();
  const frequency = frequencies[1];

  const [toggleProYear, setToggleProYear] = useState<boolean>(true);
  const [toggleBusinessYear, setToggleBusinessYear] = useState<boolean>(true);
  const [frequencyPro, setFrequencyPro] = useState(frequencies[0]);
  const [frequencyBusiness, setFrequencyBusiness] = useState(frequencies[0]);

  useEffect(() => {
    if (toggleProYear) {
      setFrequencyPro(frequencies[1]);
    } else {
      setFrequencyPro(frequencies[0]);
    }

    if (toggleBusinessYear) {
      setFrequencyBusiness(frequencies[1]);
    } else {
      setFrequencyBusiness(frequencies[0]);
    }
  }, [toggleProYear, toggleBusinessYear]);

  return (
    <>
      <div className="flex flex-1 flex-col bg-white text-black">
        <Navbar />
        <div className="max-w-7xl w-full mx-auto px-4 md:px-8">
          <div className="pt-24 pb-2">
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
            <div className="isolate grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 border border-black rounded-xl overflow-hidden">
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
                      <div className="mt-2 min-h-20">
                        {tier.id === "tier-free" ? (
                          <div className="min-h-12">
                            <div className="flex flex-col text-sm">
                              <div className="h-6"></div>
                              <h4>No credit card required</h4>
                            </div>
                          </div>
                        ) : null}
                        {tier.id === "tier-pro" ? (
                          <div className="min-h-12">
                            <Switch
                              className="h-5 w-10 *:size-4"
                              checked={toggleProYear}
                              onCheckedChange={() =>
                                setToggleProYear(!toggleProYear)
                              }
                            />
                            <div className="flex items-center gap-x-1 text-sm mb-1">
                              <span
                                className={cn(
                                  toggleProYear
                                    ? "text-gray-400"
                                    : "text-black",
                                )}
                              >
                                Monthly
                              </span>
                              <span>|</span>
                              <span
                                className={cn(
                                  toggleProYear
                                    ? "text-black"
                                    : "text-gray-400",
                                )}
                              >
                                Annually
                              </span>
                            </div>
                            <div
                              className={cn(
                                "relative text-xs w-fit uppercase border border-gray-900 text-gray-900 rounded-3xl px-1.5 py-0.5",
                                !toggleProYear &&
                                  "border-gray-400 text-gray-400 opacity-40",
                              )}
                            >
                              <span
                                className={cn(
                                  !toggleProYear
                                    ? "absolute top-1/2 h-px w-[90%] bg-gray-400"
                                    : "hidden",
                                )}
                              />
                              35% Saving
                            </div>
                          </div>
                        ) : null}
                        {tier.id === "tier-business" ? (
                          <div className="min-h-12">
                            <Switch
                              className="h-5 w-10 *:size-4"
                              checked={toggleBusinessYear}
                              onCheckedChange={() =>
                                setToggleBusinessYear(!toggleBusinessYear)
                              }
                            />
                            <div className="flex items-center gap-x-1 text-sm mb-1">
                              <span
                                className={cn(
                                  toggleBusinessYear
                                    ? "text-gray-400"
                                    : "text-black",
                                )}
                              >
                                Monthly
                              </span>
                              <span>|</span>
                              <span
                                className={cn(
                                  toggleBusinessYear
                                    ? "text-black"
                                    : "text-gray-400",
                                )}
                              >
                                Annually
                              </span>
                            </div>
                            <div
                              className={cn(
                                "relative text-xs w-fit uppercase border border-[#fb7a00] text-[#fb7a00] rounded-3xl px-1.5 py-0.5",
                                !toggleBusinessYear &&
                                  "border-gray-400 text-gray-400 opacity-40",
                              )}
                            >
                              <span
                                className={cn(
                                  !toggleBusinessYear
                                    ? "absolute top-1/2 h-px w-[90%] bg-gray-400"
                                    : "hidden",
                                )}
                              />
                              25% Saving
                            </div>
                          </div>
                        ) : null}
                        {tier.id === "tier-enterprise" ? (
                          <div className="min-h-12">
                            <div className="flex flex-col text-sm">
                              <div className="h-6"></div>
                              <h4>Get in touch</h4>
                            </div>
                          </div>
                        ) : null}
                      </div>
                      <p className="mt-6 flex items-baseline gap-x-1">
                        <span
                          className="text-balance text-4xl font-medium text-gray-900"
                          style={{ fontVariantNumeric: "tabular-nums" }}
                        >
                          {tier.id === "tier-pro"
                            ? tier.price[frequencyPro.value]
                            : tier.id === "tier-business"
                              ? tier.price[frequencyBusiness.value]
                              : tier.price[frequency.value]}
                        </span>
                        <span
                          className={cn(
                            "text-sm font-semibold leading-6 text-gray-600",
                            tier.id === "tier-enterprise" ? "hidden" : "",
                          )}
                        >
                          {tier.id === "tier-pro"
                            ? frequencyPro.priceSuffix
                            : tier.id === "tier-business"
                              ? frequencyBusiness.priceSuffix
                              : frequency.priceSuffix}
                        </span>
                      </p>
                      <p className="mt-6 text-sm leading-6 text-gray-600 text-balance">
                        {tier.description}
                      </p>
                      <ul
                        role="list"
                        className="mt-8 space-y-3 text-sm leading-6 text-gray-600"
                      >
                        <li>{tier.featureIntro}</li>
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
                  <div className="p-6">
                    <Link
                      href={tier.href}
                      onClick={() => {
                        plausible("clickedPricing", {
                          props: { tier: tier.name },
                        });
                      }}
                    >
                      {tier.id === "tier-business" ? (
                        <Button
                          className="rounded-3xl text-base"
                          variant="orange"
                        >
                          {tier.buttonText}
                        </Button>
                      ) : (
                        <Button className="rounded-3xl text-base text-gray-200 bg-black hover:bg-gray-900">
                          {tier.buttonText}
                        </Button>
                      )}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full max-w-7xl px-4 md:px-8 mx-auto ">
          <div className="py-12 bg-[#fb7a00] rounded-xl mx-auto px-6 my-4">
            <div className="flex lg:flex-row flex-col item-center justify-between space-y-10 lg:space-y-0">
              <h2 className="text-3xl text-nowrap">Looking to self-host?</h2>
              <div className="space-x-2 flex items-center">
                <Link
                  href="https://github.com/mfts/papermark"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="outline"
                    className="text-base rounded-3xl bg-transparent border-black hover:bg-gray-200 hover:text-black"
                  >
                    <GitHubIcon className="mr-2 h-6 w-6" />
                    View Github
                  </Button>
                </Link>
                <Link
                  href="https://cal.com/marcseitz/papermark"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="text-base rounded-3xl text-gray-200 bg-black hover:bg-gray-900">
                    Book a demo
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white py-16">
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <PricingComparison />
          </div>
        </div>
        <div>
          <Footer />
        </div>
      </div>
    </>
  );
}

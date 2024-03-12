import Image from "next/image";
import { CheckIcon } from "lucide-react";
import { XIcon } from "lucide-react";
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
import { Disclosure } from "@headlessui/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

const frequencies: {
  value: "monthly" | "annually";
  label: "Monthly" | "Annually";
  priceSuffix: "/month" | "/year";
}[] = [
  { value: "monthly", label: "Monthly", priceSuffix: "/month" },
  { value: "annually", label: "Annually", priceSuffix: "/year" },
];

export default function Taplio() {
  const frequency = frequencies[0];
  return (
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
                      <li key={index} className="flex items-center gap-x-3">
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

              <a href={tier.href} aria-describedby={tier.id} className="p-6">
                <Button
                  className="rounded-3xl hover:bg-gray-100"
                  style={{
                    backgroundColor: tier.bgColor,
                    borderColor: tier.borderColor,
                    color: tier.textColor,
                    borderWidth: "1px",
                  }}
                >
                  {tier.buttonText}
                </Button>
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

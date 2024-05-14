import Link from "next/link";

import { ArrowRightIcon, CheckCircle2Icon, MinusIcon } from "lucide-react";

const featureGroups: {
  name: string;
  features: {
    name: string;
    id: string;
    tiers: {
      free: string | boolean;
      pro: string | boolean;
      business: string | boolean;
      enterprise: string | boolean;
    };
  }[];
}[] = [
  {
    name: "Document Analytics and Tracking",
    features: [
      {
        name: "Unlimited views recorded",
        id: "feature-user",
        tiers: {
          free: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        name: "Time spent on each page",
        id: "feature-user",
        tiers: {
          free: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        name: "Real time feedback",
        id: "feature-user",
        tiers: {
          free: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        name: "Document versioning tracking",
        id: "feature-user",
        tiers: {
          free: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        name: "Viewer location tracking",
        id: "feature-user",
        tiers: {
          free: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        name: "Exclude internal visits",
        id: "feature-user",
        tiers: {
          free: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        name: "Unlimited view history",
        id: "feature-user",
        tiers: {
          free: "up to 20 last views",
          pro: "up to 1000 last views",
          business: true,
          enterprise: true,
        },
      },
    ],
  },
  {
    name: "Link Settings",
    features: [
      {
        name: "Capturing email to view",
        id: "feature-user",
        tiers: {
          free: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        name: "Receive email notifications",
        id: "feature-user",
        tiers: {
          free: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },

      {
        name: "Password protection",
        id: "feature-user",
        tiers: {
          free: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        name: "Expiration date",
        id: "feature-user",
        tiers: {
          free: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        name: "Allow/block document downloading",
        id: "feature-user",
        tiers: {
          free: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        name: "Email verification",
        id: "feature-user",
        tiers: {
          free: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        name: "Allow/block specified users",
        id: "feature-user",
        tiers: {
          free: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
      {
        name: "Screenshot protection",
        id: "feature-user",
        tiers: {
          free: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
    ],
  },

  {
    name: "Data Rooms and Documents",
    features: [
      {
        name: "Unlimited documents",
        id: "feature-user",
        tiers: {
          free: "10 documents",
          pro: "100 documents",
          business: true,
          enterprise: true,
        },
      },
      {
        name: "Unlimited folders",
        id: "feature-user",
        tiers: {
          free: false,
          pro: "on first level",
          business: true,
          enterprise: true,
        },
      },
      {
        name: "Unlimited data rooms",
        id: "feature-user",
        tiers: {
          free: false,
          pro: false,
          business: "1 data room (ability to add)",
          enterprise: true,
        },
      },
      {
        name: "Custom domain for Data Rooms",
        id: "feature-user",
        tiers: {
          free: false,
          pro: false,
          business: false,
          enterprise: true,
        },
      },
      {
        name: "Bulk upload",
        id: "feature-user",
        tiers: {
          free: false,
          pro: false,
          business: false,
          enterprise: "Enterprise",
        },
      },
      {
        name: "User groups permissions",
        id: "feature-user",
        tiers: {
          free: false,
          pro: false,
          business: false,
          enterprise: true,
        },
      },
      {
        name: "Unlimited users",
        id: "feature-user",
        tiers: {
          free: "1 user",
          pro: "2 users",
          business: "3 users",
          enterprise: "5 users",
        },
      },

      {
        name: "Self-hosted",
        id: "feature-user",
        tiers: {
          free: false,
          pro: false,
          business: false,
          enterprise: "Enterprise",
        },
      },
    ],
  },
  {
    name: "Custom branding",
    features: [
      {
        name: "Custom slug",
        id: "feature-user",
        tiers: {
          free: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        name: "Remove Papermark branding",
        id: "feature-user",
        tiers: {
          free: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        name: "Custom logo",
        id: "feature-user",
        tiers: {
          free: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        name: "Custom colors",
        id: "feature-user",
        tiers: {
          free: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        name: "Custom domain for documents",
        id: "feature-user",
        tiers: {
          free: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },

      {
        name: "Custom social media cards",
        id: "feature-user",
        tiers: {
          free: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
      {
        name: "Custom Q&A page",
        id: "feature-user",
        tiers: {
          free: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },

      {
        name: "Custom dataroom banners",
        id: "feature-user",
        tiers: {
          free: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
      {
        name: "Custom domain for data rooms",
        id: "feature-user",
        tiers: {
          free: false,
          pro: false,
          business: false,
          enterprise: true,
        },
      },
      {
        name: "Full white-label",
        id: "feature-user",
        tiers: {
          free: false,
          pro: false,
          business: false,
          enterprise: "Enterprise",
        },
      },
      {
        name: "SSO",
        id: "feature-user",
        tiers: {
          free: false,
          pro: false,
          business: false,
          enterprise: "Enterprise",
        },
      },
    ],
  },
  {
    name: "Other",
    features: [
      {
        name: "Notion documents integrations",
        id: "feature-user",
        tiers: {
          free: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        name: "Reactions",
        id: "feature-user",
        tiers: {
          free: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        name: "AI-Document Assistant",
        id: "feature-user",
        tiers: {
          free: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        name: "Forms",
        id: "feature-user",
        tiers: {
          free: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },

      {
        name: "Communication within document",
        id: "feature-user",
        tiers: {
          free: false,
          pro: false,
          business: false,
          enterprise: "Enterprise",
        },
      },
    ],
  },
  {
    name: "Support",
    features: [
      {
        name: "Documentation",
        id: "feature-user",
        tiers: {
          free: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        name: "Email support",
        id: "feature-user",
        tiers: {
          free: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        name: "Migration from other document platform ",
        id: "feature-user",
        tiers: {
          free: false,
          pro: false,
          business: false,
          enterprise: true,
        },
      },

      {
        name: "48h support",
        id: "feature-user",
        tiers: {
          free: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
      {
        name: "24h support",
        id: "feature-user",
        tiers: {
          free: false,
          pro: false,
          business: false,
          enterprise: true,
        },
      },

      {
        name: "Support with self-hosting",
        id: "feature-user",
        tiers: {
          free: false,
          pro: false,
          business: false,
          enterprise: "Enterprise",
        },
      },
      {
        name: "Custom features support",
        id: "feature-user",
        tiers: {
          free: false,
          pro: false,
          business: false,
          enterprise: "Enterprise",
        },
      },
    ],
  },
];

export function PricingComparison() {
  const renderFeatureName = (feature: string | boolean) => {
    // If the feature is a string, return it as is
    if (typeof feature === "string") {
      return feature;
    }

    // If the feature is a boolean, return a checkmark or a minus icon
    if (feature) {
      return (
        <CheckCircle2Icon
          className="h-6 w-6 flex-none text-[#fb7a00]"
          aria-hidden="true"
        />
      );
    } else {
      return (
        <MinusIcon
          className="h-6 w-6 flex-none text-black"
          aria-hidden="true"
        />
      );
    }
  };
  return (
    <div className="block w-auto max-w-full">
      <h2 className="sticky top-0 z-30 mt-[-80px] w-full border-b-0 bg-white pb-[40px] pt-[100px] text-3xl">
        Compare features
      </h2>
      <div className="sticky top-[158px] z-40">
        <div className="grid grid-cols-16 overflow-hidden rounded-t-xl border border-black">
          <ul className="col-[span_16_/_span_16] grid grid-cols-16 overflow-hidden bg-gray-100 text-gray-900">
            <li className="col-span-4 list-none border-r border-black p-6 text-xl leading-8 ">
              Features
            </li>
            <li className="col-span-3 list-none border-r border-black p-6 text-xl leading-8">
              Free
            </li>
            <li className="col-span-3 list-none border-r border-black p-6 text-xl leading-8">
              Pro
            </li>
            <li className="col-span-3 list-none border-r border-black p-6 text-xl leading-8">
              Business
            </li>
            <li className="col-span-3 list-none border-r-0 p-6 text-xl leading-8">
              Data Rooms
            </li>
          </ul>
        </div>
        <div className="grid grid-cols-16 border-x border-black">
          <ul className="col-[span_16_/_span_16] grid grid-cols-16 overflow-hidden">
            <li className="col-span-4 list-none border-r border-black bg-white px-6 py-4 text-sm"></li>
            <li className="col-span-3 list-none border-r border-black bg-white px-6 py-4 text-sm hover:bg-black hover:text-white">
              <Link href="/login" className="group flex items-center gap-x-1">
                Start sharing <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </li>
            <li className="col-span-3 list-none border-r border-black bg-white px-6 py-4 text-sm hover:bg-black hover:text-white">
              <Link
                href="/login?next=/settings/billing"
                className="group flex items-center gap-x-1"
              >
                Choose Pro <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </li>
            <li className="col-span-3 list-none border-r border-black bg-white px-6 py-4 text-sm hover:bg-[#fb7a00] ">
              <Link
                href="/login?next=/settings/billing"
                className="group flex items-center gap-x-1"
              >
                Choose Business <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </li>
            <li className="col-span-3 list-none border-r-0 bg-white px-6 py-4 text-sm hover:bg-black hover:text-white">
              <Link
                href="/login?next=/settings/billing"
                target="_blank"
                className="group flex items-center gap-x-1"
              >
                Create Data Rooms <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="relative z-0">
        <div className="w-full border-collapse overflow-visible rounded-b-xl border border-black bg-none">
          <div>
            {featureGroups.map((group) => (
              <>
                <h3
                  className="sticky top-[292px] z-30 m-0 w-full bg-black px-6 py-3 text-base font-normal text-white"
                  key={group.name}
                >
                  {group.name}
                </h3>
                {group.features.map((feature) => (
                  <div
                    className="relative grid w-full grid-cols-16 last:rounded-b-xl odd:bg-gray-100"
                    key={feature.name}
                  >
                    <div className="relative col-end-[span_4] flex flex-wrap items-center border-r border-black px-6 py-7 text-left text-base font-normal text-black last:border-r-0">
                      {feature.name}
                    </div>
                    <div className="font-base relative col-end-[span_3] flex flex-wrap items-center border-r border-black px-6 py-7 text-left text-base text-black last:border-r-0">
                      {renderFeatureName(feature.tiers.free)}
                    </div>
                    <div className="font-base relative col-end-[span_3] flex flex-wrap items-center border-r border-black px-6 py-7 text-left text-base text-black last:border-r-0">
                      {renderFeatureName(feature.tiers.pro)}
                    </div>
                    <div className="font-base relative col-end-[span_3] flex flex-wrap items-center border-r border-black px-6 py-7 text-left text-base text-black last:border-r-0">
                      {renderFeatureName(feature.tiers.business)}
                    </div>
                    <div className="font-base relative col-end-[span_3] flex flex-wrap items-center border-r border-black px-6 py-7 text-left text-base text-black last:border-r-0">
                      {renderFeatureName(feature.tiers.enterprise)}
                    </div>
                  </div>
                ))}
              </>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import { CheckCircle2Icon, MinusIcon } from "lucide-react";

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
        name: "Views recorded for each user",
        id: "feature-user",
        tiers: {
          free: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        name: "Real time feedback on each page",
        id: "feature-user",
        tiers: {
          free: false,
          pro: false,
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
        name: "Viever location tracking",
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
          free: "up to 20",
          pro: "up to 10",
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
        name: "Allow/block specififed users",
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
    name: "Data Rooms",
    features: [
      {
        name: "Unlimited data rooms",
        id: "feature-user",
        tiers: {
          free: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        name: "Unlimited documents",
        id: "feature-user",
        tiers: {
          free: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        name: "Unlimited users",
        id: "feature-user",
        tiers: {
          free: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        name: "User groups",
        id: "feature-user",
        tiers: {
          free: false,
          pro: false,
          business: false,
          enterprise: true,
        },
      },
      {
        name: "Folder",
        id: "feature-user",
        tiers: {
          free: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        name: "File size",
        id: "feature-user",
        tiers: {
          free: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        name: "Custom branding",
        id: "feature-user",
        tiers: {
          free: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        name: "Full whitelabelling",
        id: "feature-user",
        tiers: {
          free: false,
          pro: false,
          business: false,
          enterprise: true,
        },
      },
      {
        name: "Self-hosted",
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
        name: "Allow/block specififed users",
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
    name: "Custom branding",
    features: [
      {
        name: "Subdomain and slug",
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
          pro: "partial",
          business: true,
          enterprise: true,
        },
      },
      {
        name: "Custom domain",
        id: "feature-user",
        tiers: {
          free: false,
          pro: "partial",
          business: true,
          enterprise: true,
        },
      },
      {
        name: "Custom logo",
        id: "feature-user",
        tiers: {
          free: false,
          pro: "partial",
          business: true,
          enterprise: true,
        },
      },
      {
        name: "Custom colors",
        id: "feature-user",
        tiers: {
          free: false,
          pro: "partial",
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
        name: "Custom questions",
        id: "feature-user",
        tiers: {
          free: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
      {
        name: "Remove Papermark branding",
        id: "feature-user",
        tiers: {
          free: false,
          pro: "partial",
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
        name: "Full whitelabelling",
        id: "feature-user",
        tiers: {
          free: false,
          pro: false,
          business: false,
          enterprise: true,
        },
      },
      {
        name: "SSO",
        id: "feature-user",
        tiers: {
          free: false,
          pro: false,
          business: false,
          enterprise: true,
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
        name: "AI-Document Assistant",
        id: "feature-user",
        tiers: {
          free: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        name: "Forms",
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
          free: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
      {
        name: "Communication within document ",
        id: "feature-user",
        tiers: {
          free: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
    ],
  },
  {
    name: "Support",
    features: [
      {
        name: "Migration from other document platform ",
        id: "feature-user",
        tiers: {
          free: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
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
        name: "48h support",
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
        name: "Support with self-hosting",
        id: "feature-user",
        tiers: {
          free: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
      {
        name: "Custom features support",
        id: "feature-user",
        tiers: {
          free: true,
          pro: true,
          business: true,
          enterprise: true,
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
    <div className="max-w-full w-auto block">
      <h2 className="text-3xl w-full sticky z-30 top-0 mt-[-80px] pt-[100px] border-b-0 pb-[40px] bg-white">
        Compare features
      </h2>
      <div className="sticky top-[158px] z-40">
        <div className="grid grid-cols-16 border border-black rounded-t-xl overflow-hidden">
          <ul className="grid col-[span_16_/_span_16] grid-cols-16 overflow-hidden">
            <li className="col-span-4 bg-white p-5 text-xl leading-8 list-none border-r border-black ">
              Features
            </li>
            <li className="col-span-3 bg-white p-5 text-xl leading-8 list-none border-r border-black">
              Free
            </li>
            <li className="col-span-3 bg-white p-5 text-xl leading-8 list-none border-r border-black">
              Pro
            </li>
            <li className="col-span-3 bg-white p-5 text-xl leading-8 list-none border-r border-black">
              Business
            </li>
            <li className="col-span-3 bg-white p-5 text-xl leading-8 list-none border-r-0">
              Enterprise
            </li>
          </ul>
        </div>
        <div className="grid grid-cols-16 border-x border-black">
          <ul className="grid col-[span_16_/_span_16] grid-cols-16 overflow-hidden">
            <li className="col-span-4 bg-white p-5 text-sm list-none border-r border-black "></li>
            <li className="col-span-3 bg-white p-5 text-sm list-none border-r border-black">
              Start sharing
            </li>
            <li className="col-span-3 bg-white p-5 text-sm list-none border-r border-black">
              Start a free trial
            </li>
            <li className="col-span-3 bg-white p-5 text-sm list-none border-r border-black">
              Start a free trial
            </li>
            <li className="col-span-3 bg-white p-5 text-sm list-none border-r-0">
              Book a demo
            </li>
          </ul>
        </div>
      </div>
      <div className="relative z-0">
        <div className="w-full border-collapse overflow-visible bg-none border border-black rounded-b-xl ">
          <div>
            {featureGroups.map((group) => (
              <>
                <h3 className="text-base sticky top-[285px] text-white z-30 w-full bg-black m-0 py-3 px-8 font-medium">
                  {group.name}
                </h3>
                {group.features.map((feature) => (
                  <div className="grid grid-cols-16 w-full relative odd:bg-muted last:rounded-b-xl">
                    <div className="relative py-7 px-[30px] text-base text-left flex flex-wrap font-medium col-end-[span_4] items-center text-black border-r border-black last:border-r-0">
                      {feature.name}
                    </div>
                    <div className="relative py-7 px-[30px] text-base text-left flex flex-wrap font-base col-end-[span_3] items-center text-black border-r border-black last:border-r-0">
                      {renderFeatureName(feature.tiers.free)}
                    </div>
                    <div className="relative py-7 px-[30px] text-base text-left flex flex-wrap font-base col-end-[span_3] items-center text-black border-r border-black last:border-r-0">
                      {renderFeatureName(feature.tiers.pro)}
                    </div>
                    <div className="relative py-7 px-[30px] text-base text-left flex flex-wrap font-base col-end-[span_3] items-center text-black border-r border-black last:border-r-0">
                      {renderFeatureName(feature.tiers.business)}
                    </div>
                    <div className="relative py-7 px-[30px] text-base text-left flex flex-wrap font-base col-end-[span_3] items-center text-black border-r border-black last:border-r-0">
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

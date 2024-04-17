import { CheckCircle2Icon, MinusIcon } from "lucide-react";
interface ToolFeature {
  name: string;
  features: { [feature: string]: string };
}

const tools: ToolFeature[] = [
  {
    name: "Papermark Business Plan",
    features: {
      docs: "Yes",
      folders: "Yes",
      linksettings: "Yes",
      advancedanalytics: "Yes",
      timerecorded: "Yes",
      blocklist: "Yes",
      verifications: "Yes",
      branding: "Yes",
      support: "Yes",
      notifications: "No",
      rooms: "No",
      users: "No",
      sso: "No",
      upload: "No",
      migration: "No",
      support2: "No",
      self: "No",
      white: "No",
    },
  },

  // data room,whitelabelling
  {
    name: "Papermark Custom Plan",
    features: {
      docs: "Yes",
      folders: "Yes",
      linksettings: "Yes",
      advancedanalytics: "Yes",
      timerecorded: "Yes",
      blocklist: "Yes",
      verifications: "Yes",
      branding: "Yes",
      support: "Yes",
      notifications: "Yes",
      rooms: "Yes",
      users: "Yes",
      migration: "Yes",
      support2: "Yes",
      sso: "Yes",
      upload: "Yes",
      self: "No",
      white: "No",
    },
  },
  {
    name: "Papermark Self-Hosted Plan",

    features: {
      docs: "Yes",
      folders: "Yes",
      linksettings: "Yes",
      advancedanalytics: "Yes",
      timerecorded: "Yes",
      blocklist: "Yes",
      verifications: "Yes",
      branding: "Yes",
      support: "Yes",
      notifications: "Yes",
      rooms: "Yes",
      users: "Yes",
      migration: "Yes",
      support2: "Yes",
      sso: "Yes",
      upload: "Yes",
      self: "Yes",
      white: "Yes",
    },
  },

  // Add other tools in a similar format
];

const featureDisplayNames: { [key: string]: string } = {
  docs: "Unlimited documents",
  folders: "Unlimited folders",
  linksettings: "Custom Link Settings",
  advancedanalytics: "Advanced Analytics",
  timerecorded: "Time recorded on each page",
  blocklist: "Allow & Block List",
  verifications: "Email verifications",
  notifications: "Notifications",
  branding: "Custom data room branding",
  rooms: "Unlimited data rooms",
  users: "User Groups",
  white: "Full white-labelling",
  sso: "SSO",
  upload: "Bulk upload",
  self: "Self-hosted on your servers",
  migration: "Migration from other platform",
  support: "48h email support ",
  support2: "24h  support ",
};

export default function ComparisonTable() {
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
  const featuresList = Object.keys(tools[0].features);

  return (
    <div className="">
      {/* <div className="mt-20 px-6 py-12 sm:px-6 sm:py-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Compare best Docsend alternatives based on core features
            <br />
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-600">
            Check all the features you need to securely share documents
          </p>
        </div>
      </div> */}
      <div className="mt-6 flow-root">
        <div className="rounded-lg border border-gray-300 bg-gray-100 overflow-x-auto ">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-gray-300 border border-gray-300  ">
              <thead>
                <tr>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 text-balance">
                    Data Room Feature
                  </th>
                  {tools.map((tool) => (
                    <th
                      key={tool.name}
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 text-balance"
                    >
                      {tool.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white border border-gray-300 ">
                {featuresList.map((feature) => (
                  <tr key={feature}>
                    <td className="px-3 py-4 text-sm text-gray-900 text-balance border border-gray-300 font-semibold ">
                      {featureDisplayNames[feature]}
                    </td>
                    {tools.map((tool) => (
                      <td
                        key={tool.name}
                        className={`px-3 py-4 text-sm  ${
                          tool.name === "Papermark"
                            ? "bg-green-50 text-green-700 font-semibold text-balance"
                            : ""
                        }`} // Consistent text color, conditional background color
                      >
                        {tool.features[feature]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ToolFeature {
  name: string;
  features: { [feature: string]: string };
}

const tools: ToolFeature[] = [
  {
    name: "Papermark",
    features: {
      plan1: "Free",
      plan2: "$29/month (team access)",
      plan3: "Custom",
      opensource: "Yes",
    },
  },
  {
    name: "Docsend",
    features: {
      plan1: "$15/month (per user)",
      plan2: "$65/month (per user)",
      plan3: "$250/month",
      opensource: "No",
    },
  },
  {
    name: "PandaDoc",
    features: {
      plan1: "$35/month",
      plan2: "$65/month",
      plan3: "Enterprise",
      opensource: "No",
    },
  },
];

const featureDisplayNames: { [key: string]: string } = {
  plan1: "Essential plan",
  plan2: "Standard plan",
  plan3: "Pro plan",
  opensource: "Open Source and Self Hosted",
};

export default function ComparisonTable() {
  const featuresList = Object.keys(tools[0].features);

  return (
    <div className="px-6 sm:px-8 lg:px-20">
      <div className="mt-20 px-6 py-12 sm:px-6 sm:py-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Top 2 Docsend alternatives based Plan and Pricing
            <br />
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-600">
            Alternatives which help users to share documents and track the
            progress on each page. So allow to capture email and set other
            setting for sharable links.
          </p>
        </div>
      </div>
      <div className="mt-6 flow-root">
        <div className="rounded-lg border border-gray-300 mx-4 my-2 overflow-x-auto">
          <div className="inline-block min-w-full  align-middle">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Feature
                  </th>
                  {tools.map((tool) => (
                    <th
                      key={tool.name}
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      {tool.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {featuresList.map((feature) => (
                  <tr key={feature}>
                    <td className="px-3 py-4 text-sm text-gray-900">
                      {featureDisplayNames[feature]}
                    </td>
                    {tools.map((tool) => (
                      <td
                        key={tool.name}
                        className={`px-3 py-4 text-sm text-gray-500 ${
                          tool.name === "Papermark" ? "bg-green-100" : ""
                        }`}
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

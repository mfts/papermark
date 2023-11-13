interface ToolFeature {
  name: string;
  features: { [feature: string]: string };
}

const tools: ToolFeature[] = [
  {
    name: "Papermark",
    features: {
      unlimitedDocuments: "Yes",
      emailCapture: "Yes",
      teamAccess: "Yes",
      customDomain: "Yes",
      trackAnalytics: "Yes",
      emailnotifications: "Yes",
      feedbackOnPage: "Yes",
      aiEnhancements: "Yes",
    },
  },
  {
    name: "Docsend",
    features: {
      unlimitedDocuments: "No",
      emailCapture: "Yes",
      teamAccess: "Yes",
      customDomain: "No",
      trackAnalytics: "Yes",
      emailnotifications: "Yes",
      feedbackOnPage: "No",
      aiEnhancements: "No",
    },
  },
  {
    name: "PandaDoc",
    features: {
      unlimitedDocuments: "No",
      emailCapture: "No",
      teamAccess: "Yes",
      customDomain: "No",
      trackAnalytics: "Yes",
      emailnotifications: "Yes",
      feedbackOnPage: "No",
      aiEnhancements: "No",
    },
  },
  {
    name: "Google Drive",
    features: {
      unlimitedDocuments: "Yes",
      emailCapture: "No",
      teamAccess: "Yes",
      customDomain: "No",
      trackAnalytics: "No",
      emailnotifications: "No",
      feedbackOnPage: "No",
      aiEnhancements: "No",
    },
  },
  {
    name: "Pitch",
    features: {
      unlimitedDocuments: "Yes",
      emailCapture: "No",
      teamAccess: "Yes",
      customDomain: "No",
      trackAnalytics: "No",
      emailnotifications: "No",
      feedbackOnPage: "No",
      aiEnhancements: "No",
    },
  },
  {
    name: "Notion",
    features: {
      unlimitedDocuments: "Yes",
      emailCapture: "No",
      teamAccess: "Yes",
      customDomain: "No",
      trackAnalytics: "No",
      emailnotifications: "No",
      feedbackOnPage: "No",
      aiEnhancements: "No",
    },
  },
  {
    name: "BriefLink",
    features: {
      unlimitedDocuments: "No",
      emailCapture: "Yes",
      teamAccess: "No",
      customDomain: "No",
      trackAnalytics: "Yes",
      emailnotifications: "No",
      feedbackOnPage: "No",
      aiEnhancements: "No",
    },
  },
  // Add other tools in a similar format
];

const featureDisplayNames: { [key: string]: string } = {
  emailCapture: "Shared link controls",
  teamAccess: "Team Access",
  customDomain: "Custom Domain",
  unlimitedDocuments: "Unlimited Documents",
  trackAnalytics: "Analytics on each page",
  feedbackOnPage: "Feedback on each page",
  emailnotifications: "Email Notifications",
  aiEnhancements: "AI-Enhancements",
};

export default function ComparisonTable() {
  const featuresList = Object.keys(tools[0].features);

  return (
    <div className="px-6 sm:px-8 lg:px-20">
      <div className="mt-20 px-6 py-12 sm:px-6 sm:py-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Compare top 7 Docsend alternatives based on core features
            <br />
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-600">
            Check all the features you need to securely share documents
          </p>
        </div>
      </div>
      <div className="mt-6 flow-root">
        <div className="rounded-lg border border-gray-300 mx-4 my-2 overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
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

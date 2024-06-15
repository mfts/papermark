interface ToolFeature {
  name: string;
  features: { [feature: string]: string };
}

const tools: ToolFeature[] = [
    {
    name: "Papermark",
    features: {
      unlimitedDocuments: "Yes",
      unlimitedDataRooms: "Yes",
      emailCapture: "Yes",
      teamAccess: "Yes",
      customDomain: "Yes",
      trackAnalytics: "Yes",
      emailnotifications: "Yes",
      aiEnhancements: "Yes",
      selfhosted: "Yes",
    },
  },

  {
    name: "iDeals",
    features: {
      unlimitedDocuments: "No",
      unlimitedDataRooms: "No",
      emailCapture: "No",
      teamAccess: "Yes",
      customDomain: "No",
      trackAnalytics: "Yes",
      emailnotifications: "No",
      aiEnhancements: "No",
      selfhosted: "No",
    },
  },
    {
    name: "Intralinks",
    features: {
      unlimitedDocuments: "No",
      unlimitedDataRooms: "No",
      emailCapture: "No",
      teamAccess: "Yes",
      customDomain: "No",
      trackAnalytics: "Yes",
      emailnotifications: "No",
      aiEnhancements: "No",
      selfhosted: "No",
    },
  },
    {
    name: "FirmRoom",
    features: {
      unlimitedDocuments: "Yes",
      unlimitedDataRooms: "Yes",
      emailCapture: "Yes",
      teamAccess: "Yes",
      customDomain: "Yes",
      trackAnalytics: "Yes",
      emailnotifications: "Yes",
      aiEnhancements: "No",
      selfhosted: "No",
    },
  },

  {
    name: "SecureDocs",
    features: {
      unlimitedDocuments: "Yes",
      unlimitedDataRooms: "Yes",
      emailCapture: "Yes",
      teamAccess: "Yes",
      customDomain: "Yes",
      trackAnalytics: "Yes",
      emailnotifications: "Yes",
      aiEnhancements: "No",
      selfhosted: "No",
    },
  },
  {
    name: "Ansarada",
    features: {
      unlimitedDocuments: "No",
      unlimitedDataRooms: "No",
      emailCapture: "No",
      teamAccess: "Yes",
      customDomain: "No",
      trackAnalytics: "Yes",
      emailnotifications: "No",
      aiEnhancements: "No",
      selfhosted: "No",
    },
  },
  {
    name: "Datasite Diligence",
    features: {
      unlimitedDocuments: "No",
      unlimitedDataRooms: "No",
      emailCapture: "No",
      teamAccess: "Yes",
      customDomain: "No",
      trackAnalytics: "Yes",
      emailnotifications: "No",
      aiEnhancements: "No",
      selfhosted: "No",
    },
  },
  // {
  //   name: "Onehub",
  //   features: {
  //     unlimitedDocuments: "No",
  //     unlimitedDataRooms: "No",
  //     emailCapture: "No",
  //     teamAccess: "Yes",
  //     customDomain: "No",
  //     trackAnalytics: "Yes",
  //     emailnotifications: "No",
  //     aiEnhancements: "No",
  //     selfhosted: "No",
  //   },
  // },
  {
    name: "CapLinked",
    features: {
      unlimitedDocuments: "No",
      unlimitedDataRooms: "No",
      emailCapture: "No",
      teamAccess: "Yes",
      customDomain: "No",
      trackAnalytics: "Yes",
      emailnotifications: "No",
      aiEnhancements: "No",
      selfhosted: "No",
    },
  },
  {
    name: "ShareVault",
    features: {
      unlimitedDocuments: "No",
      unlimitedDataRooms: "No",
      emailCapture: "No",
      teamAccess: "Yes",
      customDomain: "No",
      trackAnalytics: "Yes",
      emailnotifications: "No",
      aiEnhancements: "No",
      selfhosted: "No",
    },
  },
  // {
  //   name: "HighQ",
  //   features: {
  //     unlimitedDocuments: "No",
  //     unlimitedDataRooms: "No",
  //     emailCapture: "No",
  //     teamAccess: "Yes",
  //     customDomain: "No",
  //     trackAnalytics: "Yes",
  //     emailnotifications: "No",
  //     aiEnhancements: "No",
  //     selfhosted: "No",
  //   },
  // },
];

const featureDisplayNames: { [key: string]: string } = {
  emailCapture: "Advanced link controls",
  teamAccess: "Team Access",
  customDomain: "Custom Branding",
  customDomain2: "Custom Domain for Data Rooms",
  unlimitedDocuments: "Unlimited Documents",
  trackAnalytics: "Analytics on each page",
  unlimitedDataRooms: "Unlimited Data Rooms",
  emailnotifications: "Email Notifications",
  aiEnhancements: "White-Labelling",
  selfhosted: "Self-Hosted and Open Source",
  // feedbackonPage,
};

export default function ComparisonTable() {
  const featuresList = Object.keys(tools[0].features);

  return (
    <div className="">
      <div className="mt-6 flow-root">
        <div className="bg-gray- mx-4 my-2 overflow-x-auto rounded-lg border border-gray-300">
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
                      {feature === "unlimitedDocuments" && (
                        <div className="text-xs text-gray-400">
                          shared via custom domains
                        </div>
                      )}
                      {feature === "unlimitedDataRooms" && (
                        <div className="text-xs text-gray-400">
                          shared via custom domains
                        </div>
                      )}
                    </td>
                    {tools.map((tool) => (
                      <td
                        key={tool.name}
                        className={`px-3 py-4 text-sm  ${
                          tool.name === "Papermark"
                            ? "bg-green-50 font-semibold text-green-700"
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
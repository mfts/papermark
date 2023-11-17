interface ToolFeature {
  name: string;
  features: { [feature: string]: string };
}

const tools: ToolFeature[] = [
  {
    name: "Papermark",
    features: {
      Description: "Founder friendly document sharing platform ",
      PitchDeck: "Yes",
      SalesDeck: "Yes",
      Investmentdocs: "Yes",
      Otherdocs: "Yes",
      Enchancer: "Yes",
    },
  },
  {
    name: "PandaDoc",
    features: {
      Description: "Enterprise focused sharing documents and contracts",
      PitchDeck: "Yes",
      SalesDeck: "Yes",
      Investmentdocs: "No",
      Otherdocs: "Yes",
      Enchancer: "No",
    },
  },
  {
    name: "Google Drive",
    features: {
      Description: "Hosting documents and other files",
      PitchDeck: "No",
      SalesDeck: "No",
      Investmentdocs: "No",
      Enchancer: "No",
      Otherdocs: "Yes",
    },
  },
  {
    name: "Pitch",
    features: {
      Description: "Creating presentations",
      PitchDeck: "No",
      SalesDeck: "No",
      Investmentdocs: "No",
      Enchancer: "No",
      Otherdocs: "No",
    },
  },
  {
    name: "Notion",
    features: {
      Description: "Creating documents ",
      PitchDeck: "No",
      SalesDeck: "No",
      Investmentdocs: "No",
      Enchancer: "Yes",
      Otherdocs: "Yes",
    },
  },
];

const featureDisplayNames: { [key: string]: string } = {
  PitchDeck: "Sharing pitch deck with analytics and link control",
  Description: "Main use case",
  SalesDeck: "Sending sales document with analytics",
  Enchancer: "Summarise, analyse and improve documents",
  Investmentdocs: "Data room and investment documents",
  Otherdocs: "All other documents",
};

export default function ComparisonTable() {
  const featuresList = Object.keys(tools[0].features);

  return (
    <div className="px-6 sm:px-8 lg:px-20">
      <div className="mt-20 px-6 py-12 sm:px-6 sm:py-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Use Cases comparison for DocSend alternatives
            <br />
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-600">
            Use Docsend alternatives for sharing Pitch Deck, sending Sales deck,
            setting Data Room and working with other documents
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

import React from "react";

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
            Check all the features you need for securely sharing documents
          </p>
        </div>
      </div>
      <div className="mt-6 flow-root">
        <div className="rounded-lg border border-gray-300 mx-4 my-2 overflow-x-auto">
          <div className="inline-block min-w-full py-2 align-middle">
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
                        className="px-3 py-4 text-sm text-gray-500"
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

// import React from "react";

// interface ToolFeature {
//   name: string;
//   emailCapture: boolean;
//   teamAccess: boolean;
//   customDomain: boolean;
//   unlimitedDocuments: boolean;
//   trackAnalytics: boolean;
//   feedbackOnPage: boolean;
//   aiEnhancements: boolean;
// }

// const tools: ToolFeature[] = [
//   {
//     name: "Papermark",
//     emailCapture: false, // No explicit mention of email capture
//     teamAccess: false, // No explicit mention of team access
//     customDomain: true, // Custom domain available【11†source】【12†source】【13†source】【14†source】【15†source】
//     unlimitedDocuments: false, // No explicit mention of unlimited documents
//     trackAnalytics: true, // Real-time analytics available【11†source】【12†source】【13†source】【14†source】【15†source】
//     feedbackOnPage: true, // Feedback for each slide available【11†source】
//     aiEnhancements: false, // No explicit mention of AI enhancements
//   },
//   {
//     name: "Docsend",
//     emailCapture: true, // Email verification for access【22†source】
//     teamAccess: true, // Not explicitly mentioned but implied by multiple user access
//     customDomain: true, // Custom branded subdomain available【20†source】
//     unlimitedDocuments: false, // No explicit mention of unlimited documents
//     trackAnalytics: true, // Page-by-page analytics available【21†source】【25†source】
//     feedbackOnPage: true, // Real-time feedback on documents【19†source】【23†source】
//     aiEnhancements: false, // No explicit mention of AI enhancements
//   },
//   {
//     name: "PandaDoc",
//     emailCapture: false, // No explicit mention of email capture
//     teamAccess: true, // Available for business plans and above【59†source】
//     customDomain: false, // No explicit mention of custom domain
//     unlimitedDocuments: true, // Unlimited file uploads in some plans【59†source】
//     trackAnalytics: false, // No explicit mention of tracking analytics
//     feedbackOnPage: false, // No explicit mention of feedback on each page
//     aiEnhancements: false, // No explicit mention of AI enhancements
//   },
//   {
//     name: "Google Drive",
//     emailCapture: false, // No explicit mention of email capture
//     teamAccess: true, // Implied by nature of cloud storage service
//     customDomain: false, // No explicit mention of custom domain
//     unlimitedDocuments: true, // Cloud-based storage for numerous files【41†source】
//     trackAnalytics: false, // No explicit mention of tracking analytics
//     feedbackOnPage: true, // Comments can be added to files for feedback【42†source】
//     aiEnhancements: false, // No explicit mention of AI enhancements
//   },
//   {
//     name: "Pitch",
//     emailCapture: false, // No explicit mention of email capture
//     teamAccess: true, // Unlimited members【53†source】
//     customDomain: true, // Custom links available【52†source】
//     unlimitedDocuments: true, // Unlimited presentations【53†source】
//     trackAnalytics: true, // Presentation analytics available【50†source】【51†source】
//     feedbackOnPage: false, // No explicit mention of feedback on each page
//     aiEnhancements: false, // No explicit mention of AI enhancements
//   },
//   {
//     name: "Notion",
//     emailCapture: false, // No explicit mention of email capture
//     teamAccess: true, // Team collaboration features available【59†source】
//     customDomain: false, // No explicit mention of custom domain
//     unlimitedDocuments: true, // Unlimited blocks and file uploads in some plans【59†source】
//     trackAnalytics: true, // Basic to advanced page analytics available【59†source】
//     feedbackOnPage: false, // No explicit mention of feedback on each page
//     aiEnhancements: false, // No explicit mention of AI enhancements
//   },
// ];

// export default function ComparisonTable() {
//   return (
//     <div className="px-6 sm:px-8 lg:px-20">
//       <div className="sm:flex sm:items-center">
//         <div className="sm:flex-auto">
//           <h1 className="text-xl font-semibold leading-6 text-gray-900">
//             Document Management Tools Comparison
//           </h1>
//           <p className="mt-2 text-sm text-gray-700">
//             Comparing features of various document management and collaboration
//             tools.
//           </p>
//         </div>
//       </div>
//       <div className="mt-8 flow-root">
//         <div className="rounded-lg border border-gray-300 mx-4 my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
//           <div className="inline-block min-w-full py-2 align-middle">
//             <table className="min-w-full divide-y divide-gray-300">
//               <thead>
//                 <tr>
//                   <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
//                     Feature
//                   </th>
//                   {tools.map((tool) => (
//                     <th
//                       key={tool.name}
//                       className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
//                     >
//                       {tool.name}
//                     </th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-gray-200 bg-white">
//                 <tr>
//                   <td className="px-3 py-4 text-sm text-gray-900">
//                     Email Capture
//                   </td>
//                   {tools.map((tool) => (
//                     <td
//                       key={tool.name}
//                       className="px-3 py-4 text-sm text-gray-500"
//                     >
//                       {tool.emailCapture ? "Yes" : "No"}
//                     </td>
//                   ))}
//                 </tr>
//                 <tr>
//                   <td className="px-3 py-4 text-sm text-gray-900">
//                     Email Capture
//                   </td>
//                   {tools.map((tool) => (
//                     <td
//                       key={tool.name}
//                       className="px-3 py-4 text-sm text-gray-500"
//                     >
//                       {tool.emailCapture ? "Yes" : "No"}
//                     </td>
//                   ))}
//                 </tr>

//                 {/* Repeat for each feature */}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

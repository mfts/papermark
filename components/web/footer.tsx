// import { JSX, SVGProps } from "react";

import CopyRight from "../shared/icons/copy-right";

// const navigation = [
//   {
//     name: "Twitter",
//     href: "https://twitter.com/mfts0",
//     icon: (props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) => (
//       <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
//         <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
//       </svg>
//     ),
//   },
//   {
//     name: "GitHub",
//     href: "https://github.com/mfts/papermark",
//     icon: (props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) => (
//       <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
//         <path
//           fillRule="evenodd"
//           d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
//           clipRule="evenodd"
//         />
//       </svg>
//     ),
//   },
// ];

// export default function Footer() {
//   return (
//     <footer className="bg-black">
//       <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
//         <div className="flex justify-center space-x-6 md:order-2">
//           {navigation.map((item) => (
//             <a
//               key={item.name}
//               href={item.href}
//               className="text-gray-400 hover:text-gray-500"
//             >
//               <span className="sr-only">{item.name}</span>
//               <item.icon className="h-6 w-6" aria-hidden="true" />
//             </a>
//           ))}
//         </div>
//         <div className="mt-8 md:order-1 md:mt-0">
//           <p className="text-center text-xs leading-5 text-gray-500">
//             &copy; 2023 – All rights reserved.
//           </p>
//         </div>
//       </div>
//     </footer>
//   );
// }

const navigation = {
  product: [
    { name: "Pricing", href: "/pricing" },
    { name: "Github", href: "https://github.com/mfts/papermark" },
    { name: "Twitter", href: "https://twitter.com/papermarkio" },
  ],
  legal: [{ name: "Privacy", href: "/privacy" }],
  tools: [
    { name: "VC-generator", href: "https://vc.papermark.io" },
    { name: "Open Source Friends", href: "/oss-friends" },
    { name: "Open Source Investors", href: "/open-source-investors" },
    {
      name: "YC Application GPT",
      href: "https://chat.openai.com/g/g-LYDRCiZB9-yc-application-gpt",
    },
    {
      name: "FindVC",
      href: "https://chat.openai.com/g/g-G5orSgI31-findvc",
    },
    { name: "Docsend Alternatives Finder", href: "/docsend-alternatives" },
    // { name: "Pitchdeck Summariser", href: "#" },
  ],
  alternatives: [
    { name: "Docsend", href: "/alternatives/docsend" },
    { name: "BriefLink", href: "/alternatives/brieflink" },
    { name: "PandaDoc", href: "/alternatives/pandadoc" },
    { name: "Google-Drive", href: "/alternatives/google-drive" },
    { name: "Pitch", href: "/alternatives/pitch" },
  ],
};

export default function Footer() {
  return (
    <footer
      className="bg-white dark:bg-black border-t border-gray-200"
      aria-labelledby="footer-heading"
    >
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20 lg:px-8 lg:py-12">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          {/* Text-based Logo */}
          <h1 className="text-2xl font-bold tracking-tighter text-black dark:text-white">
            Papermark
          </h1>

          <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold leading-6 text-black dark:text-white">
                  Product
                </h3>
                <ul role="list" className="mt-6 space-y-4">
                  {navigation.product.map((item) => (
                    <li key={item.name}>
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm leading-6 text-gray-500 hover:text-gray-600"
                      >
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold leading-6 text-black dark:text-white">
                  Legal
                </h3>
                <ul role="list" className="mt-6 space-y-4">
                  {navigation.legal.map((item) => (
                    <li key={item.name}>
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm leading-6 text-gray-500 hover:text-gray-600"
                      >
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold leading-6 text-black dark:text-white">
                  Tools
                </h3>
                <ul role="list" className="mt-6 space-y-4">
                  {navigation.tools.map((item) => (
                    <li key={item.name}>
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm leading-6 text-gray-500 hover:text-gray-600"
                      >
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold leading-6 text-black dark:text-white">
                  Alternatives
                </h3>
                <ul role="list" className="mt-6 space-y-4">
                  {navigation.alternatives.map((item) => (
                    <li key={item.name}>
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm leading-6 text-gray-500 hover:text-gray-600"
                      >
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-4 ">
            <p className="text-sm text-gray-600 dark:text-gray-400 flex">
              <CopyRight className="mt-1 mr-1" /> 2023 Papermark. All rights
              reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

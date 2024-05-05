import GitHubIcon from "@/components/shared/icons/github";
import TwitterIcon from "@/components/shared/icons/twitter";
import LinkedinIcon from "@/components/shared/icons/linkedin";
import { StatusWidget } from "./status-widget";

const navigation = {
  product: [
    { name: "Data Room", href: "/data-room" },
    { name: "AI Document Assistant", href: "/ai" },
    { name: "Notion", href: "/share-notion-page" },
    { name: "Pricing", href: "/pricing" },
  ],
  resources: [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Launch Week", href: "/launch-week" },
  ],
  tools: [
    { name: "Open Source Friends", href: "/oss-friends" },
    { name: "Open Source Investors", href: "/open-source-investors" },
    { name: "Investor Database", href: "/investors" },
    {
      name: "YC Application GPT",
      href: "https://chat.openai.com/g/g-LYDRCiZB9-yc-application-gpt",
    },
    {
      name: "FindVC GPT",
      href: "https://chat.openai.com/g/g-G5orSgI31-findvc",
    },
    {
      name: "DocSend Alternatives",
      href: "/docsend-alternatives",
    },
  ],
  alternatives: [
    { name: "DocSend", href: "/alternatives/docsend" },
    { name: "BriefLink", href: "/alternatives/brieflink" },
    { name: "PandaDoc", href: "/alternatives/pandadoc" },
    { name: "Google Drive", href: "/alternatives/google-drive" },
    { name: "Pitch", href: "/alternatives/pitch" },
  ],
  social: [
    {
      name: "GitHub",
      href: "https://github.com/mfts/papermark",
      icon: () => <GitHubIcon className="h-6 w-6" aria-hidden="true" />,
    },
    {
      name: "X / Twitter",
      href: "https://twitter.com/papermarkio",
      icon: () => <TwitterIcon className="h-5 w-5" aria-hidden="true" />,
    },
    {
      name: "LinkedIn",
      href: "https://www.linkedin.com/company/papermarkio",
      icon: () => (
        <LinkedinIcon className="h-5 w-5" color={false} aria-hidden="true" />
      ),
    },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-white" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="mx-auto max-w-7xl pt-20 pb-4 px-4 md:px-8">
        {" "}
        {/* px-6 pb-8 pt-16 sm:pt-24 lg:px-8 lg:pt-32 */}
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-4">
            <span className="text-2xl font-bold tracking-tighter text-black">
              Papermark
            </span>
            <p className="leading-6 text-gray-500">
              Sharing documents, securely and on brand.
            </p>
            <div className="flex space-x-2">
              {navigation.social.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center h-10 rounded-md px-2.5 py-1 font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
                >
                  <span className="sr-only">{item.name}</span>
                  <item.icon />
                </a>
              ))}
            </div>
            <div className="w-fit">
              <StatusWidget />
            </div>
          </div>
          <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="font-semibold leading-6 text-black">Product</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {navigation.product.map((item) => (
                    <li key={item.name}>
                      <a
                        href={item.href}
                        className="leading-6 text-gray-500 hover:text-black"
                      >
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="font-semibold leading-6 text-black">
                  Resources
                </h3>
                <ul role="list" className="mt-6 space-y-4">
                  {navigation.resources.map((item) => (
                    <li key={item.name}>
                      <a
                        href={item.href}
                        className="leading-6 text-gray-500 hover:text-black"
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
                <h3 className="font-semibold leading-6 text-black">Tools</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {navigation.tools.map((item) => (
                    <li key={item.name}>
                      <a
                        href={item.href}
                        className="leading-6 text-gray-500 hover:text-black"
                      >
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="font-semibold leading-6 text-black">
                  Alternatives
                </h3>
                <ul role="list" className="mt-6 space-y-4">
                  {navigation.alternatives.map((item) => (
                    <li key={item.name}>
                      <a
                        href={item.href}
                        className="leading-6 text-gray-500 hover:text-black"
                      >
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-16 border-t border-black/10 pt-4 sm:mt-20 lg:mt-24">
          <p className="text-sm leading-5 text-gray-500">
            &copy; 2024 Papermark. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

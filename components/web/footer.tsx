import Image from "next/image";

import PapermarkLogo from "@/public/_static/papermark-logo.svg";

import GitHubIcon from "@/components/shared/icons/github";
import LinkedinIcon from "@/components/shared/icons/linkedin";
import TwitterIcon from "@/components/shared/icons/twitter";

import { StatusWidget } from "./status-widget";

const navigation = {
  product: [
    { name: "Data Room", href: "/data-room" },
    { name: "AI Document Assistant", href: "/ai" },
    { name: "Notion sharing", href: "/share-notion-page" },
    { name: "Pricing", href: "/pricing" },
  ],
  resources: [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Blog", href: "/blog" },
    { name: "Launch Week 2023", href: "/launch-week" },
  ],
  tools: [
    { name: "Open Source Friends", href: "/oss-friends" },
    { name: "Open Source Investors", href: "/open-source-investors" },
    { name: "Investor Database (7k+)", href: "/investors" },
    {
      name: "YC Application GPT",
      href: "https://chat.openai.com/g/g-LYDRCiZB9-yc-application-gpt",
    },
    {
      name: "FindVC GPT",
      href: "https://chat.openai.com/g/g-G5orSgI31-findvc",
    },

    {
      name: "AI Pitch Deck Generator",
      href: "https://deck.papermark.io",
    },
  ],
  alternatives: [
    { name: "DocSend", href: "/alternatives/docsend" },
    { name: "BriefLink", href: "/alternatives/brieflink" },
    { name: "PandaDoc", href: "/alternatives/pandadoc" },
    { name: "Digify", href: "/alternatives/digify" },
    { name: "FirmRoom", href: "/alternatives/firmroom" },
    { name: "Google-Drive", href: "/alternatives/google-drive" },
    {
      name: "DocSend Alternatives",
      href: "/docsend-alternatives",
    },
    {
      name: "Digify Alternatives",
      href: "/digify-alternatives",
    },
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
  cases: [
    {
      name: "Fundraising",
      href: "/solutions/open-source-fundraising-software",
    },
    {
      name: "Document tracking",
      href: "/solutions/free-document-tracking-software",
    },
    {
      name: "Legal document sharing",
      href: "/solutions/legal-documents-sharing-platform",
    },
    {
      name: "Open source document sharing",
      href: "/solutions/open-source-document-sharing-platform",
    },
    {
      name: "Investor update software",
      href: "/solutions/investor-update-software",
    },
    {
      name: "Pitch deck sharing",
      href: "/solutions/pitch-deck-sharing-sofware",
    },
  ],
  room: [
    {
      name: "Data Room for investors",
      href: "/solutions/data-room-for-investors",
    },
    {
      name: "Data Room for fundraising",
      href: "/solutions/data-room-for-startups",
    },
    {
      name: "VC portfolio management ",
      href: "/solutions/vc-portfolio-management-software",
    },
    { name: "Data Room for realtors", href: "/" },
    // {
    //   name: "Private equaity portfolio management ",
    //   href: "/solutions/private-equity-portfolio-management-software",
    // },
    {
      name: "Virtual sales data room",
      href: "/solutions/virtual-sales-room",
    },
  ],
  support: [
    { name: "Help Center", href: "/help" },
    {
      name: "Create shareable link",
      href: "/help/article/create-link-to-document",
    },
    {
      name: "Link permissions",
      href: "/help/article/link-settings",
    },
    {
      name: "Custom domain",
      href: "/help/article/how-to-add-custom-domain-to-link",
    },
    { name: "Document versions", href: "/help/article/document-versions" },
    {
      name: "Track time on document",
      href: "/help/article/built-in-page-by-page-analytics",
    },
  ],
  more: [
    {
      name: "Password protect Notion",
      href: "/blog/password-protect-a-notion-page",
    },
    {
      name: "Send deck to investors ",
      href: "blog/how-to-send-pitch-deck-to-investors",
    },
    {
      name: "Track time on pitch deck",
      href: "/blog/how-to-track-activity-on-your-pitch-deck",
    },
    {
      name: "Prevent pdf forwarding",
      href: "/blog/how-to-prevent-pdf-forwarding",
    },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-white" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="mx-auto max-w-7xl px-4 pb-4 pt-20 md:px-8">
        {" "}
        {/* px-6 pb-8 pt-16 sm:pt-24 lg:px-8 lg:pt-32 */}
        <div className="xl:grid xl:grid-cols-4 xl:gap-8">
          <div className="space-y-4">
            <Image
              src={PapermarkLogo}
              width={119}
              height={32}
              alt="Papermark Logo"
            />
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
                  className="inline-flex h-10 items-center justify-center rounded-md px-2.5 py-1 font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
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
          <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-3 xl:mt-0">
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
                <h3 className="font-semibold leading-6 text-black">
                  Papermark for
                </h3>
                <ul role="list" className="mt-6 space-y-4">
                  {navigation.cases.map((item) => (
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

              <div>
                <h3 className="font-semibold leading-6 text-black">Support</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {navigation.support.map((item) => (
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
                  Data Room
                </h3>
                <ul role="list" className="mt-6 space-y-4">
                  {navigation.room.map((item) => (
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

              <div className="mt-10 md:mt-0">
                <h3 className="font-semibold leading-6 text-black">
                  Read more
                </h3>
                <ul role="list" className="mt-6 space-y-4">
                  {navigation.more.map((item) => (
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
              <div className="md:grid md:grid-cols-2 md:gap-8"></div>
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

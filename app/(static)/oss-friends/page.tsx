import { Button } from "@/components/ui/button";
import { Metadata } from "next";
import Image from "next/image";

const data = {
  description:
    "Meet our fellow open source projects. Papermark is an open-source document infrastructure for sharing and collaboration.",
  title: "Open Source Friends | Papermark",
  url: "https://www.papermark.io",
};

export const metadata: Metadata = {
  title: data.title,
  description: data.description,
  openGraph: {
    title: data.title,
    description: data.description,
    url: data.url,
    siteName: "Papermark",
    images: [
      {
        url: "https://www.papermark.io/_static/meta-image.png",
        width: 800,
        height: 600,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: data.title,
    description: data.description,
    creator: "@papermarkio",
    images: ["https://www.papermark.io/_static/meta-image.png"],
  },
};

const friends = [
  {
    id: 1,
    name: "Appsmith",
    imageUrl: "https://dknlay9ljaq1f.cloudfront.net/oss-friends/appsmith.png",
    description: "Build build custom software on top of your data.",
    buttonText: "Learn more",
    buttonLink: "https://www.appsmith.com",
  },
  {
    id: 2,
    name: "BoxyHQ",
    imageUrl: "https://dknlay9ljaq1f.cloudfront.net/oss-friends/boxy.png",
    description:
      "BoxyHQ’s suite of APIs for security and privacy helps engineering teams build and ship compliant cloud applications faster.",
    buttonText: "Learn more",
    buttonLink: "https://boxyhq.com",
  },
  {
    id: 3,
    name: "Cal",
    imageUrl: "https://dknlay9ljaq1f.cloudfront.net/oss-friends/cal.webp",
    description:
      "Cal.com is a scheduling tool that helps you schedule meetings without the back-and-forth emails.",
    buttonText: "Learn more",
    buttonLink: "https://cal.com",
  },
  {
    id: 3,
    name: "Crowd.dev",
    imageUrl: "https://dknlay9ljaq1f.cloudfront.net/oss-friends/crowddev.webp",
    description:
      "Centralize community, product, and customer data to understand which companies are engaging with your open source project.",
    buttonText: "Learn more",
    buttonLink: "https://www.crowd.dev",
  },
  {
    id: 4,
    name: "Documenso",
    imageUrl: "https://dknlay9ljaq1f.cloudfront.net/oss-friends/documenso.png",
    description:
      "The Open-Source DocuSign Alternative. We aim to earn your trust by enabling you to self-host the platform and examine its inner workings.",
    buttonText: "Learn more",
    buttonLink: "https://documenso.com",
  },
  {
    id: 5,
    name: "Dub",
    imageUrl: "https://dknlay9ljaq1f.cloudfront.net/oss-friends/dub.jpg",
    description:
      "Dub is an open-source link management tool for modern marketing teams to create, share, and track short links.",
    buttonText: "Learn more",
    buttonLink: "https://dub.co",
  },
  {
    id: 6,
    name: "Formbricks",
    imageUrl: "https://dknlay9ljaq1f.cloudfront.net/oss-friends/formbricks.jpg",
    description:
      "Survey granular user segments at any point in the user journey. Gather up to 6x more insights with targeted micro-surveys. All open-source.",
    buttonText: "Learn more",
    buttonLink: "https://formbricks.com",
  },
  {
    id: 7,
    name: "Hanko",
    imageUrl: "https://dknlay9ljaq1f.cloudfront.net/oss-friends/hanko.png",
    description:
      "Open-source authentication and user management for the passkey era. Integrated in minutes, for web and mobile apps.",
    buttonText: "Learn more",
    buttonLink: "https://www.hanko.io",
  },
  {
    id: 8,
    name: "Infisical",
    imageUrl: "https://dknlay9ljaq1f.cloudfront.net/oss-friends/infisical.png",
    description:
      "Open source, end-to-end encrypted platform that lets you securely manage secrets and configs across your team, devices, and infrastructure.",
    buttonText: "Learn more",
    buttonLink: "https://infisical.com",
  },
  {
    id: 9,
    name: "Novu",
    imageUrl: "https://dknlay9ljaq1f.cloudfront.net/oss-friends/novu.jpg",
    description:
      "The open-source notification infrastructure for developers. Simple components and APIs for managing all communication channels in one place.",
    buttonText: "Learn more",
    buttonLink: "https://novu.co",
  },
  {
    id: 10,
    name: "OpenBB",
    imageUrl: "https://dknlay9ljaq1f.cloudfront.net/oss-friends/openbb.jpg",
    description:
      "Democratizing investment research through an open source financial ecosystem. The OpenBB Terminal allows everyone to perform investment research, from everywhere.",
    buttonText: "Learn more",
    buttonLink: "https://openbb.co",
  },
  {
    id: 11,
    name: "OpenStatus",
    imageUrl: "https://dknlay9ljaq1f.cloudfront.net/oss-friends/openstatus.png",
    description: "Open-source monitoring platform with beautiful status pages.",
    buttonText: "Learn more",
    buttonLink: "https://www.openstatus.dev",
  },
  {
    id: 12,
    name: "Trigger",
    imageUrl: "https://dknlay9ljaq1f.cloudfront.net/oss-friends/trigger.jpg",
    description:
      "Create long-running Jobs directly in your codebase with features like API integrations, webhooks, scheduling and delays.",
    buttonText: "Learn more",
    buttonLink: "https://trigger.dev",
  },
  {
    id: 13,
    name: "UnInbox",
    imageUrl: "https://dknlay9ljaq1f.cloudfront.net/oss-friends/uninbox.png",
    description: "Open Source Email + Chat communication platform",
    buttonText: "Learn more",
    buttonLink: "https://uninbox.com",
  },
  {
    id: 14,
    name: "Webstudio",
    imageUrl: "https://dknlay9ljaq1f.cloudfront.net/oss-friends/webstudio.jpg",
    description:
      "Webstudio visually translates CSS without obscuring it, giving designers superpowers that were exclusive to developers in the past.",
    buttonText: "Learn more",
    buttonLink: "https://webstudio.is",
  },
];

export default function Friends() {
  return (
    <div className="bg-white px-6 py-24 sm:py-32 lg:px-8 ">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          Open Source Friends
        </h2>
        <p className="mt-4 text-lg leading-8 text-gray-600">
          Meet our friends who also building and contributing to Open Source.
        </p>
      </div>
      <ul
        role="list"
        className=" mt-12 grid grid-cols-1 gap-x-6 gap-y-8 lg:grid-cols-3 xl:gap-x-8"
      >
        {friends.map((friend) => (
          <li
            key={friend.id}
            className="overflow-hidden rounded-xl border border-gray-200 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-x-4 p-6">
                <Image
                  src={friend.imageUrl}
                  alt={friend.name}
                  width={100}
                  height={100}
                  className="h-12 w-12 flex-none rounded-lg bg-white object-cover"
                />
              </div>
              <div className="text-xl font-medium leading-6 text-gray-900 pb-1 px-6">
                {friend.name}
              </div>
              <p className="px-6 mt-2 text-gray-600 text-sm ">
                {friend.description}
              </p>
            </div>
            <div className="text-left px-6">
              <a
                href={friend.buttonLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block w-full"
              >
                <Button
                  type="button"
                  className="mt-4 mb-6 rounded-md bg-black text-sm font-semibold text-white shadow-sm"
                >
                  {friend.buttonText}
                </Button>
              </a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

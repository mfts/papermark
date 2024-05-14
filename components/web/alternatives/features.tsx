import {
  RefreshCw as ArrowPathIcon,
  GitPullRequestArrow as CloudArrowUpIcon,
  Settings as Cog6ToothIcon,
  Fingerprint as FingerPrintIcon,
  Lock as LockClosedIcon,
  HardDrive as ServerIcon,
} from "lucide-react";

const features = [
  {
    name: "Open Source",
    description:
      "This gives you the freedom to adapt and customize the tool to your specific needs.",
    icon: CloudArrowUpIcon,
  },
  {
    name: "Secure Document Sharing",
    description:
      "Papermark provides a secure platform to share your documents. ",
    icon: LockClosedIcon,
  },
  {
    name: "Real-Time Analytics",
    description:
      "Track all activity on each slide and get textual feedback on your deck",
    icon: ArrowPathIcon,
  },
  {
    name: "Custom Link Sharing",
    description: "Make your link memorable for all investors.",
    icon: FingerPrintIcon,
  },
  {
    name: "AI-powered",
    description:
      "Papermark leverages artificial intelligence to enhance its document sharing and tracking.",
    icon: Cog6ToothIcon,
  },
  {
    name: "Community Support",
    description:
      "Being an open-source project, Papermark is backed by a community of developers  ",
    icon: ServerIcon,
  },
];

export default function Features() {
  return (
    <div className="">
      <dl className="mx-auto grid max-w-2xl grid-cols-1 gap-x-6 gap-y-10 leading-7  sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-x-8 lg:gap-y-16">
        {features.map((feature) => (
          <div
            key={feature.name}
            className="flex flex-col justify-start space-y-2"
          >
            <feature.icon
              className="h-10 w-10 text-gray-800"
              aria-hidden="true"
            />
            <dt className="inline text-xl text-gray-500">{feature.name}</dt>{" "}
            <dd className="inline text-balance">{feature.description}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

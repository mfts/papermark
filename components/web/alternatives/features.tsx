import Image from "next/image";
import {
  Plus as PlusSmallIcon,
  Minus as MinusSmallIcon,
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

export default function Testimonials() {
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
            <dt className="inline text-gray-500 text-xl">{feature.name}</dt>{" "}
            <dd className="inline text-balance text-balance">
              {feature.description}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

//   return (
//     <div className="bg-white py-24">
//       <div className="w-full mx-auto max-w-7xl  ">
//         <h2 className="text-4xl text-balance text-blue-900">
//           Loved by over 50k users.
//           <br />
//           <span className="text-gray-500">
//             Don&apos;t take it from us – here&apos;s what our users have to say
//             about Postli and Post Generator
//           </span>
//         </h2>

//         <div className="mx-auto max-w-2xl lg:max-w-none mt-8">
//           <div className="space-y-6 py-8 sm:block sm:columns-2 sm:gap-6 lg:columns-3">
//             {testimonials.map((testimonial) => (
//               <div
//                 key={testimonial.author.handle}
//                 className="flex w-full relative"
//               >
//                 <div className="rounded-lg shadow-lg border-gray-500 bg-white p-6 text-base leading-6 border  relative">
//                   <div className="flex flex-col justify-between">
//                     <div className="flex items-center justify-between gap-x-4">
//                       <div className="flex items-center gap-x-4">
//                         <Image
//                           className="h-10 w-10 rounded-full bg-gray-50"
//                           src={testimonial.author.imageUrl}
//                           width={40}
//                           height={40}
//                           alt={testimonial.author.name}
//                         />
//                         <div>
//                           <div className="font-semibold text-gray-900">
//                             {testimonial.author.name}
//                           </div>
//                           <a
//                             className="text-gray-600 hover:text-gray-800"
//                             href={testimonial.author.link}
//                             target="_blank"
//                             rel="noopener noreferrer"
//                           >{`@${testimonial.author.handle}`}</a>
//                         </div>
//                       </div>
//                       <a
//                         href={testimonial.author.link} // Using the link from the testimonial
//                         target="_blank"
//                         rel="noopener noreferrer"
//                         className="absolute top-4 right-4 z-10"
//                       >
//                         {/* LinkedIn SVG icon */}
//                         <svg
//                           aria-hidden="true"
//                           className="h-6 w-6 fill-slate-500"
//                           viewBox="0 0 24 24"
//                         >
//                           <path
//                             fill="currentColor"
//                             d="M20.5,0H3.5C1.6,0,0,1.6,0,3.5v17c0,1.9,1.6,3.5,3.5,3.5h17c1.9,0,3.5-1.6,3.5-3.5v-17C24,1.6,22.4,0,20.5,0z M7.3,18.8H3.9v-9.9h3.4V18.8z M5.6,7.9c-0.9,0-1.5-0.7-1.5-1.5s0.7-1.5,1.5-1.5s1.5,0.7,1.5,1.5S6.5,7.9,5.6,7.9z M18.9,18.8h-3.4v-5.2c0-1.2,0-2.8-1.7-2.8c-1.7,0-2,1.3-2,2.7v5.3h-3.4v-9.9h3.3v1.4h0c0.5-0.9,1.8-1.9,3.4-1.9c3.6,0,4.3,2.4,4.3,5.5V18.8z"
//                           />
//                         </svg>
//                       </a>
//                     </div>

//                     <blockquote className="my-4 text-gray-900">
//                       <p>{testimonial.body}</p>
//                     </blockquote>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

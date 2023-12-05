import Twitter from "../shared/icons/twitter";
import Image from "next/image";

const testimonials = [
  {
    body: "best thing is that all the save DocSend to PDF plugins that VCs use probably won't work 😁",
    author: {
      name: "Jonathan Reimer",
      handle: "jonathimer",
      imageUrl:
        "https://pbs.twimg.com/profile_images/1704777684046209024/_JdBcXWp_400x400.jpg",
      link: "https://twitter.com/jonathimer/status/1663651278872891395",
    },
  },
  {
    body: "This looks awesome!! Incredible work for an MVP – love how the link was automatically copied to clipboard when it's created! 🤩",
    author: {
      name: "Steven Tey",
      handle: "steventey",
      imageUrl:
        "https://pbs.twimg.com/profile_images/1506792347840888834/dS-r50Je_400x400.jpg",
      link: "https://twitter.com/steventey/status/1663611851807006721",
    },
  },
  {
    body: "looks so good! gonna have to steal that upload component 😍 congrats & thanks for the great idea 😄",
    author: {
      name: "alana goyal",
      handle: "alanaagoyal",
      imageUrl:
        "https://pbs.twimg.com/profile_images/1679538379070005248/jwGUle5U_400x400.jpg",
      link: "https://twitter.com/alanaagoyal/status/1663522718015270912",
    },
  },
  {
    body: "Currently getting a lot of use out of .@mfts0's \"papermark\" project! I'm looking to see how he implemented Resend/React Email into his NextAuth stack.",
    author: {
      name: "Lukas Lunzmann",
      handle: "lucaslunzmann",
      imageUrl:
        "https://pbs.twimg.com/profile_images/1589657534264213504/d0tljS03_400x400.jpg",
      link: "https://twitter.com/lucaslunzmann/status/1673052992541523968",
    },
  },
  {
    body: "😍 Papermark just became 10x more valuable with analytics on each page of Pitchdeck. ",
    author: {
      name: "Iuliia Shnai",
      handle: "shnai0",
      imageUrl:
        "https://pbs.twimg.com/profile_images/1668749063666147328/C0NyHT9B_400x400.jpg",
      link: "https://twitter.com/shnai0/status/1676626294077812736",
    },
  },
  {
    body: "Introducing Papermark 1.0 😃 An open-source alternative to DocSend that allows you to securely share documents.",
    author: {
      name: "Marc Seitz",
      handle: "mfts0",
      imageUrl:
        "https://pbs.twimg.com/profile_images/1176854646343852032/iYnUXJ-m_400x400.jpg",
      link: "https://twitter.com/mfts0/status/1663521261396320257",
    },
  },
  // More testimonials...
];

export default function Testimonials() {
  return (
    <div className="bg-white py-24 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-xl text-center">
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            2000 people love Papermark and actively use it
          </p>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-600">
            Do not take it from us, listen what our happy users say
          </p>
        </div>
        <div className="mx-auto mt-16 flow-root max-w-2xl sm:mt-20 lg:mx-0 lg:max-w-none">
          <div className="-mt-8 sm:-mx-4 sm:columns-2 sm:text-[0] lg:columns-3">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.author.handle}
                className="pt-8 sm:inline-block sm:w-full sm:px-4 relative"
              >
                <figure className="rounded-2xl hover:shadow-lg hover:border-gray-500 bg-white p-10 text-sm leading-6 border border-gray-300 relative">
                  {testimonial.author.link && ( // Conditional rendering based on the presence of link
                    <a
                      href={testimonial.author.link} // Using the link from the testimonial
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute top-4 right-4 z-10"
                    >
                      <Twitter className="w-5 h-5 text-gray-800" />
                    </a>
                  )}
                  <blockquote className="text-gray-900">
                    <p>{`${testimonial.body}`}</p>
                  </blockquote>
                  <figcaption className="mt-6 flex items-center gap-x-4">
                    <Image
                      className="h-10 w-10 rounded-full bg-gray-50"
                      src={testimonial.author.imageUrl}
                      width={40}
                      height={40}
                      alt=""
                    />
                    <div>
                      <div className="font-semibold text-gray-900">
                        {testimonial.author.name}
                      </div>
                      <div className="text-gray-600">{`@${testimonial.author.handle}`}</div>
                    </div>
                  </figcaption>
                </figure>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

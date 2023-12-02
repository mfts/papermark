import Image from "next/image";
import Link from "next/link";
import oneImg from "public/_static/day1.webp";
import twoImg from "public/_static/day2.png";
import threeImg from "public/_static/day3.png";
import fourImg from "public/_static/day4.jpg";
import fiveImg from "public/_static/day5.jpg";

const posts = [
  {
    id: 1,
    title: "Day 1",
    href: "#",
    imageUrl: oneImg,
    date: "Mon 04.12.",
    datetime: "2023-12-04",
    description: "Make some magic with documents your share or receive",
  },
  {
    id: 1,
    title: "Day 2",
    href: "#",
    imageUrl: twoImg,
    date: "Tue 05.12.",
    datetime: "2023-12-05",
    description:
      "Sharing documents and tracking progress from your favourite tools",
  },
  {
    id: 1,
    title: "Day 3",
    href: "#",
    imageUrl: threeImg,
    date: "Wed 06.12.",
    datetime: "2023-12-06",
    description: "Looking for right VC? We got your covered",
  },
  {
    id: 1,
    title: "Day 4",
    href: "#",
    imageUrl: fourImg,
    date: "Thu 07.12.",
    datetime: "2023-12-07",
    description: "Get your inbox ready",
  },
  {
    id: 1,
    title: "Day 5",
    href: "#",
    imageUrl: fiveImg,
    date: "Fri 08.12.",
    datetime: "2023-12-08",
    description: "Some Black box for surprise",
  },
  // More posts...
];

export default function DaysGrid() {
  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            5 Launches
          </h2>
          <p className="mt-2 text-lg leading-8 text-gray-600">
            Every day of the week. Here is a hint of what will be launched 😉
          </p>
        </div>
        <div className="mx-auto mt-12 grid max-w-2xl auto-rows-fr grid-cols-1 gap-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {posts.map((post) => (
            <article
              key={post.id}
              className="relative isolate flex flex-col justify-end overflow-hidden rounded-2xl bg-gray-900 px-8 pb-8 pt-80 sm:pt-48 lg:pt-80"
            >
              <Image
                src={post.imageUrl}
                alt=""
                className="absolute inset-0 -z-10 h-full w-full object-cover"
                fill
              />
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-gray-900 via-gray-900/40" />
              <div className="absolute inset-0 -z-10 rounded-2xl ring-1 ring-inset ring-gray-900/10" />

              <div className="flex flex-col gap-y-1 overflow-hidden text-sm leading-6 text-gray-300">
                <time dateTime={post.datetime} className="mr-8">
                  {post.date}
                </time>
                <div className="flex items-center gap-x-4">
                  <div className="flex gap-x-2.5">{post.description}</div>
                </div>
              </div>
              <h3 className="mt-3 text-lg font-semibold leading-6 text-white">
                <Link href={post.href}>
                  <span className="absolute inset-0" />
                  {post.title}
                </Link>
              </h3>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";

import { getHelpArticles } from "@/lib/content/help";

export default async function BlogIndex() {
  const posts = await getHelpArticles();
  return (
    <div className="bg-white py-24 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:mx-0">
          <h2 className="text-balance text-6xl text-gray-900 sm:text-6xl">
            Papermark Help Center
          </h2>
          {/* <p className="mt-2 text-balance text-lg leading-8 text-gray-500">
            how to share documents and create data rooms with Papermark
          </p> */}
        </div>
        <div className="mt-16 grid gap-2 md:grid-cols-2">
          {posts.map((post) => (
            <Link
              key={post?.data.slug}
              href={`/help/article/${post?.data.slug}`}
              className="group block"
            >
              <div className="group flex items-center justify-between px-4 py-4 hover:rounded-xl hover:bg-orange-500">
                <h3 className="text-lg font-normal text-gray-700 group-hover:text-white">
                  {post?.data.title}
                </h3>
                <span className="text-gray-500 transition duration-200 group-hover:text-orange-100">
                  <span className="hidden group-hover:inline-block">
                    &rarr;
                  </span>
                  <span className="inline-block group-hover:hidden">&gt;</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

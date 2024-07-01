import Link from "next/link";

import { getHelpArticles } from "@/lib/content/help";

export default async function BlogIndex() {
  const posts = await getHelpArticles();
  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:mx-0">
          <h2 className="text-balance text-6xl text-gray-900 sm:text-6xl">
            Papermark Help Center
          </h2>
          <p className="mt-2 text-balance text-lg leading-8 text-gray-500">
            Everything on how to share dcuments with Papermark
          </p>
        </div>
        <div className="mx-auto mt-10 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 border-t border-gray-200 pt-10 sm:mt-16 sm:pt-16 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {posts.map((post) => (
            <article
              key={post?.data.slug}
              className="flex max-w-xl flex-col items-start justify-between"
            >
              <div className="flex items-center gap-x-4 text-xs">
                <h1 className="text-balance text-2xl md:text-2xl">
                  {post?.data.title}
                </h1>
              </div>
              <p className="mt-1 text-balance text-xs text-gray-500 md:text-xs">
                {post?.data.summary}
              </p>

              <div className="group relative">
                <h3 className="mt-4 text-lg font-semibold leading-6 text-gray-900 group-hover:text-gray-600">
                  <Link
                    href={`/help/article/${post?.data.slug}`}
                    className="text-balance rounded-3xl border border-gray-500 bg-transparent px-4 py-2 text-xs font-light text-gray-500"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Read more
                  </Link>
                </h3>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

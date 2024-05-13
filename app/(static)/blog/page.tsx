import Link from "next/link";
import { getPostsRemote as getPosts } from "@/lib/content/blog";

export default async function BlogIndex() {
  const posts = await getPosts();
  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:mx-0">
          <h2 className="text-6xl text-balance text-gray-900 sm:text-6xl">
            Papermark Blog
          </h2>
          <p className="mt-2 text-lg leading-8 text-gray-500 text-balance">
            All insights on secure document sharing in 2024
          </p>
        </div>
        <div className="mx-auto mt-10 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 border-t border-gray-200 pt-10 sm:mt-16 sm:pt-16 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {posts.map((post) => (
            <article
              key={post?.data.slug}
              className="flex max-w-xl flex-col items-start justify-between"
            >
              <div className="flex items-center gap-x-4 text-xs">
                <h1 className="text-2xl md:text-2xl text-balance">
                  {post?.data.title}
                </h1>
              </div>
              <p className="mt-1 text-xs md:text-xs text-balance text-gray-500">
                {post?.data.summary}
              </p>

              <div className="group relative">
                <h3 className="mt-4 text-lg font-semibold leading-6 text-gray-900 group-hover:text-gray-600">
                  <Link
                    href={`/blog/${post?.data.slug}`}
                    className="text-gray-500 text-balance font-light text-xs rounded-3xl bg-transparent border border-gray-500 px-4 py-2"
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

import Link from "next/link";
import { getPosts } from "@/lib/content/blog"; // Adjust the import path as necessary
import { Button } from "@/components/ui/button";

// export async function generateStaticParams() {
//   const posts = await getPosts();
//   return posts.map((post) => ({ slug: post?.data.slug }));
// }

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
              {/* <time dateTime={post?.data.publishedAt} className="text-gray-500">
                {post?.data.publishedAt}
              </time> */}
              {/* <a
                  href={post.category.href}
                  className="relative z-10 rounded-full bg-gray-50 px-3 py-1.5 font-medium text-gray-600 hover:bg-gray-100"
                >
                  {post?.data.title}
                </a> */}

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

                  {/* <Button
                    variant="outline"
                    className="text-base rounded-3xl bg-transparent border-black"
                  >
                    Read more
                  </Button> */}
                </h3>
                {/* <p className="mt-5 line-clamp-3 text-sm leading-6 text-gray-600">
                  {post.description}
                </p> */}
              </div>
              {/* <div className="relative mt-8 flex items-center gap-x-4">
                <img
                  src={post.author.imageUrl}
                  alt=""
                  className="h-10 w-10 rounded-full bg-gray-50"
                />
                <div className="text-sm leading-6">
                  <a
                    href={post.author.href}
                    className="font-semibold text-gray-900"
                  >
                    {post.author.name}
                  </a>
                  <p className="text-gray-600">{post.author.role}</p>
                </div>
              </div> */}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

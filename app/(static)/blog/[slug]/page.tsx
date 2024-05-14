import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import BlurImage from "@/components/blur-image";
import { ContentBody } from "@/components/mdx/post-body";
import TableOfContents from "@/components/mdx/table-of-contents";

import { getPost, getPostsRemote as getPosts } from "@/lib/content/blog";
import { constructMetadata, formatDate } from "@/lib/utils";

export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((post) => ({ slug: post?.data.slug }));
}

export const generateMetadata = async ({
  params,
}: {
  params: {
    slug: string;
  };
}): Promise<Metadata> => {
  const post = (await getPosts()).find(
    (post) => post?.data.slug === params.slug,
  );
  const { title, summary: description, image } = post?.data || {};

  return constructMetadata({
    title: `${title} - Papermark`,
    description,
    image,
  });
};

export default async function BlogPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = await getPost(params.slug);
  if (!post) return notFound();

  return (
    <>
      <div className="mx-auto mb-10 w-full max-w-7xl px-4 md:px-8">
        <div className="flex max-w-screen-sm flex-col space-y-4 pt-16">
          <div className="flex items-center space-x-4">
            <time dateTime={post.data.publishedAt} className="text-sm">
              {formatDate(post.data.publishedAt)}
            </time>
          </div>
          <h1 className="text-balance text-4xl md:text-6xl">
            {post.data.title}
          </h1>
          <p className="text-xl text-gray-600">{post.data.summary}</p>

          <div className="flex flex-col items-center space-x-4 self-start">
            <Link
              href={`https://twitter.com/mfts0`}
              className="group flex items-center space-x-3"
              target="_blank"
              rel="noopener noreferrer"
            >
              <BlurImage
                src={`https://pbs.twimg.com/profile_images/1176854646343852032/iYnUXJ-m_400x400.jpg`}
                alt={`Marc Seitz`}
                width={40}
                height={40}
                className="rounded-full transition-all group-hover:brightness-90"
              />
              <div className="flex flex-col">
                <p className="font-semibold text-gray-700">Marc Seitz</p>
                <p className="text-sm text-gray-500">@mfts0</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-4 gap-10 px-4 py-10 md:px-8">
          <div className="relative col-span-4 mb-10 flex flex-col space-y-8 bg-white sm:border-r sm:border-orange-500 md:col-span-3">
            <div
              data-mdx-container
              className="prose prose-headings:font-medium prose-h2:mb-2 prose-h2:mt-10 first:prose-h2:mt-0 sm:max-w-screen-md sm:pr-2 md:pr-0"
            >
              <ContentBody>{post.body}</ContentBody>
            </div>
          </div>

          <div className="sticky top-14 col-span-1 hidden flex-col divide-y divide-gray-200 self-start sm:flex">
            <div className="flex flex-col space-y-4">
              <TableOfContents items={post.toc} />
            </div>
          </div>

          {/* <div className="sticky top-14 col-span-1 hidden flex-col divide-y divide-gray-200 self-start sm:flex">
            <div className="flex flex-col space-y-4">
              <p className="text-sm text-gray-500">Written by</p>
              <Link
                href={`https://twitter.com/mfts0`}
                className="group flex items-center space-x-3"
                target="_blank"
                rel="noopener noreferrer"
              >
                <BlurImage
                  src={`https://pbs.twimg.com/profile_images/1176854646343852032/iYnUXJ-m_400x400.jpg`}
                  alt={`Marc Seitz`}
                  width={40}
                  height={40}
                  className="rounded-full transition-all group-hover:brightness-90"
                />
                <div className="flex flex-col">
                  <p className="font-semibold text-gray-700">Marc Seitz</p>
                  <p className="text-sm text-gray-500">@mfts0</p>
                </div>
              </Link>
            </div>
          </div> */}
        </div>
      </div>
    </>
  );
}

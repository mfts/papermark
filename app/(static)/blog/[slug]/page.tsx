import { notFound } from "next/navigation";
import { allAuthors, allPosts } from "contentlayer/generated";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { cn, formatDate } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { Mdx } from "@/components/mdx-components";
import "@/styles/mdx.css";

interface PostPageProps {
  params: {
    slug: string[];
  };
}

async function getPostFromParams(params: any) {

  const post = allPosts.find((post) => post.slug === `/blog/${params.slug}`);

  if (!post) {
    null;
  }

  return post;
}

const BlogDetail = async ({ params }: any) => {
  const post = await getPostFromParams(params);
  const authors = post!.authors.map((author) =>
    allAuthors.find(({ slug }) => slug === `/authors/${author}`)
  );

  return (
    <div className="mt-20 font-display2">
      <article className="container relative max-w-3xl py-6 lg:py-10">
        <Link
          href="/blog"
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "absolute left-[-200px] top-14 hidden xl:inline-flex"
          )}
        >
          <Icons.chevronLeft className="mr-2 h-4 w-4" />
          See all posts
        </Link>
        <div>
          {post!.date && (
            <time
              dateTime={post!.date}
              className="block text-sm text-muted-foreground"
            >
              Published on {formatDate(post!.date)}
            </time>
          )}
          
          <h1 className="mt-2 font-display inline-block font-heading text-4xl leading-tight lg:text-5xl">
            {post!.title}
          </h1>
          {authors?.length ? (
            <div className="mt-4 flex space-x-4">
              {authors.map((author) =>
                author ? (
                  <Link
                    key={author._id}
                    href={`https://twitter.com/${author.twitter}`}
                    className="flex items-center space-x-2 text-sm"
                  >
                    <Image
                      src={`/_images/authors${author.avatar}`}
                      alt={author.title}
                      width={42}
                      height={42}
                      className="rounded-full bg-white"
                    />
                    <div className="flex-1 text-left leading-tight">
                      <p className="font-medium">{author.title}</p>
                      <p className="text-[12px] text-muted-foreground">
                        @{author.twitter}
                      </p>
                    </div>
                  </Link>
                ) : null
              )}
            </div>
          ) : null}
        </div>
        {post!.image && (
          <Image
            src={`/_images/blogs${post?.image}`}
            alt={post!.title}
            width={720}
            height={405}
            className="my-8 rounded-md border bg-muted transition-colors"
            priority
          />
        )}
        <Mdx code={post?.body!.code!} />
        <hr className="mt-12" />
        <div className="flex justify-center py-6 lg:py-10">
          <Link
            href="/blog"
            className={cn(buttonVariants({ variant: "ghost" }))}
          >
            <Icons.chevronLeft className="mr-2 h-4 w-4" />
            See all posts
          </Link>
        </div>
      </article>
    </div>
  );
};
export default BlogDetail;

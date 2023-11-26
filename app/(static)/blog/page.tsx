import Image from "next/image"
import Link from "next/link"
import { allPosts } from "contentlayer/generated"
import { compareDesc } from "date-fns"
import style from '@/components/web/header.module.css'
import { cn, formatDate } from "@/lib/utils"
import Background from "@/components/web/background/background"

export const metadata = {
  title: "Blog",
}

export default async function BlogPage() {
  const posts = allPosts
    .filter((post) => post.date)
    .sort((a, b) => {
      return compareDesc(new Date(a.date), new Date(b.date))
    })

  return (
    <div className="mt-20 container max-w-4xl py-6 lg:py-10">
      <Background />
      <div className="flex flex-col items-start gap-4 md:flex-row md:justify-between md:gap-8">
        <div className="flex-1 space-y-4">
          <h1 className="font-display inline-block font-heading text-4xl tracking-tight lg:text-5xl">
            From <span
                className={cn(
                  "bg-gradient-to-tr outline-none  from-purple-400 to-orange-300 via-rose-300 text-transparent bg-clip-text ",
                  style.magicText
                )}
              >
                Papermark
              </span>{" "}
          </h1>
          <p className="text-xl text-muted-foreground font-display2">
            Thoughts. Builds. Inspiration all in one
          </p>
        </div>
      </div>
      <hr className="my-8" />
      {posts?.length ? (
        <div className="font-display grid gap-10 sm:grid-cols-2">
          {posts.map((post, index) => (
            <article
              key={post._id}
              className="group relative flex flex-col space-y-2"
            >
              {post.image && (
                <Image
                  src={`/_images/blogs${post.image}`}
                  alt={post.title}
                  width={804}
                  height={452}
                  className="rounded-md border bg-muted transition-colors"
                  priority={index <= 1}
                />
              )}
              <h2 className="text-2xl font-extrabold">{post.title}</h2>
              {post.description && (
                <p className="text-muted-foreground font-display2">{post.description}</p>
              )}
              {post.date && (
                <p className="text-sm text-muted-foreground">
                  {formatDate(post.date)}
                </p>
              )}
              <Link href={post.slug} className="absolute inset-0">
                <span className="sr-only">View Article</span>
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <p>No posts published.</p>
      )}
    </div>
  )
}
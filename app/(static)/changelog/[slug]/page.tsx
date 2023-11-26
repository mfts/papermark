



import { Mdx } from "@/components/mdx-components";


import { allChangelogs } from "contentlayer/generated";
import { formatDate } from "@/lib/utils";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import Background from "@/components/web/background/background";
export async function generateStaticParams() {
    return allChangelogs.map((post) => ({
        slug: post.slug,
    }));
}

export async function generateMetadata({
    params,
}: {
    params: { slug: string };
}): Promise<Metadata | undefined> {
    const post = allChangelogs.find((post) => post.slug === params.slug);
    if (!post) {
        return;
    }

    const { title, date: publishedTime, summary: description, image, slug } = post;

    return {
        title: `${title} - Loglib Changelog`,
        description,
        openGraph: {
            title: `${title} - Loglib Changelog`,
            description,
            type: "article",
            publishedTime,
            url: `https://loglib.io/changelog/${slug}`,
            images: [
                {
                    url: image,
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [image],
        },
    };
}

export default async function ChangelogPost({
    params,
}: {
    params: { slug: string };
}) {
    console.log("The post before: " ,allChangelogs , params)
    const post = allChangelogs.find((post) => post.slug === `/changelog/${params.slug}`);
    console.log('The post : ', post)
    if (!post) {
        notFound();
    }

    return (
        <div className="font-display2   mx-auto my-20 grid max-w-screen-xl md:grid-cols-4 md:px-20">
            <Background />
            
            <div className="sticky top-10 hidden self-start md:col-span-1 md:block">
                <Link
                    href="/changelog"
                    className="text-sm text-gray-500 transition-colors hover:text-gray-800"
                >
                    ← Back to Changelog
                </Link>
            </div>
            <div className="flex flex-col space-y-8 md:col-span-3">
                <div className="mx-5 grid gap-5 md:mx-0">
                    <div className="flex flex-col">
                        <Link href="/changelog" className="my-5 text-sm text-gray-500 md:hidden">
                            ← Back to Changelog
                        </Link>
                        <time
                            dateTime={post.date}
                            className="flex items-center text-sm text-gray-500 md:text-base"
                        >
                            {formatDate(post.date)}
                        </time>
                    </div>
                    <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                        {post.title}
                    </h1>
                </div>
                <Image
                   src={`/_images/changelogs/${post.image}`}
                    alt={post.title}
                    width={1200}
                    height={900}
                    priority
                    
                    className="border border-gray-100 dark:border-stone-800 md:rounded-2xl"
                />
                <Mdx code={post.body.code} />
                <div className="mt-10 flex justify-end border-t border-gray-200 pt-5">
                    <Link
                        href={`https://github.com/Kinfe123/papermark/blob/changelog-feat/contents/changelog/${params.slug}.mdx`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-gray-500 transition-colors hover:text-gray-800"
                    >
                        <p>Found a typo? Edit this page →</p>
                    </Link>
                </div>
            </div>
        </div>
    );
}
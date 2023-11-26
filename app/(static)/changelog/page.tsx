import { Mdx } from "@/components/mdx-components";
import { Icons } from "@/components/icons";

import { formatDate } from "@/lib/utils";
import {  allChangelogs } from "contentlayer/generated";
import Link from "next/link";
import Image from 'next/image'
import Background from "@/components/web/background/background";

export const metadata= {
    title: 'Changelogs',
    desciption: "THe collection of changelogs"
}
export default async function Changelog() {

    return (
        <div className="font-display2 mx-auto max-w-screen-xl md:px-20 py-10">
            <Background />
            <div className="relative flex flex-col border-b border-gray-200 py-20">
                <div className="md:col-span-1" />
                <div className="flex flex-col items-center justify-center space-y-2 md:col-span-3 md:mx-0">
                    <h1 className="font-display text-center  text-4xl font-bold tracking-tight md:text-5xl">
                        Changelog
                    </h1>
                    <p className="text-lg text-center text-gray-500 dark:text-gray-200">
                       Every Details of changes will be exposed here.
                    </p>
                </div>
                {/* <div className="absolute bottom-2 right-0 flex items-center space-x-2">
                    <p className="text-sm text-gray-500">Subscribe to updates →</p>
                    <Link
                        href="https://twitter.com/loglib_io"
                        className="rounded-full bg-blue-100 p-2 transition-colors hover:bg-blue-200"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Icons.twitter className="h-4 w-4 text-[#1d9bf0] fill-black" />
                    </Link>
                </div> */}
            </div>

            <div className="divide-y divide-gray-200 ">
                {allChangelogs.filter(post => !post.draft)
                    .sort((a, b) => {
                        if (new Date(a.date) > new Date(b.date)) {
                            return -1;
                        }
                        return 1;
                    })
                    .map((post, idx) => (
                        <div key={post._id} className="flex mt-10 flex-col justify-center items-center max-w-screen-xl">
                              
                            <div className="md:col-span-3 ">
                                <div className="flex flex-col gap-6">
                                    <Link href={`${post.slug}`}>
                                    
                                        <Image src={`/_images/changelogs/${post.image}`} width={1000} height={1000}  alt={post.slug}  className="w-full h-[500px] rounded-2xl border-white border-2"/>
                                    </Link>
                                    <Link
                                        href={`${post.slug}`}
                                        className="group mx-5 flex items-center space-x-3 md:mx-0"
                                    >
                                        <time
                                            dateTime={post.date}
                                            className="text-sm text-gray-500 transition-all group-hover: md:hidden"
                                        >
                                            {formatDate(post.date)}
                                        </time>
                                    </Link>
                                    <div>
                                        
                                    </div>
                                    <Link href={`${post.slug}`} className="mx-5 md:mx-0">
                                        <h2 className="font-display text-3xl font-bold tracking-tight  hover:underline hover:decoration-1 hover:underline-offset-4 md:text-4xl">
                                            {post.title}
                                        </h2>
                                    </Link>
                                    <div className="mx-5 md:mx-0">

                                    <Mdx code={post.body.code} />
                                    </div>
                                </div>
                            </div>
                            
                            
                        </div>
                    ))}
            </div>
        </div>
    );
}


import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import BlurImage from "@/components/blur-image";
import { ContentBody } from "@/components/mdx/post-body";
import TableOfContents from "@/components/mdx/table-of-contents";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { getHelpArticle, getHelpArticles } from "@/lib/content/help";
import { constructMetadata, formatDate } from "@/lib/utils";

export async function generateStaticParams() {
  const articles = await getHelpArticles();
  return articles.map((article) => ({ slug: article?.data.slug }));
}

export const generateMetadata = async ({
  params,
}: {
  params: {
    slug: string;
  };
}): Promise<Metadata> => {
  const article = (await getHelpArticles()).find(
    (article) => article?.data.slug === params.slug,
  );
  const { title, summary: description, image } = article?.data || {};

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
  const article = await getHelpArticle(params.slug);
  if (!article) return notFound();

  // const category = article.data.categories ? article.data.categories[0] : "";

  return (
    <>
      <div className="mx-auto mb-10 w-full max-w-7xl px-4 md:px-8">
        <div className="flex max-w-screen-sm flex-col space-y-4 pt-16">
          <div className="flex items-center space-x-4">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Help Center</BreadcrumbPage>
                </BreadcrumbItem>
                {/* <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href={`/help/category/${category}`}>{category}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem> */}
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{article.data.title}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <h1 className="text-balance text-4xl md:text-5xl">
            {article.data.title}
          </h1>
          <p className="text-lg text-gray-600">{article.data.summary}</p>

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
          <div className="flex items-center space-x-4 text-gray-700">
            <time dateTime={article.data.publishedAt} className="text-sm">
              Last updated {formatDate(article.data.publishedAt, true)}
            </time>
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
              <ContentBody>{article.body}</ContentBody>
            </div>
          </div>

          <div className="sticky top-14 col-span-1 hidden flex-col divide-y divide-gray-200 self-start sm:flex">
            <div className="flex flex-col space-y-4">
              <TableOfContents items={article.toc} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

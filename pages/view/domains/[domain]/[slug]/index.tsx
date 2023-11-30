import LoadingSpinner from "@/components/ui/loading-spinner";
import DocumentView from "@/components/view/document-view";
import { useDomainLink } from "@/lib/swr/use-link";
import { CustomUser, LinkWithDocument } from "@/lib/types";
import NotFound from "@/pages/404";
import { GetStaticPropsContext } from "next";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";

export default function ViewPage({ link }: { link: LinkWithDocument }) {
  const router = useRouter();
  // const { link, error } = useDomainLink();
  const { data: session, status } = useSession();

  // if (error && error.status === 404) {
  //   return <NotFound />;
  // }

  if (!link || status === "loading" || router.isFallback) {
    return (
      <div className="h-screen flex items-center justify-center">
        <LoadingSpinner className="h-20 w-20" />
      </div>
    );
  }

  const {
    expiresAt,
    emailProtected,
    password: linkPassword,
    isArchived,
  } = link;

  const { email: userEmail, id: userId } = (session?.user as CustomUser) || {};

  // If the link is expired, show a 404 page
  if (expiresAt && new Date(expiresAt) < new Date()) {
    <NotFound message="Sorry, the link you're looking for is expired." />;
  }

  if (isArchived) {
    return (
      <NotFound message="Sorry, the file you're looking for is archived." />
    );
  }

  if (emailProtected || linkPassword) {
    return (
      <DocumentView
        link={link}
        userEmail={userEmail}
        userId={userId}
        isProtected={true}
      />
    );
  }

  return (
    <DocumentView
      link={link}
      userEmail={userEmail}
      userId={userId}
      isProtected={false}
    />
  );
}

export async function getStaticProps(context: GetStaticPropsContext) {
  // const router = useRouter()
  // const { domain, slug } = router.query as {
  //   domain: string;
  //   slug: string;
  // };
  const { domain, slug } = context.params as { domain: string; slug: string };

  console.log(context.params);

  // Fetch the link
  const res = await fetch(
    `${process.env.NEXTAUTH_URL}/api/links/domains/${encodeURIComponent(
      domain,
    )}/${encodeURIComponent(slug)}`,
  );
  if (!res.ok) {
    return { notFound: true };
  }
  const link = (await res.json()) as LinkWithDocument;

  console.log(link);

  return {
    props: {
      link,
    },
  };
}

export async function getStaticPaths() {
  return {
    paths: [],
    fallback: true,
  };
}

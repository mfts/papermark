import { GetServerSideProps } from "next";

import prisma from "@/lib/prisma";

import { DownloadsPanel } from "@/components/view/dataroom/downloads-panel";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const domain = context.params?.domain as string;
  const slug = context.params?.slug as string;
  if (!domain || !slug) {
    return { notFound: true };
  }
  const link = await prisma.link.findUnique({
    where: {
      domainSlug_slug: { slug, domainSlug: domain },
    },
    select: { id: true },
  });
  if (!link) {
    return { notFound: true };
  }
  return { props: { linkId: link.id } };
};

export default function DomainDownloadsPage({
  linkId,
}: {
  linkId: string;
}) {
  return <DownloadsPanel linkId={linkId} />;
}

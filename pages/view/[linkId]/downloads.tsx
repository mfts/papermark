import { GetServerSideProps } from "next";
import { useRouter } from "next/router";

import { Loader2 } from "lucide-react";

import { DownloadsPanel } from "@/components/view/dataroom/downloads-panel";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const linkId = context.params?.linkId as string;
  return { props: { linkId: linkId ?? null } };
};

export default function ViewDownloadsPage({
  linkId: linkIdProp,
}: {
  linkId: string | null;
}) {
  const router = useRouter();
  const linkId = (router.query.linkId as string) ?? linkIdProp ?? undefined;

  if (!linkId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <DownloadsPanel linkId={linkId} />;
}

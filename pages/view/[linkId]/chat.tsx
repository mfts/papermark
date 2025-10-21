import Link from "next/link";

import { useEffect } from "react";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { type Message } from "ai/react";
import { getServerSession } from "next-auth";
import { usePlausible } from "next-plausible";

import { getFile } from "@/lib/files/get-file";
import prisma from "@/lib/prisma";
import { usePlan } from "@/lib/swr/use-billing";
import { CustomUser } from "@/lib/types";

import { Chat } from "@/components/chat/chat";
import Sparkle from "@/components/shared/icons/sparkle";
import { Button } from "@/components/ui/button";

export const getServerSideProps = async (context: any) => {
  const { linkId } = context.params;
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return {
      redirect: {
        permanent: false,
        destination: `/login?next=/view/${linkId}/chat`,
      },
    };
  }

  const link = await prisma.link.findUnique({
    where: { id: linkId, deletedAt: null },
    select: {
      document: {
        select: {
          id: true,
          assistantEnabled: true,
          versions: {
            where: { isPrimary: true },
            select: {
              pages: {
                where: { pageNumber: 1 },
                select: {
                  file: true,
                  storageType: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!link) {
    return {
      notFound: true,
    };
  }

  if (!link.document!.assistantEnabled) {
    return {
      notFound: true,
    };
  }

  const userId = (session.user as CustomUser).id;

  // create or fetch threadId
  const res = await fetch(
    `${process.env.NEXTAUTH_URL}/api/assistants/threads`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        documentId: link!.document!.id,
        userId: userId,
      }),
    },
  );

  if (!res.ok) {
    return {
      notFound: true,
    };
  }

  const { threadId, messages } = await res.json();

  const firstPage = link.document!.versions[0].pages[0]
    ? await getFile({
        type: link.document!.versions[0].pages[0].storageType,
        data: link.document!.versions[0].pages[0].file,
      })
    : "";

  return {
    props: {
      threadId,
      messages: messages || [],
      firstPage,
      userId: userId,
      linkId: linkId,
    },
  };
};

export default function ChatPage({
  threadId,
  messages,
  firstPage,
  userId,
  linkId,
}: {
  threadId: string;
  messages: Message[];
  firstPage: string;
  userId: string;
  linkId: string;
}) {
  const { plan } = usePlan();
  const plausible = usePlausible();

  useEffect(() => {
    plausible("assistantViewedFromLink", { props: { linkId: linkId } });
  }, []);

  return (
    <>
      <Nav linkId={linkId} />
      <Chat
        initialMessages={messages}
        threadId={threadId}
        firstPage={firstPage}
        userId={userId}
        plan={plan}
      />
    </>
  );
}

function Nav({ linkId }: { linkId: string }) {
  return (
    <nav className="fixed inset-x-0 top-0 z-10 bg-black">
      <div className="mx-auto px-2 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
            <div className="flex flex-shrink-0 items-center gap-x-2">
              <p className="text-2xl font-bold tracking-tighter text-white">
                Papermark
              </p>
              <Sparkle className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
            <Link href={`/view/${linkId}`}>
              <Button variant="secondary">Back to document</Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

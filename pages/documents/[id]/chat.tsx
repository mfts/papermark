import { type Message } from "ai/react";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { CustomUser } from "@/lib/types";
import { Chat } from "@/components/chat/chat";
import Sparkle from "@/components/shared/icons/sparkle";
import { usePlan } from "@/lib/swr/use-billing";

export const getServerSideProps = async (context: any) => {
  const { id } = context.params;
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return {
      redirect: {
        permanent: false,
        destination: `/login?next=/view/${id}/chat`,
      },
    };
  }

  const document = await prisma.document.findUnique({
    where: { id },
    select: {
      id: true,
      versions: {
        where: { isPrimary: true },
        select: {
          pages: {
            where: { pageNumber: 1 },
            select: {
              file: true,
            },
          },
        },
      },
    },
  });

  if (!document) {
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
        documentId: document.id,
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

  return {
    props: {
      threadId,
      messages: messages || [],
      firstPage: document.versions[0].pages[0].file,
      userId,
    },
  };
};

export default function ChatPage({
  threadId,
  messages,
  firstPage,
  userId,
}: {
  threadId: string;
  messages: Message[];
  firstPage: string;
  userId: string;
}) {
  const { plan } = usePlan();
  return (
    <>
      <Nav />
      <Chat
        initialMessages={messages}
        threadId={threadId}
        firstPage={firstPage}
        userId={userId}
        plan={plan?.plan}
      />
    </>
  );
}

function Nav() {
  return (
    <nav className="bg-black fixed top-0 inset-x-0 z-10">
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
            <div className="bg-gray-900 text-white rounded-md px-3 py-2 text-sm font-medium">
              {/* <span>{pageNumber}</span>
              <span className="text-gray-400"> / {numPages}</span> */}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

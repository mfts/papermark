import { Message, experimental_useAssistant as useAssistant } from "ai/react";
import { useEffect, useRef, useState } from "react";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { CustomUser } from "@/lib/types";
import { Chat } from "@/components/chat/chat";

const roleToColorMap: Record<Message["role"], string> = {
  system: "red",
  user: "black",
  function: "blue",
  assistant: "green",
};

const roleToNameMap: Record<Message["role"], string> = {
  system: "System",
  user: "You",
  function: "Function",
  assistant: "Papermark Assistant",
};

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

  const document = await prisma.link.findUnique({
    where: { id: linkId },
    select: {
      document: {
        select: {
          id: true,
        },
      },
    },
  });

  // create or fetch threadId
  const res = await fetch(
    `${process.env.NEXTAUTH_URL}/api/assistants/threads`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        documentId: document!.document.id,
        userId: (session.user as CustomUser).id,
      }),
    },
  );

  if (!res.ok) {
    return {
      notFound: true,
    };
  }

  const { threadId, messages } = await res.json();

  if (!document) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      threadId,
      messages: messages || [],
    },
  };
};

export default function ChatPage({
  threadId,
  messages,
}: {
  threadId: string;
  messages: Message[];
}) {
  return (
    <>
      <Chat initialMessages={messages} threadId={threadId} />
    </>
  );
}

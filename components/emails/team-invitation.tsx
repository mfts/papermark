import React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Tailwind,
} from "@react-email/components";

export default function TeamInvitation({
  senderName,
  senderEmail,
  teamName,
  teamId,
  token,
  to,
}: {
  senderName: string;
  senderEmail: string;
  teamName: string;
  teamId: string;
  token: string;
  to: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>Team Invitation</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="my-10 mx-auto p-5 w-[465px]">
            <Heading className="text-2xl font-normal text-center p-0 mt-4 mb-8 mx-0">
              <span className="font-bold tracking-tighter">Papermark</span>
            </Heading>
            <Heading className="text-xl font-seminbold text-center p-0 mt-4 mb-8 mx-0">
              Team Invitation
            </Heading>
            <Text className="text-sm leading-6 text-black">
              You are invited by {senderName}-{senderEmail} to join
              {teamName}. please click the link below to accept the invitation.
              \n\n{process.env.NEXTAUTH_URL}/api/teams/{teamId}
              /invite?email=${to}&token={token}
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

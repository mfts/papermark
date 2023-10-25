import React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Tailwind,
  Link,
  Hr,
} from "@react-email/components";

const LoginLink = ({ email, url }: { email: string; url: string }) => {
  return (
    <Html>
      <Head />
      <Preview>Your Papermark Login Link</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-10 max-w-[500px] rounded border border-solid border-gray-200 px-10 py-5">
            <Heading className="mx-0 my-7 p-0 text-center text-xl font-semibold text-black">
              Your <span className="font-bold tracking-tighter">Papermark</span>{" "}
              Login Link
            </Heading>
            <Text className="text-sm leading-6 text-black">
              Welcome to Papermark!
            </Text>
            <Text className="text-sm leading-6 text-black">
              Please click the magic link below to sign in to your account.
            </Text>
            <Section className="my-8 text-center">
              <Link
                className="bg-black rounded text-white text-xs p-2 px-6 font-semibold no-underline text-center"
                href={url}
              >
                Sign in
              </Link>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default LoginLink;

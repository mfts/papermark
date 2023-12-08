import hanko from "@/lib/hanko";
import { CustomUser } from "@/lib/types";
import { type Session } from "next-auth";
import prisma from "@/lib/prisma";

export async function startServerPasskeyRegistration({
  session,
}: {
  session: Session;
}) {
  if (!session) throw new Error("Not logged in");

  const sessionUser = session.user as CustomUser;

  const user = await prisma.user.findUnique({
    where: { email: sessionUser.email as string },
    select: { id: true, name: true },
  });

  const createOptions = await hanko.registration.initialize({
    userId: user!.id,
    username: user!.name || "",
  });

  return createOptions;
}

// This is *your* server-side code; you need to implement this yourself.
// NextAuth takes care of logging in the user after they have registered their passkey.
export async function finishServerPasskeyRegistration({
  credential,
  session,
}: {
  credential: any;
  session: Session;
}) {
  if (!session) throw new Error("Not logged in");

  await hanko.registration.finalize(credential);

  // const sessionUser = session.user as CustomUser;

  // Now the user has registered their passkey and can use it to log in.

  // const user = await prisma.user.update({
  //   where: { email: sessionUser.email as string },
  //   select: { id: true },
  // });
}

"use server";

import hanko from "@/lib/hanko";
import { CustomUser } from "@/lib/types";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";

export async function startServerPasskeyRegistration() {
  const session = await getServerSession();
  if (!session) throw new Error("Not logged in");

  const sessionUser = session.user as CustomUser;

  const user = await prisma.user.findUnique({
    where: { email: sessionUser.email as string },
    select: { id: true, name: true },
  });

  console.log("user prisma", user);

  const createOptions = await hanko.registration.initialize({
    userId: user!.id,
    username: user!.name,
  });

  return createOptions;
}

// This is *your* server-side code; you need to implement this yourself.
// NextAuth takes care of logging in the user after they have registered their passkey.
export async function finishServerPasskeyRegistration(credential: any) {
  const session = await getServerSession();
  if (!session) throw new Error("Not logged in");

  await hanko.registration.finalize(credential);

  // Now the user has registered their passkey and can use it to log in.

  const user = await prisma.user.findUnique({
    where: { id: (session.user as CustomUser).id },
    select: { id: true },
  });

  console.log("user has registered their passkey", user?.id);

  // if (user) {
  //   user.hasPasskeys = true;
  // }
}

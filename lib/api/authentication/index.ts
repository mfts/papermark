import prisma from "@/lib/prisma";

export async function generateAuthenticationCode(
  length: number,
  identifier: string,
  duration: "PERMANENT" | "ONE-TIME",
) {
  const authenticationCode = generateUniqueString(length);
  const expiresAt =
    duration === "ONE-TIME"
      ? new Date(Date.now() + 10 * 60 * 1000) //10 minutes
      : new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000); //100 years
  //Save authentication code to database
  await prisma.verificationToken.create({
    data: {
      token: authenticationCode,
      identifier,
      expiresAt,
    },
  });
  return authenticationCode;
}

function generateUniqueString(length: number) {
  const charset =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let uniqueString = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    uniqueString += charset.charAt(randomIndex);
  }
  return uniqueString;
}

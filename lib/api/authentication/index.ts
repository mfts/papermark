import prisma from "@/lib/prisma";

export async function generateAuthenticationCode(
  length: number,
  email: string,
  identifier: string,
  type: "DATAROOM" | "DOCUMENT",
  duration: "PERMANENT" | "ONE-TIME",
) {
  const authenticationCode = generateUniqueString(length);
  //Save authentication code to database
  await prisma.authenticationCode.create({
    data: {
      email,
      code: authenticationCode,
      identifier,
      permanent: duration === "PERMANENT" ? true : false,
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

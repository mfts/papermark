import prisma from "../prisma";

export async function fetchBlobFile(blobURL: string) {
  try {
    const response = await fetch(blobURL);
    const blob = await response.blob();
    const buffer = await blob.arrayBuffer();
    const base64String = Buffer.from(buffer).toString('base64');
    return base64String;
  } catch (error) {
    console.error('Error fetching the blob file:', error);
    return null;
  }
}

export async function generateAuthenticationCodeURL(email: string, linkId: string, invited: boolean, documentLink?: string) {
  const authenticationCode = generateUniqueString(12);
  await prisma.emailAuthenticationCode.create({
    data: {
      email,
      code: authenticationCode,
      linkId,
      invited
    }
  }) 
  const URL = documentLink
   ? `${documentLink}?authenticationCode=${authenticationCode}` 
   : `${process.env.NEXTAUTH_URL}/view/${linkId}?authenticationCode=${authenticationCode}`
  return URL;
}

function generateUniqueString(length: number) {
  const charset = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"; // You can customize this as needed.
  let uniqueString = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    uniqueString += charset.charAt(randomIndex);
  }

  return uniqueString;
}
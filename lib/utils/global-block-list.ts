import { isEmailMatched } from "@/lib/utils/email-domain";
import { validateEmail } from "@/lib/utils/validate-email";

export function checkGlobalBlockList(
  email: string | undefined,
  globalBlockList: string[] | undefined,
): { isBlocked: boolean; error?: string } {
  if (!email || !globalBlockList || globalBlockList.length === 0) {
    return { isBlocked: false };
  }

  if (!validateEmail(email)) {
    return {
      isBlocked: false,
      error: "Invalid email address",
    };
  }

  const isBlocked = globalBlockList.some((blockedEntry) =>
    isEmailMatched(email, blockedEntry),
  );

  return { isBlocked };
}

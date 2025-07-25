import { isEmailMatched } from "@/lib/utils/email-domain";

export function isEmailAllowedByAllowList(
    email: string,
    linkAllowList: string[] | null,
    allowListGroup: { allowList: string[] } | null
): boolean {
    if (!email || typeof email !== "string" || !email.includes("@")) {
        return false;
    }
    const combinedAllowList = new Set<string>();

    if (linkAllowList && linkAllowList.length > 0) {
        linkAllowList.forEach(item => combinedAllowList.add(item));
    }

    if (allowListGroup?.allowList && allowListGroup.allowList.length > 0) {
        allowListGroup.allowList.forEach(item => combinedAllowList.add(item));
    }

    if (combinedAllowList.size === 0) {
        return true;
    }
    return Array.from(combinedAllowList).some((allowed) => isEmailMatched(email, allowed));
} 
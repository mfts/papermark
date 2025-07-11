import { validDomainRegex } from "@/lib/domains";

export function isValidDomain(domain: string): boolean {
    if (!domain || typeof domain !== "string") {
        return false;
    }
    const sanitizedDomain = domain.trim().toLowerCase();
    return validDomainRegex.test(sanitizedDomain);
} 
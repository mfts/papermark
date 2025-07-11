import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import dns from "dns/promises";

import {
    getConfigResponse,
    getDomainResponse,
    validDomainRegex,
} from "@/lib/domains";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

import { authOptions } from "../../../auth/[...nextauth]";

type DomainCheckStatus = "invalid" | "conflict" | "available" | "has site" | "error";

interface DomainCheckResponse {
    status: DomainCheckStatus;
    message?: string;
    error?: string;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise((resolve, reject) => {
        const id = setTimeout(() => reject(new Error("Timeout")), timeoutMs);
        promise.then((res) => {
            clearTimeout(id);
            resolve(res);
        }).catch((err) => {
            clearTimeout(id);
            reject(err);
        });
    });
}

function normalizeDomain(input: string) {
    return input.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
}

function validateDomain(domain: string): { isValid: boolean; error?: string } {
    if (!validDomainRegex.test(domain)) {
        return { isValid: false, error: "Invalid domain format" };
    }

    if (domain.toLowerCase().includes("papermark")) {
        return { isValid: false, error: "Domain cannot contain 'papermark'" };
    }

    return { isValid: true };
}

async function checkDomainConflict(domain: string): Promise<boolean> {
    const existingDomain = await prisma.domain.findFirst({
        where: { slug: domain },
    });
    return !!existingDomain;
}

async function isVercelSiteConfigured(domain: string): Promise<boolean> {
    try {
        const [domainJson, configJson] = await Promise.all([
            getDomainResponse(domain),
            getConfigResponse(domain),
        ]);

        if (domainJson?.error?.code !== "not_found") {
            if (configJson?.conflicts?.length > 0) {
                return true;
            }
            if (domainJson?.verified) {
                return true;
            }
        }
        return false;
    } catch (e) {
        return false;
    }
}

async function isSiteLive(domain: string): Promise<boolean> {
    const urls = [`https://${domain}`, `http://${domain}`];

    for (const url of urls) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            const response = await fetch(url, {
                method: "HEAD",
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            if (response.ok) return true;
        } catch (e) {
            if (e instanceof DOMException && e.name === "AbortError") {
                continue;
            }
            continue;
        }
    }
    return false;
}

async function hasDnsRecords(domain: string): Promise<boolean> {
    try {
        const records = await withTimeout(dns.resolve(domain), 3000);
        return records.length > 0;
    } catch (e) {
        return false;
    }
}

async function hasSiteConfigured(domain: string): Promise<boolean> {
    try {
        const results = await Promise.all([
            isVercelSiteConfigured(domain),
            isSiteLive(domain),
            hasDnsRecords(domain),
        ]);
        return results.some(result => result);
    } catch (error) {
        console.error("Error checking site configuration:", error);
        return false;
    }
}

async function verifyTeamAccess(teamId: string, userId: string): Promise<boolean> {
    const team = await prisma.team.findFirst({
        where: {
            id: teamId,
            users: {
                some: {
                    userId: userId,
                },
            },
        },
        select: { id: true },
    });

    return !!team;
}

async function checkDomainAvailability(domain: string): Promise<DomainCheckResponse> {
    const validation = validateDomain(domain);
    if (!validation.isValid) {
        return {
            status: "invalid",
            error: validation.error,
        };
    }

    const hasConflict = await checkDomainConflict(domain);
    if (hasConflict) {
        return {
            status: "conflict",
            error: "This domain is already in use.",
        };
    }

    try {
        const hasSite = await hasSiteConfigured(domain);
        if (hasSite) {
            return {
                status: "has site",
                message: `The domain ${domain} already has a site connected.`,
            };
        }

        return {
            status: "available",
            message: `The domain ${domain} is ready to connect`,
        };
    } catch (error) {
        console.error("Domain validation error:", error);
        return {
            status: "error",
            error: "Failed to validate domain",
        };
    }
}

export default async function handle(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    if (req.method !== "GET") {
        res.setHeader("Allow", ["GET"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const session = await getServerSession(req, res, authOptions);
    if (!session) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const { teamId, domain } = req.query as { teamId: string; domain: string };

    if (!domain || typeof domain !== "string") {
        return res
            .status(400)
            .json({ status: "invalid", error: "A domain is required" });
    }

    const sanitizedDomain = normalizeDomain(domain);
    const hasTeamAccess = await verifyTeamAccess(teamId, (session.user as CustomUser).id);
    if (!hasTeamAccess) {
        return res.status(403).json({ error: "Unauthorized to access this team" });
    }
    const result = await checkDomainAvailability(sanitizedDomain);

    const statusCode = result.status === "error" ? 500 : 200;
    return res.status(statusCode).json(result);
} 
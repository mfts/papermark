import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

const EMAIL_DOMAINS_FILE = path.join(process.cwd(), "lib/data/email-domains-unique.csv");

let freeEmailDomains: Set<string> | null = null;

export async function isPublicEmailDomain(email: string): Promise<boolean> {
    let result = false;

    if (!freeEmailDomains) {
        try {
            const fileContent = fs.readFileSync(EMAIL_DOMAINS_FILE, "utf-8");
            const records = parse(fileContent, {
                skip_empty_lines: true,
                columns: false,
            });
            freeEmailDomains = new Set(records.map((record: string[]) => record[0].toLowerCase()));
        } catch (error) {
            console.error("Error reading email domains file:", error);
            return result;
        }
    }

    const domain = email.split("@")[1]?.toLowerCase();
    if (domain && freeEmailDomains) {
        result = freeEmailDomains.has(domain);
    }

    return result;
} 
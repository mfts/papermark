import { logger } from "@trigger.dev/sdk/v3";
import { createHash } from 'crypto';

let tiktokenModule: any = null;
let cl100k_base: any = null;
let singletonTokenizer: any = null;

try {
    tiktokenModule = require("js-tiktoken/lite");
    cl100k_base = require("js-tiktoken/ranks/cl100k_base");
    singletonTokenizer = new tiktokenModule.Tiktoken(cl100k_base);
} catch (error) {
    logger.warn("Failed to import js-tiktoken module, will use fallback token counting", { error });
}

export function calculateTokenCount(text: string, tokenizer?: any): number {
    // Use provided tokenizer if available
    if (tokenizer) {
        try {
            return tokenizer.encode(text).length;
        } catch (error) {
            logger.warn("Failed to calculate token count with provided tokenizer, using singleton", { error });
        }
    }

    // Use singleton tokenizer for better performance
    if (singletonTokenizer) {
        try {
            const tokens = singletonTokenizer.encode(text);
            return tokens.length;
        } catch (error) {
            logger.warn("Failed to calculate token count with singleton tokenizer, using fallback", { error });
        }
    }

    return Math.ceil(text.length / 4);
}

export function generateLightweightHash(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
}


export function cleanTextForChunking(markdown: string): string {
    if (!markdown) return '';

    return markdown
        .replace(/\r\n/g, '\n')
        .replace(/---PAGE_BREAK---/gi, '\n\n')
        .replace(/<!--\s*page-break\s*-->/gi, '\n\n')
        .replace(/<div[^>]*class\s*=\s*["'][^"']*page-break[^"']*["'][^>]*>.*?<\/div>/gi, '\n\n')
        .replace(/<hr[^>]*class\s*=\s*["'][^"']*page-break[^"']*["'][^>]*>/gi, '\n\n')
        .replace(/<[^>]+>/g, '')
        .replace(/\u00A0|&nbsp;/g, ' ')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}


export function createPageRanges(pageNumbers: number[]): string[] {
    if (pageNumbers.length === 0) return ['1'];
    if (pageNumbers.length === 1) return [pageNumbers[0].toString()];

    const ranges: string[] = [];
    let start = pageNumbers[0];
    let end = pageNumbers[0];

    for (let i = 1; i < pageNumbers.length; i++) {
        if (pageNumbers[i] === end + 1) {
            end = pageNumbers[i];
        } else {
            ranges.push(start === end ? start.toString() : `${start}-${end}`);
            start = pageNumbers[i];
            end = pageNumbers[i];
        }
    }

    ranges.push(start === end ? start.toString() : `${start}-${end}`);
    return ranges;
}


export function generateChunkHash(content: string, documentId: string, index: number): string {
    return createHash('sha256')
        .update(`${content}_${documentId}_${index}`)
        .digest('hex');
}

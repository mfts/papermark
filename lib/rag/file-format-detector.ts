// File format enums
export enum InputFormat {
    DOCX = "docx",
    PPTX = "pptx",
    HTML = "html",
    IMAGE = "image",
    PDF = "pdf",
    ASCIIDOC = "asciidoc",
    MD = "md",
    CSV = "csv",
}

// Config type
export interface ProcessingConfig {
    requiresOcr: boolean;
    maxChunkSize: number;
    chunkOverlap: number;
}

// Central config map
const FormatConfigs: Record<InputFormat, ProcessingConfig> = {
    [InputFormat.PDF]: { requiresOcr: true, maxChunkSize: 1000, chunkOverlap: 200 },
    [InputFormat.DOCX]: { requiresOcr: false, maxChunkSize: 1000, chunkOverlap: 200 },
    [InputFormat.PPTX]: { requiresOcr: false, maxChunkSize: 800, chunkOverlap: 150 },
    [InputFormat.HTML]: { requiresOcr: false, maxChunkSize: 1000, chunkOverlap: 200 },
    [InputFormat.MD]: { requiresOcr: false, maxChunkSize: 1000, chunkOverlap: 200 },
    [InputFormat.ASCIIDOC]: { requiresOcr: false, maxChunkSize: 1000, chunkOverlap: 200 },
    [InputFormat.CSV]: { requiresOcr: false, maxChunkSize: 500, chunkOverlap: 100 },
    [InputFormat.IMAGE]: { requiresOcr: true, maxChunkSize: 800, chunkOverlap: 150 },
};

// Utility to fetch config safely
export function getProcessingConfig(format: InputFormat): ProcessingConfig {
    return FormatConfigs[format];
}
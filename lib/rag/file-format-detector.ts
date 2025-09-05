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
}

// Central config map
const FormatConfigs: Record<InputFormat, ProcessingConfig> = {
    [InputFormat.PDF]: { requiresOcr: true },
    [InputFormat.DOCX]: { requiresOcr: false },
    [InputFormat.PPTX]: { requiresOcr: false },
    [InputFormat.HTML]: { requiresOcr: false },
    [InputFormat.MD]: { requiresOcr: false },
    [InputFormat.ASCIIDOC]: { requiresOcr: false },
    [InputFormat.CSV]: { requiresOcr: false },
    [InputFormat.IMAGE]: { requiresOcr: true },
};

// Utility to fetch config safely
export function getProcessingConfig(format: InputFormat): ProcessingConfig {
    return FormatConfigs[format];
}
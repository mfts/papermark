export const TEXT_PAGE_DEFAULTS = {
  charsPerLine: 80,
  linesPerPage: 52,
  tabSize: 4,
} as const;

interface PaginateTextOptions {
  charsPerLine?: number;
  linesPerPage?: number;
  tabSize?: number;
}

/**
 * Expand tab characters to spaces using fixed tab stops.
 */
function expandTabs(line: string, tabSize: number): string {
  let result = "";
  for (const ch of line) {
    if (ch === "\t") {
      const spacesNeeded = tabSize - (result.length % tabSize);
      result += " ".repeat(spacesNeeded);
    } else {
      result += ch;
    }
  }
  return result;
}

/**
 * Word-wrap a single line to fit within maxWidth characters.
 * Breaks at word boundaries when possible; forces a break mid-word
 * only when a single word exceeds maxWidth.
 */
function wrapLine(line: string, maxWidth: number): string[] {
  if (line.length <= maxWidth) return [line];

  const wrapped: string[] = [];
  let remaining = line;

  while (remaining.length > maxWidth) {
    let breakAt = remaining.lastIndexOf(" ", maxWidth);
    if (breakAt <= 0) {
      breakAt = maxWidth;
    }
    wrapped.push(remaining.slice(0, breakAt));
    remaining = remaining.slice(breakAt).replace(/^ /, "");
  }

  if (remaining.length > 0) {
    wrapped.push(remaining);
  }

  return wrapped;
}

/**
 * Deterministic text pagination.
 *
 * Splits raw text into pages of fixed dimensions. The algorithm is purely
 * arithmetic (no font measurement, no viewport dependency) so it produces
 * identical page breaks on every device.
 *
 * 1. Normalize line endings to \n
 * 2. Expand tabs to spaces
 * 3. Word-wrap each line to fit within charsPerLine
 * 4. Group wrapped lines into pages of linesPerPage
 *
 * Returns an array of pages, where each page is an array of lines.
 */
export function paginateText(
  rawText: string,
  options?: PaginateTextOptions,
): string[][] {
  const charsPerLine = options?.charsPerLine ?? TEXT_PAGE_DEFAULTS.charsPerLine;
  const linesPerPage = options?.linesPerPage ?? TEXT_PAGE_DEFAULTS.linesPerPage;
  const tabSize = options?.tabSize ?? TEXT_PAGE_DEFAULTS.tabSize;

  const normalizedText = rawText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rawLines = normalizedText.split("\n");

  const allWrappedLines: string[] = [];
  for (const rawLine of rawLines) {
    const expanded = expandTabs(rawLine, tabSize);
    const wrapped = wrapLine(expanded, charsPerLine);
    allWrappedLines.push(...wrapped);
  }

  if (allWrappedLines.length === 0) {
    return [[""]];
  }

  const pages: string[][] = [];
  for (let i = 0; i < allWrappedLines.length; i += linesPerPage) {
    pages.push(allWrappedLines.slice(i, i + linesPerPage));
  }

  return pages;
}

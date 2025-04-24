export async function countPdfPages(buffer: Buffer): Promise<number> {
    try {
        // Convert buffer to string
        const pdfString = buffer.toString('binary');

        // Method 1: Look for /Count followed by a number in the PDF catalog
        // This is the most reliable method when available
        const countMatch = pdfString.match(/\/Count\s+(\d+)/);
        if (countMatch && countMatch[1]) {
            const count = parseInt(countMatch[1], 10);
            if (count > 0) {
                return count;
            }
        }

        // Method 2: Count /Type /Page objects
        // Less reliable but works when /Count is not available
        const pageMatches = pdfString.match(/\/Type\s*\/Page[\s\/>]/gi);
        if (pageMatches && pageMatches.length > 0) {
            return pageMatches.length;
        }

        // Method 3: Look for /N followed by a number in the PDF catalog
        // Another indicator sometimes used
        const nMatch = pdfString.match(/\/N\s+(\d+)/);
        if (nMatch && nMatch[1]) {
            const count = parseInt(nMatch[1], 10);
            if (count > 0) {
                return count;
            }
        }

        // Default to 1 if no method works
        return 1;
    } catch (error) {
        console.error('Error counting PDF pages:', error);
        return 1;
    }
} 
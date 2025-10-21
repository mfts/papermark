import sanitizeHtml from "sanitize-html";

export function validateContent(html: string, length: number = 1000) {
  if (html.length > length) {
    throw new Error(`Content cannot be longer than ${length} characters`);
  }
  const sanitized = sanitizeHtml(html, {
    allowedTags: [],
    allowedAttributes: {},
  });

  if (sanitized.length === 0 || sanitized === "") {
    throw new Error("Content cannot be empty");
  }

  return sanitized.trim();
}

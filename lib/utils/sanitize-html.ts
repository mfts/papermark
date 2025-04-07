import sanitizeHtml from "sanitize-html";

export function validateContent(html: string) {
  if (html.length > 1000) {
    throw new Error("Content cannot be longer than 1000 characters");
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

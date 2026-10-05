// Some models emit bold/italic markers with whitespace touching the inner edge
// (e.g. "**heading **"), which is invalid CommonMark and shows literal asterisks.
// Trim that whitespace so formatting renders whichever model answered.
// (Ported from the chatbot app.)
export function normalizeMarkdown(text: string) {
  return text.replace(/(\*{1,2}|_{1,2})\s*([^*_\n]+?)\s*\1/g, (_, marker: string, inner: string) => `${marker}${inner}${marker}`);
}

/** Markdown to plain text, for the screen-reader announcement. */
export function plainText(markdown: string) {
  return markdown.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[*_`#>]/g, "").replace(/\s+/g, " ").trim();
}

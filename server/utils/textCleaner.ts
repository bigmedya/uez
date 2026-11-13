/**
 * Text cleaning utilities for removing HTML tags, WordPress shortcodes, and normalizing text
 */

export function cleanText(text: string | null | undefined): string {
  if (!text) return "";
  
  let cleaned = String(text);
  
  // Remove WordPress shortcodes
  cleaned = cleaned
    .replace(/\[exhibz_speakers[^\]]*\]/gi, "") // [exhibz_speakers ...] shortcodes
    .replace(/\[exhibz_speakers[^\]]*$/gi, "") // Incomplete shortcodes
    .replace(/\[[^\]]*\]/g, "") // All other shortcodes
    .replace(/\[/g, "") // Remaining opening brackets
    .replace(/\]/g, ""); // Remaining closing brackets
  
  // Remove HTML tags (including incomplete ones)
  // First remove complete tags: <tag> or <tag attr="value">
  cleaned = cleaned.replace(/<[^>]*>/g, "");
  // Then remove incomplete tags at the end: <div id= or <div
  // This handles cases like "text<div id=" where the tag is incomplete
  cleaned = cleaned.replace(/<[^<]*$/g, "");
  // Remove any remaining < characters (safety net)
  cleaned = cleaned.replace(/</g, "");
  
  // Decode HTML entities
  cleaned = cleaned
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8211;/g, "-")
    .replace(/&#8212;/g, "—")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–");
  
  // Normalize whitespace
  cleaned = cleaned.replace(/\s+/g, " ");
  
  // Remove control characters
  cleaned = cleaned
    .replace(/[\u0000-\u001F]/g, "") // Control characters
    .replace(/\u00A0/g, " ") // Non-breaking space
    .replace(/\u200B/g, ""); // Zero-width space
  
  return cleaned.trim();
}


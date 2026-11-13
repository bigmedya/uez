/** <br> → \n; yalnız <b></b> kalır; diğer HTML silinir. */
const MARK_B0 = "\uFFF0PRG_B0\uFFF0";
const MARK_B1 = "\uFFF0PRG_B1\uFFF0";

function onlyB(s: string): string {
  return s.replace(/<\s*\/\s*b\s*>/gi, "</b>").replace(/<\s*b\b[^>]*>/gi, "<b>");
}

export function sanitizeProgramNoteForStorage(text: string | null | undefined): string {
  if (text == null) return "";
  let s = String(text).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (s.trim() === "") return "";

  s = s.replace(/&lt;br\b[^&]*&gt;/gi, "\n");
  s = s.replace(/<br\b[^>]*>/gi, "\n");

  s = s
    .replace(/\[exhibz_speakers[^\]]*\]/gi, "")
    .replace(/\[exhibz_speakers[^\]]*$/gi, "")
    .replace(/\[[^\]]*\]/g, "")
    .replace(/\[/g, "")
    .replace(/\]/g, "");

  s = s
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

  s = onlyB(s);
  s = s.replace(/<b>/g, MARK_B0).replace(/<\/b>/gi, MARK_B1);

  s = s.replace(/<[^>]*>/g, "").replace(/<[^<]*$/g, "").replace(/</g, "");

  s = s.replace(new RegExp(MARK_B0, "g"), "<b>").replace(new RegExp(MARK_B1, "g"), "</b>");

  s = s
    .split("\n")
    .map((line) => line.replace(/[ \t\u00A0\u200B]+/g, " ").trimEnd())
    .join("\n");

  s = s.replace(/[\u0000-\u0009\u000B\u000C\u000E-\u001F]/g, "");
  s = s.replace(/\n{3,}/g, "\n\n").trim();
  return s;
}

/** Not görseli URL’si: yalnızca http(s) veya /uploads/… */
export function sanitizeProgramNoteImageUrl(url: string | null | undefined): string | undefined {
  const t = url?.trim();
  if (!t) return undefined;
  if (/^https?:\/\//i.test(t)) return t;
  if (t.startsWith("/uploads/")) return t;
  return undefined;
}

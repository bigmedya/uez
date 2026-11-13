const B0 = "\uFFF0B0\uFFF0";
const B1 = "\uFFF0B1\uFFF0";

function brToNl(s: string) {
  return s
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/&lt;br\b[^&]*&gt;/gi, "\n")
    .replace(/<br\b[^>]*>/gi, "\n");
}

/** Yalnızca <b> / </b> (özellikler atılır). */
function onlyB(s: string) {
  return s.replace(/<\s*\/\s*b\s*>/gi, "</b>").replace(/<\s*b\b[^>]*>/gi, "<b>");
}

/** Düz metin (PDF, textContent vb.). */
export function programNoteToPlain(text: string | null | undefined): string {
  if (text == null) return "";
  let s = onlyB(brToNl(String(text)));
  s = s.replace(/<\/b>/gi, "").replace(/<b>/gi, "");
  s = s.replace(/<[^>]*>/g, "").replace(/</g, "");
  return s.replace(/\n{3,}/g, "\n\n").trim();
}

/** HTML: sadece <b> ve satır sonu (<br />). */
export function programNoteToSafeHtml(text: string | null | undefined): string {
  if (text == null || String(text).trim() === "") return "";
  let s = onlyB(brToNl(String(text)));
  s = s.replace(/<b>/g, B0).replace(/<\/b>/gi, B1);
  s = s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  s = s.split(B0).join("<b>").split(B1).join("</b>");
  return s.replace(/\n/g, "<br />");
}

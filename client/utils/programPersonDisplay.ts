/** Program öğelerindeki konuşmacı/moderatör: önce şirket, sonra pozisyon; yoksa tek satır title. */

export type ProgramPersonDisplayInput = {
  company?: string;
  companyEn?: string;
  position?: string;
  positionEn?: string;
  title?: string;
  titleEn?: string;
};

export function getProgramPersonSubtitle(
  person: ProgramPersonDisplayInput,
  locale: string
): { line1: string; line2?: string } {
  const useEn = locale === "en";
  const company = (useEn ? (person.companyEn?.trim() || person.company?.trim()) : person.company?.trim()) || "";
  const position = (useEn ? (person.positionEn?.trim() || person.position?.trim()) : person.position?.trim()) || "";
  if (company && position) return { line1: company, line2: position };
  if (company) return { line1: company };
  if (position) return { line1: position };
  // Şirket/pozisyon yoksa unvan; dil yoksa diğer dil metni yedek (API bazen tek taraflı doldurur)
  const title = useEn
    ? (person.titleEn?.trim() || person.title?.trim() || "")
    : (person.title?.trim() || person.titleEn?.trim() || "");
  return { line1: title };
}

export function getProgramPersonSubtitleOneLine(person: ProgramPersonDisplayInput, locale: string): string {
  const sub = getProgramPersonSubtitle(person, locale);
  if (sub.line2) return `${sub.line1} — ${sub.line2}`;
  return sub.line1;
}

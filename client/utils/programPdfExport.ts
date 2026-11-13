import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { getProgramPersonSubtitleOneLine } from "@/utils/programPersonDisplay";
import {
  enrichModeratorsWithSpeakerCatalog,
  type SpeakerCatalogEntry,
} from "@/utils/enrichProgramModerators";
import { programNoteToPlain } from "@/utils/programNotePlain";

export function cleanProgramText(text: string | undefined): string {
  if (!text) return "";
  return text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/<[^<]*$/g, "")
    .replace(/</g, "")
    .trim();
}

type PdfEntrySpeaker = SpeakerCatalogEntry & { id: number };

export type ProgramPdfScheduleItem = {
  time: string;
  title: string;
  note?: string;
  note_image?: string;
  description?: string;
  moderator?: string;
  moderatorTitle?: string;
  moderatorIds?: number[];
  moderators?: SpeakerCatalogEntry[];
  speakerIds?: number[];
  speakerNames?: string[];
  speakers?: PdfEntrySpeaker[];
};

export type ProgramPdfDay = {
  id: number;
  title: string;
  order?: number;
  scheduleItems?: ProgramPdfScheduleItem[];
};

function createPdfWrapper(): HTMLDivElement {
  const w = document.createElement("div");
  w.style.width = "210mm";
  w.style.padding = "2mm 20mm";
  w.style.backgroundColor = "#ffffff";
  w.style.fontFamily = "Arial, sans-serif";
  w.style.color = "#000000";
  w.style.position = "absolute";
  w.style.left = "-9999px";
  w.style.top = "0";
  w.style.overflow = "visible";
  w.style.boxSizing = "border-box";
  w.style.zIndex = "-1";
  w.style.opacity = "1";
  w.style.visibility = "visible";
  w.style.transition = "none";
  return w;
}

function createPdfEntry(
  item: ProgramPdfScheduleItem,
  speakerListPdf: PdfEntrySpeaker[],
  moderatorList: SpeakerCatalogEntry[],
  pdfLocale: string,
): HTMLDivElement {
  const purplePrimary = "#4B4596";
  const orangePrimary = "#EA9267";
  const black = "#000000";
  const grayText = "#666666";
  const entryDiv = document.createElement("div");
  entryDiv.style.marginBottom = "6px";
  entryDiv.style.padding = "0";
  const headingEl = document.createElement("div");
  const timeText = cleanProgramText(item.time);
  const titleText = cleanProgramText(item.title);
  headingEl.style.fontSize = "16px";
  headingEl.style.fontWeight = "bold";
  headingEl.style.color = purplePrimary;
  headingEl.style.lineHeight = "1.4";
  headingEl.style.marginBottom = "8px";
  headingEl.textContent = timeText ? `SAAT: ${timeText} ${titleText}`.toUpperCase() : titleText.toUpperCase();
  entryDiv.appendChild(headingEl);
  const noteText = programNoteToPlain(item.note || item.description);
  if (noteText) {
    const noteDiv = document.createElement("div");
    noteDiv.style.fontSize = "12px";
    noteDiv.style.color = grayText;
    noteDiv.style.lineHeight = "1.5";
    noteDiv.style.marginBottom = "8px";
    noteDiv.style.paddingLeft = "24px";
    noteDiv.textContent = noteText;
    noteDiv.style.whiteSpace = "pre-line";
    entryDiv.appendChild(noteDiv);
  }
  if (speakerListPdf.length > 0) {
    const listDiv = document.createElement("div");
    listDiv.style.paddingLeft = "24px";
    listDiv.style.marginBottom = "6px";
    speakerListPdf.forEach((s) => {
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.alignItems = "baseline";
      row.style.marginBottom = "4px";
      row.style.lineHeight = "1.5";
      const bullet = document.createElement("span");
      bullet.textContent = "•";
      bullet.style.marginRight = "10px";
      bullet.style.fontSize = "13px";
      bullet.style.color = black;
      row.appendChild(bullet);
      const content = document.createElement("span");
      content.style.fontSize = "13px";
      content.style.color = black;
      const name = cleanProgramText(s.name).toUpperCase();
      const subLine = getProgramPersonSubtitleOneLine(s, pdfLocale);
      const sub = subLine ? cleanProgramText(subLine) : "";
      content.textContent = sub ? `${name}/ ${sub}` : name;
      row.appendChild(content);
      listDiv.appendChild(row);
    });
    entryDiv.appendChild(listDiv);
  }
  if (moderatorList.length > 0) {
    const modDiv = document.createElement("div");
    modDiv.style.paddingLeft = "24px";
    modDiv.style.marginTop = "6px";
    moderatorList.forEach((mod) => {
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.alignItems = "baseline";
      row.style.marginBottom = "4px";
      row.style.lineHeight = "1.5";
      const arrow = document.createElement("span");
      arrow.textContent = "➤";
      arrow.style.marginRight = "8px";
      arrow.style.fontSize = "12px";
      arrow.style.color = orangePrimary;
      row.appendChild(arrow);
      const label = document.createElement("span");
      label.style.fontSize = "13px";
      label.style.fontWeight = "bold";
      label.style.color = orangePrimary;
      const modName = cleanProgramText(mod.name).toUpperCase();
      const modSub = getProgramPersonSubtitleOneLine(mod, pdfLocale);
      const modSubClean = modSub ? cleanProgramText(modSub) : "";
      label.textContent = modSubClean
        ? `MODERATÖR: ${modName}/ ${modSubClean}`
        : `MODERATÖR: ${modName}`;
      row.appendChild(label);
      modDiv.appendChild(row);
    });
    entryDiv.appendChild(modDiv);
  }
  return entryDiv;
}

type CatalogSpeaker = SpeakerCatalogEntry & { id?: number };

/** Anasayfa /m ile aynı: program-2026.pdf (html2canvas + jsPDF) */
export async function downloadProgramPdf2026(options: {
  days: ProgramPdfDay[];
  speakers: CatalogSpeaker[];
  locale: string;
}): Promise<void> {
  const { days: programDays, speakers: speakersCatalog, locale } = options;
  if (programDays.length === 0) return;

  await new Promise((r) => setTimeout(r, 300));

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginTop = 15;
  const marginBottom = 15;
  const usableHeight = pageHeight - marginTop - marginBottom;
  const imgWidth = pageWidth;
  let currentY = marginTop;
  const gapBetween = 1;
  const html2canvasOptions = {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
    removeContainer: false,
    allowTaint: false,
    foreignObjectRendering: false,
    onclone: (clonedDoc: Document) => {
      clonedDoc.body.querySelectorAll("*").forEach((el: Element) => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.transition = "none";
        htmlEl.style.animation = "none";
        htmlEl.style.transform = "none";
        htmlEl.style.opacity = "1";
      });
    },
  } as const;

  const addSegmentToPdf = async (element: HTMLElement) => {
    const wrapper = createPdfWrapper();
    wrapper.appendChild(element);
    document.body.appendChild(wrapper);
    await new Promise((r) => setTimeout(r, 50));
    const canvas = await html2canvas(wrapper, html2canvasOptions);
    document.body.removeChild(wrapper);
    const imgData = canvas.toDataURL("image/png", 1.0);
    const imgHeightMm = (canvas.height * imgWidth) / canvas.width;
    if (currentY + imgHeightMm > usableHeight && currentY > marginTop) {
      doc.addPage();
      currentY = marginTop;
    }
    doc.addImage(imgData, "PNG", 0, currentY, imgWidth, imgHeightMm, undefined, "FAST");
    currentY += imgHeightMm + gapBetween;
  };

  const titleBlock = document.createElement("div");
  titleBlock.style.textAlign = "center";
  titleBlock.style.marginBottom = "4px";
  const title = document.createElement("h1");
  title.textContent = "UEZ 2026 Programı";
  title.style.fontSize = "32px";
  title.style.fontWeight = "bold";
  title.style.color = "#0F0032";
  title.style.margin = "0";
  title.style.paddingBottom = "14px";
  title.style.letterSpacing = "0.01em";
  title.style.lineHeight = "1.2";
  titleBlock.appendChild(title);
  await addSegmentToPdf(titleBlock);

  for (let dayIndex = 0; dayIndex < programDays.length; dayIndex++) {
    const day = programDays[dayIndex];
    const dayBlock = document.createElement("div");
    dayBlock.style.marginTop = dayIndex > 0 ? "14px" : "0";
    dayBlock.style.marginBottom = "6px";
    const dayTitle = document.createElement("h2");
    dayTitle.textContent = cleanProgramText(day.title).toUpperCase();
    dayTitle.style.fontSize = "22px";
    dayTitle.style.fontWeight = "bold";
    dayTitle.style.color = "#4B4596";
    dayTitle.style.margin = "0";
    dayTitle.style.paddingBottom = "12px";
    dayTitle.style.letterSpacing = "0.01em";
    dayBlock.appendChild(dayTitle);
    const dayLine = document.createElement("div");
    dayLine.style.height = "1px";
    dayLine.style.backgroundColor = "#4B4596";
    dayBlock.appendChild(dayLine);
    await addSegmentToPdf(dayBlock);

    for (const item of day.scheduleItems || []) {
      const itemSpeakersPdf = (item.speakerIds || [])
        .map((id) => speakersCatalog.find((s) => s.id === id))
        .filter(Boolean) as CatalogSpeaker[];

      const speakerListPdf: PdfEntrySpeaker[] =
        item.speakers && item.speakers.length > 0
          ? item.speakers
          : itemSpeakersPdf.map((s) => ({
              id: s.id!,
              name: s.name,
              title: s.title,
              titleEn: s.titleEn,
              photo: s.photo ?? "",
              company: s.company,
              companyEn: s.companyEn,
              position: s.position,
              positionEn: s.positionEn,
            }));

      const moderatorList = enrichModeratorsWithSpeakerCatalog(
        item.moderatorIds,
        item.moderators,
        item.moderator,
        item.moderatorTitle,
        speakersCatalog,
      );
      const entry = createPdfEntry(item, speakerListPdf, moderatorList, locale);
      await addSegmentToPdf(entry);
    }
  }

  doc.save("program-2026.pdf");
}

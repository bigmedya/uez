import { useState, useEffect, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useProgramForHomepage, ScheduleDay, ScheduleItem } from "../hooks/useProgram";
import { getProgramPersonSubtitle, getProgramPersonSubtitleOneLine } from "@/utils/programPersonDisplay";
import { enrichModeratorsWithSpeakerCatalog, type SpeakerCatalogEntry } from "@/utils/enrichProgramModerators";
import { ProgramNoteBlock } from "@/components/ProgramNoteBlock";
import { programNoteToPlain } from "@/utils/programNotePlain";

interface Speaker {
  id: number;
  name: string;
  title?: string;
  titleEn?: string;
  company?: string;
  companyEn?: string;
  position?: string;
  positionEn?: string;
  photo?: string;
}

type ProgramMod = {
  name: string;
  title?: string;
  titleEn?: string;
  photo?: string;
  company?: string;
  companyEn?: string;
  position?: string;
  positionEn?: string;
};

export default function Program() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "en" ? "en" : undefined;
  const { days, isLoading } = useProgramForHomepage();
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDayId, setSelectedDayId] = useState<number | null>(null);
  const programContentRef = useRef<HTMLDivElement>(null);

  // /api/program/homepage 2026 kategorisini döndürür; günleri doğrudan kullan
  const filteredDays = days;

  const speakerCatalog = useMemo<SpeakerCatalogEntry[]>(
    () =>
      speakers.map((s) => ({
        id: s.id,
        name: s.name,
        title: s.title,
        titleEn: s.titleEn,
        photo: s.photo,
        company: s.company,
        companyEn: s.companyEn,
        position: s.position,
        positionEn: s.positionEn,
      })),
    [speakers],
  );

  useEffect(() => {
    const url = locale ? `/api/speakers?locale=${locale}` : "/api/speakers";
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        // Map API response to Speaker interface (API returns title, company, position)
        const mappedSpeakers = Array.isArray(data) ? data.map((s: any) => ({
          id: s.id,
          name: s.name,
          title: s.title,
          titleEn: s.titleEn,
          company: s.company,
          companyEn: s.companyEn,
          position: s.position,
          positionEn: s.positionEn,
          photo: s.photo || s.image,
        })) : [];
        setSpeakers(mappedSpeakers);
      })
      .catch(console.error);
  }, [locale]);

  // Auto-select first day when days are loaded
  useEffect(() => {
    if (days.length > 0 && selectedDayId === null) {
      setSelectedDayId(days[0].id);
    } else if (days.length > 0 && !days.find(d => d.id === selectedDayId)) {
      setSelectedDayId(days[0].id);
    }
  }, [days, selectedDayId]);

  const selectedDay = filteredDays.find(d => d.id === selectedDayId);
  const selectedDayItems = selectedDay?.scheduleItems || [];

  // HTML etiketlerini temizle ve metni normalize et
  const stripHtml = (html: string): string => {
    if (!html) return "";
    let text = String(html);
    
    // WordPress shortcode'larını temizle
    text = text
      .replace(/\[exhibz_speakers[^\]]*\]/gi, "") 
      .replace(/\[exhibz_speakers[^\]]*$/gi, "") 
      .replace(/\[[^\]]*\]/g, "") 
      .replace(/\[/g, "") 
      .replace(/\]/g, ""); 
    
    // Önce HTML etiketlerini kaldır
    text = text.replace(/<[^>]*>/g, "");
    
    text = text
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
    
    // Eğer hala HTML içeriyorsa, DOM kullan
    if (text.includes("<")) {
      const tmp = document.createElement("DIV");
      tmp.innerHTML = text;
      text = tmp.textContent || tmp.innerText || "";
    }
    
    return text.trim();
  };

  // Metni temizle ve normalize et
  const cleanText = (text: string | undefined): string => {
    if (!text) return "";
    // HTML etiketlerini ve shortcode'ları temizle
    let cleaned = stripHtml(String(text));
    // Boşlukları normalize et
    cleaned = cleaned.replace(/\s+/g, " ");
    // Özel karakterleri düzelt
    cleaned = cleaned
      .replace(/[\u0000-\u001F]/g, "") // Kontrol karakterlerini kaldır
      .replace(/\u00A0/g, " ") // Non-breaking space'i normal space'e çevir
      .replace(/\u200B/g, "") // Zero-width space'i kaldır
      .replace(/\[exhibz_speakers[^\]]*\]/gi, "") // Kalan shortcode'lar
      .replace(/\[exhibz_speakers[^\]]*$/gi, "") // Eksik kapanış parantezli
      .replace(/\[[^\]]*\]/g, "") // Diğer shortcode'lar
      .replace(/\[/g, "") // Kalan açılış parantezleri
      .replace(/\]/g, ""); // Kalan kapanış parantezleri
    return cleaned.trim();
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const programData = filteredDays && filteredDays.length > 0 ? filteredDays : [];
      await new Promise((r) => setTimeout(r, 300));

      // Site renk paleti
      const purpleDark = "#0F0032";
      const purplePrimary = "#4B4596";
      const orangePrimary = "#EA9267";
      const black = "#000000";
      const grayText = "#666666";

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
      const pageHeight = doc.internal.pageSize.getHeight();
      const pageWidth = doc.internal.pageSize.getWidth();
      const marginTop = 15;
      const marginBottom = 15;
      const usableHeight = pageHeight - marginTop - marginBottom;
      const imgWidth = pageWidth;
      let currentY = marginTop;
      const gapBetween = 1;

      // Wrapper: her segment için geçici konteyner (dikey padding minimal)
      const createWrapper = () => {
        const w = document.createElement("div");
        w.style.width = "210mm";
        w.style.padding = "2mm 20mm";
        w.style.backgroundColor = "#ffffff";
        w.style.fontFamily = "Arial, sans-serif";
        w.style.color = black;
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
      };

      const html2canvasOpts = {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        removeContainer: false,
        allowTaint: false,
        foreignObjectRendering: false,
        onclone: (clonedDoc: Document) => {
          clonedDoc.body.querySelectorAll("*").forEach((el: Element) => {
            const h = el as HTMLElement;
            h.style.transition = "none";
            h.style.animation = "none";
            h.style.transform = "none";
            h.style.opacity = "1";
          });
        },
      } as const;

      // Tek bir HTML elemanını segment olarak PDF'e ekle
      const addSegment = async (element: HTMLElement) => {
        const wrapper = createWrapper();
        wrapper.appendChild(element);
        document.body.appendChild(wrapper);
        await new Promise((r) => setTimeout(r, 50));
        const canvas = await html2canvas(wrapper, html2canvasOpts);
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

      // --- Ana başlık: yılı gün başlığından çıkar ---
      const pdfYear = programData.length > 0
        ? (cleanText(programData[0].title).match(/\b(20\d{2})\b/)?.[1] || String(new Date().getFullYear()))
        : String(new Date().getFullYear());
      const titleBlock = document.createElement("div");
      titleBlock.style.textAlign = "center";
      titleBlock.style.marginBottom = "4px";
      const titleEl = document.createElement("h1");
      titleEl.textContent = `UEZ ${pdfYear} Programı`;
      titleEl.style.fontSize = "32px";
      titleEl.style.fontWeight = "bold";
      titleEl.style.color = purpleDark;
      titleEl.style.margin = "0";
      titleEl.style.paddingBottom = "14px";
      titleEl.style.lineHeight = "1.2";
      titleBlock.appendChild(titleEl);
      await addSegment(titleBlock);

      // --- Her gün ---
      for (let dayIdx = 0; dayIdx < programData.length; dayIdx++) {
        const day = programData[dayIdx];

        // Gün başlığı
        const dayBlock = document.createElement("div");
        dayBlock.style.marginTop = dayIdx > 0 ? "14px" : "0";
        dayBlock.style.marginBottom = "6px";
        const dayTitleEl = document.createElement("h2");
        dayTitleEl.textContent = cleanText(day.title).toUpperCase();
        dayTitleEl.style.fontSize = "22px";
        dayTitleEl.style.fontWeight = "bold";
        dayTitleEl.style.color = purplePrimary;
        dayTitleEl.style.margin = "0";
        dayTitleEl.style.paddingBottom = "12px";
        dayBlock.appendChild(dayTitleEl);
        const dayLine = document.createElement("div");
        dayLine.style.height = "1px";
        dayLine.style.backgroundColor = purplePrimary;
        dayBlock.appendChild(dayLine);
        await addSegment(dayBlock);

        const sortedItems = [...day.scheduleItems].sort((a, b) => a.order - b.order);
        for (const item of sortedItems) {
          const entryDiv = document.createElement("div");
          entryDiv.style.marginBottom = "6px";
          entryDiv.style.padding = "0";

          const headingEl = document.createElement("div");
          const timeText = cleanText(item.time);
          const titleText = cleanText(item.title);
          headingEl.style.fontSize = "16px";
          headingEl.style.fontWeight = "bold";
          headingEl.style.color = purplePrimary;
          headingEl.style.lineHeight = "1.4";
          headingEl.style.marginBottom = "8px";
          headingEl.textContent = timeText
            ? `SAAT: ${timeText} ${titleText}`.toUpperCase()
            : titleText.toUpperCase();
          entryDiv.appendChild(headingEl);

          const notePlain = programNoteToPlain(item.note);
          if (notePlain) {
            const noteDiv = document.createElement("div");
            noteDiv.style.fontSize = "12px";
            noteDiv.style.color = grayText;
            noteDiv.style.lineHeight = "1.5";
            noteDiv.style.marginBottom = "8px";
            noteDiv.style.paddingLeft = "24px";
            noteDiv.textContent = notePlain;
            noteDiv.style.whiteSpace = "pre-line";
            entryDiv.appendChild(noteDiv);
          }

          const speakerIds = item.speakerIds || (item.speakerId ? [item.speakerId] : []);
          const itemSpeakers = speakerIds
            .map((id) => speakers.find((s) => s.id === id))
            .filter((s): s is Speaker => s !== undefined);

          if (itemSpeakers.length > 0) {
            const listDiv = document.createElement("div");
            listDiv.style.paddingLeft = "24px";
            listDiv.style.marginBottom = "6px";
            itemSpeakers.forEach((s) => {
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
              const name = cleanText(s.name).toUpperCase();
              const sTitle = getProgramPersonSubtitleOneLine(s, locale || "tr");
              const sTitleClean = sTitle ? cleanText(sTitle) : "";
              content.textContent = sTitleClean ? `${name}/ ${sTitleClean}` : name;
              row.appendChild(content);

              listDiv.appendChild(row);
            });
            entryDiv.appendChild(listDiv);
          }

          // Moderatör – "➤ MODERATÖR: İSİM/ Unvan"
          const moderatorList: ProgramMod[] = enrichModeratorsWithSpeakerCatalog(
            item.moderatorIds,
            item.moderators as ProgramMod[] | undefined,
            item.moderator,
            item.moderatorTitle,
            speakerCatalog,
          ) as ProgramMod[];

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
              const modName = cleanText(mod.name).toUpperCase();
              const modSub = getProgramPersonSubtitleOneLine(mod, locale || "tr");
              const modSubClean = modSub ? cleanText(modSub) : "";
              label.textContent = modSubClean
                ? `MODERATÖR: ${modName}/ ${modSubClean}`
                : `MODERATÖR: ${modName}`;
              row.appendChild(label);

              modDiv.appendChild(row);
            });
            entryDiv.appendChild(modDiv);
          }

          await addSegment(entryDiv);
        }
      }

      doc.save(`program-${pdfYear}.pdf`);
    } catch (error) {
      console.error("PDF oluşturma hatası:", error);
      alert(t("program.pdfError"));
    } finally {
      setIsGenerating(false);
    }
  };
  return (
    <section id="program" className="relative bg-gray-light py-16 lg:py-24 overflow-hidden">
      <div className="container mx-auto px-8 lg:px-16 relative z-10">
        {/* Title — Konuşmacılar sayfası ile aynı başlık ölçeği */}
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-semibold text-purple-dark text-center mb-8 sm:mb-12 md:mb-14 lg:mb-16 leading-tight">
          {t("program.titleAndSpeakers")}
        </h2>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-text">{t("program.loading")}</p>
          </div>
        ) : days.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-text">{t("program.noProgram")}</p>
          </div>
        ) : (
            <>
              {/* Gün sekmeleri — homepage API 2026 programını döndürür */}
              {filteredDays.length > 0 && (
              <div className="w-full mb-4 md:mb-12">
                {/* Mobile: Minimal horizontal scroll with visual indicators */}
                <div className="md:hidden relative">
                  <div 
                    className="overflow-x-auto snap-x snap-mandatory tab-scroll-hide" 
                    style={{ 
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none',
                      WebkitOverflowScrolling: 'touch'
                    }}
                  >
                    <style>{`
                      .tab-scroll-hide::-webkit-scrollbar {
                        display: none;
                        width: 0;
                        height: 0;
                      }
                      .tab-scroll-hide {
                        -ms-overflow-style: none;
                        scrollbar-width: none;
                      }
                    `}</style>
                    <div className="flex gap-3 min-w-max pb-1 px-4">
                      {filteredDays.map((day) => (
                        <button
                          key={day.id}
                          onClick={() => setSelectedDayId(day.id)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 snap-start ${
                            selectedDayId === day.id
                              ? "bg-gradient-to-r from-orange-accent via-salmon to-coral text-white shadow-md"
                              : "bg-purple-primary text-white hover:bg-purple-accent"
                          }`}
                        >
                          {cleanText(day.title)}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Left fade indicator - very narrow, at edge */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-r from-gray-light to-transparent pointer-events-none z-0"></div>
                  {/* Right fade indicator - very narrow, at edge */}
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-l from-gray-light to-transparent pointer-events-none z-0"></div>
                  
                  {/* Scroll hint - closer to tabs */}
                  {days.length > 3 && (
                    <div className="text-center mt-1 text-xs text-gray-text opacity-80">
                      {t("program.scrollHint")}
                    </div>
                  )}
                </div>

                {/* Desktop: Day tabs */}
                <div className={`hidden md:grid gap-4 max-w-7xl mx-auto ${
                  filteredDays.length === 1 ? 'grid-cols-1' :
                  filteredDays.length === 2 ? 'grid-cols-2' :
                  filteredDays.length === 3 ? 'grid-cols-3' :
                  'grid-cols-4'
                }`}>
                  {filteredDays.map((day) => (
                    <button
                      key={day.id}
                      onClick={() => setSelectedDayId(day.id)}
                      className={`w-full px-6 py-4 rounded-xl text-lg font-medium transition-colors ${
                        selectedDayId === day.id
                          ? "bg-gradient-to-r from-orange-accent via-salmon to-coral text-white shadow-lg"
                          : "bg-purple-primary text-white hover:bg-purple-accent"
                      }`}
                    >
                      {cleanText(day.title)}
                    </button>
                  ))}
                </div>
              </div>
              )}

            {/* Program schedule */}
            {selectedDay && (
              <div className="max-w-6xl mx-auto space-y-6">
                {selectedDayItems.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-xl text-gray-text">{t("program.noItemsToday")}</p>
                  </div>
                ) : (
                  selectedDayItems
                    .sort((a, b) => a.order - b.order)
                    .map((item, index) => {
                      const itemSpeakers = (item.speakerIds || (item.speakerId ? [item.speakerId] : []))
                        .map((id) => speakers.find((s) => s.id === id))
                        .filter((s): s is Speaker => s !== undefined);
                      const moderatorList: ProgramMod[] = enrichModeratorsWithSpeakerCatalog(
                        item.moderatorIds,
                        item.moderators as ProgramMod[] | undefined,
                        item.moderator,
                        item.moderatorTitle,
                        speakerCatalog,
                      ) as ProgramMod[];

                      return (
                        <div
                          key={item.id}
                          className={`rounded-xl p-6 md:p-8 ${
                            index % 2 === 0 ? "bg-gray-medium" : "bg-gray-dark"
                          }`}
                        >
                          {/* Mobile Layout */}
                          <div className="block md:hidden">
                            {/* Time - Centered */}
                            <div className="text-center mb-4">
                              <span className="text-3xl font-semibold text-black">
                                {cleanText(item.time)}
                              </span>
                            </div>

                            {/* Session title - Full width purple card */}
                            <div className="w-full px-4 py-2 rounded-lg bg-purple-primary mb-4">
                              <h3 className="text-white text-base font-semibold text-center leading-tight">
                                {cleanText(item.title)}
                              </h3>
                            </div>

                            {/* Note (HTML + görsel) */}
                            {(item.note || item.note_image) && (
                              <div className="mb-6">
                                <ProgramNoteBlock
                                  text={item.note}
                                  imageUrl={item.note_image}
                                  centered
                                  className="text-base"
                                />
                              </div>
                            )}

                            {/* Moderators - first (with photo like speakers) */}
                            {moderatorList.length > 0 && (
                              <div className="mb-6">
                                <p className="text-sm font-semibold text-purple-primary mb-2 uppercase tracking-wide">
                                  {t("program.moderators")}
                                </p>
                                <div className="space-y-6">
                                  {moderatorList.map((mod, i: number) => (
                                    <div key={i} className="flex flex-col items-center text-center">
                                      <div className="w-24 h-24 rounded-full bg-gray-dark overflow-hidden mb-4">
                                        <img
                                          src={mod.photo || "https://api.builder.io/api/v1/image/assets/TEMP/3d8c9bc3728ff23150a6419967a8eb9af1533371?width=248"}
                                          alt={mod.name}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                      <div className="w-full">
                                        <p className="text-lg font-bold text-black mb-2 break-words">
                                          {cleanText(mod.name)}
                                        </p>
                                        {(() => {
                                          const sub = getProgramPersonSubtitle(mod, locale || "tr");
                                          if (!sub.line1) return null;
                                          return (
                                            <>
                                              <p className="text-sm text-gray-text break-words leading-relaxed">{cleanText(sub.line1)}</p>
                                              {sub.line2 && (
                                                <p className="text-sm text-gray-text break-words leading-relaxed">{cleanText(sub.line2)}</p>
                                              )}
                                            </>
                                          );
                                        })()}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Speakers - below moderators */}
                            {itemSpeakers.length > 0 && (
                              <div className="space-y-6">
                                <p className="text-sm font-semibold text-purple-primary uppercase tracking-wide">
                                  {itemSpeakers.length === 1 ? t("program.speaker") : t("program.speakers")}
                                </p>
                                {itemSpeakers.map((speaker) => (
                                  <div
                                    key={speaker.id}
                                    className="flex flex-col items-center text-center"
                                  >
                                    <div className="w-24 h-24 rounded-full bg-gray-dark overflow-hidden mb-4">
                                      <img
                                        src={speaker.photo || "https://api.builder.io/api/v1/image/assets/TEMP/3d8c9bc3728ff23150a6419967a8eb9af1533371?width=248"}
                                        alt={speaker.name}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <div className="w-full">
                                      <p className="text-lg font-bold text-black mb-2 break-words">
                                        {cleanText(speaker.name)}
                                      </p>
                                      {(() => {
                                        const sub = getProgramPersonSubtitle(speaker, locale || "tr");
                                        if (!sub.line1) return null;
                                        return (
                                          <>
                                            <p className="text-sm text-gray-text break-words leading-relaxed">{cleanText(sub.line1)}</p>
                                            {sub.line2 && (
                                              <p className="text-sm text-gray-text break-words leading-relaxed">{cleanText(sub.line2)}</p>
                                            )}
                                          </>
                                        );
                                      })()}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Desktop Layout */}
                          <div className="hidden md:flex items-start gap-8">
                            <div className="relative">
                              <span className="text-3xl font-semibold text-black">
                                {cleanText(item.time)}
                              </span>
                              <div className="absolute -left-24 top-2 w-4 h-4 rounded-full bg-purple-primary"></div>
                            </div>

                            <div className="flex-1">
                              {/* Session title */}
                              <div className="inline-flex items-center px-6 py-3 rounded-xl bg-purple-primary mb-6">
                                <h3 className="text-white text-2xl font-semibold">
                                  {cleanText(item.title)}
                                </h3>
                              </div>

                              {/* Note (HTML + görsel) */}
                              {(item.note || item.note_image) && (
                                <div className="mb-6">
                                  <ProgramNoteBlock
                                    text={item.note}
                                    imageUrl={item.note_image}
                                    className="text-lg"
                                  />
                                </div>
                              )}

                              {/* Moderators - first (with photo like speakers) */}
                              {moderatorList.length > 0 && (
                                <div className="mb-6">
                                  <p className="text-sm font-semibold text-purple-primary mb-3 uppercase tracking-wide">
                                    {t("program.moderators")}
                                  </p>
                                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {moderatorList.map((mod, i: number) => (
                                      <div key={i} className="flex items-start gap-4 h-full">
                                        <div className="w-20 h-20 rounded-full bg-gray-dark overflow-hidden flex-shrink-0">
                                          <img
                                            src={mod.photo || "https://api.builder.io/api/v1/image/assets/TEMP/3d8c9bc3728ff23150a6419967a8eb9af1533371?width=248"}
                                            alt={mod.name}
                                            className="w-full h-full object-cover"
                                          />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-lg font-bold text-black mb-1 break-words">
                                            {cleanText(mod.name)}
                                          </p>
                                          {(() => {
                                            const sub = getProgramPersonSubtitle(mod, locale || "tr");
                                            if (!sub.line1) return null;
                                            return (
                                              <>
                                                <p className="text-sm text-gray-text break-words leading-relaxed">{cleanText(sub.line1)}</p>
                                                {sub.line2 && (
                                                  <p className="text-sm text-gray-text break-words leading-relaxed">{cleanText(sub.line2)}</p>
                                                )}
                                              </>
                                            );
                                          })()}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Speakers - below moderators */}
                              {itemSpeakers.length > 0 && (
                                <div>
                                  <p className="text-sm font-semibold text-purple-primary mb-3 uppercase tracking-wide">
                                    {itemSpeakers.length === 1 ? t("program.speaker") : t("program.speakers")}
                                  </p>
                                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {itemSpeakers.map((speaker) => (
                                      <div
                                        key={speaker.id}
                                        className="flex items-start gap-4 h-full"
                                      >
                                        <div className="w-20 h-20 rounded-full bg-gray-dark overflow-hidden flex-shrink-0">
                                          <img
                                            src={speaker.photo || "https://api.builder.io/api/v1/image/assets/TEMP/3d8c9bc3728ff23150a6419967a8eb9af1533371?width=248"}
                                            alt={speaker.name}
                                            className="w-full h-full object-cover"
                                          />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-lg font-bold text-black mb-1 break-words">
                                            {cleanText(speaker.name)}
                                          </p>
                                          {(() => {
                                            const sub = getProgramPersonSubtitle(speaker, locale || "tr");
                                            if (!sub.line1) return null;
                                            return (
                                              <>
                                                <p className="text-sm text-gray-text break-words leading-relaxed">{cleanText(sub.line1)}</p>
                                                {sub.line2 && (
                                                  <p className="text-sm text-gray-text break-words leading-relaxed">{cleanText(sub.line2)}</p>
                                                )}
                                              </>
                                            );
                                          })()}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            )}
          </>
        )}

          {/* Download button */}
          <div className="flex justify-center md:justify-end mt-8">
            <button
              onClick={generatePDF}
              disabled={isGenerating}
              className="flex items-center gap-2 md:gap-3 px-5 py-2.5 md:px-6 md:py-3 rounded-lg md:rounded-xl border border-purple-dark bg-gray-medium text-purple-dark hover:bg-gray-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                className="w-7 h-7 md:w-10 md:h-10"
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12.6943 0.5H26.793L38.5 12.207V34.793C38.4998 37.3646 36.2642 39.4999 33.4404 39.5H12.5703C9.73516 39.5 7.50023 37.364 7.5 34.793V5.20703C7.50013 2.64972 9.84436 0.500142 12.6943 0.5Z"
                  fill="white"
                  stroke="#1F0034"
                />
                <path
                  d="M27.0257 8.16V0L39 12H31.0171C27.4248 12 26.8593 9.44 27.0257 8.16Z"
                  fill="#1F0034"
                />
                <rect x="1" y="19" width="26" height="15" rx="3" fill="#D92D20" />
                <text fill="white" fontSize="9" fontWeight="bold" x="5" y="29.7">
                  PDF
                </text>
              </svg>
              <span className="text-base md:text-xl">
                {isGenerating ? t("program.pdfGenerating") : t("program.pdfDownload")}
              </span>
            </button>
          </div>
      </div>
    </section>
  );
}

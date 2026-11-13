import { useParams, useLocation, Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useSponsors, SponsorCategory, Sponsor } from "@/hooks/useSponsors";
import { usePreloadSpeakerImages } from "@/hooks/usePreloadSpeakerImages";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { cleanHtmlToText } from "@/utils/htmlUtils";
import { UserSquare, FileDown, Loader2 } from "lucide-react";
import { getProgramPersonSubtitle, getProgramPersonSubtitleOneLine } from "@/utils/programPersonDisplay";
import { enrichModeratorsWithSpeakerCatalog } from "@/utils/enrichProgramModerators";
import { programNoteToPlain, programNoteToSafeHtml } from "@/utils/programNotePlain";
// Simple text cleaner for program data (backend already cleans, this is extra safety)
function cleanProgramText(text: string | undefined): string {
  if (!text) return "";
  // Backend already cleans, but remove any remaining HTML tags just in case
  return text
    .replace(/<[^>]*>/g, "") // Remove complete HTML tags
    .replace(/<[^<]*$/g, "") // Remove incomplete tags at end
    .replace(/</g, "") // Remove any remaining <
    .trim();
}

interface Speaker {
  id?: number;
  name: string;
  slug: string;
  title: string;
  titleEn?: string;
  company?: string;
  companyEn?: string;
  position?: string;
  positionEn?: string;
  photo: string;
  bio?: string;
  biography?: string;
  year?: number;
  order?: number;
  pinnedYears?: string[];
}

interface ScheduleItemModerator {
  name: string;
  title?: string;
  titleEn?: string;
  photo?: string;
  company?: string;
  companyEn?: string;
  position?: string;
  positionEn?: string;
}

interface ScheduleItemSpeakerResolved {
  id: number;
  name: string;
  title?: string;
  titleEn?: string;
  photo?: string;
  company?: string;
  companyEn?: string;
  position?: string;
  positionEn?: string;
}

interface ScheduleItem {
  id: number;
  time: string;
  title: string;
  category?: string;
  description?: string;
  note?: string;
  moderator?: string;
  moderatorTitle?: string;
  moderatorIds?: number[];
  moderators?: ScheduleItemModerator[];
  speakerIds?: number[];
  speakers?: ScheduleItemSpeakerResolved[];
}

interface ProgramDay {
  id: number;
  title: string;
  date?: string;
  scheduleItems?: ScheduleItem[];
}

export default function Archive() {
  const { t, i18n } = useTranslation();
  const { year } = useParams<{ year: string }>();
  const location = useLocation();
  const locale = i18n.language?.startsWith("en") ? "en" : "tr";
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [programDays, setProgramDays] = useState<ProgramDay[]>([]);
  const [activeDay, setActiveDay] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSpeaker, setSelectedSpeaker] = useState<Speaker | null>(null);
  const [archiveDescription, setArchiveDescription] = useState<string>("");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  const konusmacilarRef = useRef<HTMLDivElement>(null);
  const programRef = useRef<HTMLDivElement>(null);
  const sponsorlarRef = useRef<HTMLDivElement>(null);
  const uezRef = useRef<HTMLDivElement>(null);

  // Normalize year for filtering (handle 2021-kasim, 2021-mart etc.)
  const getFilterYear = (yearParam: string): number => {
    if (yearParam.startsWith("2021")) return 2021;
    return parseInt(yearParam, 10);
  };
  
  // Get filter year for sponsors
  const filterYear = year ? getFilterYear(year).toString() : undefined;
  const { categories: sponsorCategories, isLoading: sponsorsLoading } = useSponsors(filterYear, locale);
  
  // Check if there are any sponsors (only when not loading)
  const hasSponsors = !sponsorsLoading && sponsorCategories
    .map((cat) => ({
      ...cat,
      sponsors: cat.sponsors.filter((s) => s.active !== false),
    }))
    .filter((cat) => cat.sponsors.length > 0).length > 0;

  // Fetch speakers by year - only from database
  useEffect(() => {
    if (!year) {
      setSpeakers([]);
      return;
    }
    
    const filterYear = getFilterYear(year);
    
    fetch(`/api/speakers?year=${filterYear}&locale=${locale}`)
      .then(res => res.json())
      .then(data => {
        let speakersList: Speaker[] = [];
        if (Array.isArray(data)) {
          speakersList = data;
        } else if (data.speakers && Array.isArray(data.speakers)) {
          speakersList = data.speakers;
        } else {
          // Only use database data, no fallback
          speakersList = [];
        }
        // Sort: pinned speakers first, then alphabetically for unpinned
        const currentYear = getFilterYear(year).toString();
        
        // Separate pinned and unpinned
        const pinned = speakersList.filter(s => {
          const pinnedYears = Array.isArray(s.pinnedYears) ? s.pinnedYears : [];
          return pinnedYears.includes(currentYear);
        });
        const unpinned = speakersList.filter(s => {
          const pinnedYears = Array.isArray(s.pinnedYears) ? s.pinnedYears : [];
          return !pinnedYears.includes(currentYear);
        });
        
        // Sort unpinned alphabetically
        unpinned.sort((a, b) => a.name.localeCompare(b.name, 'tr', { sensitivity: 'base' }));
        
        // Combine: pinned first, then unpinned
        speakersList = [...pinned, ...unpinned];
        
        setSpeakers(speakersList);
      })
      .catch(err => {
        console.error("Error fetching speakers:", err);
        setSpeakers([]);
      });
  }, [year, locale]);

  usePreloadSpeakerImages(speakers);

  // Fetch program by year (locale ile İngilizce içerik)
  useEffect(() => {
    if (!year) return;

    setLoading(true);
    const filterYear = getFilterYear(year);
    const programUrl = locale ? `/api/program?year=${filterYear}&locale=${locale}` : `/api/program?year=${filterYear}`;
    
    fetch(programUrl)
      .then(res => res.json())
      .then(data => {
        if (data.days) {
          setProgramDays(data.days);
          if (data.days.length > 0) {
            setActiveDay(data.days[0].id);
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching program:", err);
        setLoading(false);
      });
  }, [year, locale]);

  // Fetch archive description by year (locale ile EN yansır)
  useEffect(() => {
    if (!year) {
      setArchiveDescription("");
      return;
    }
    const filterYear = getFilterYear(year);
    fetch(`/api/archive/${filterYear}?locale=${locale}`)
      .then(res => {
        if (res.ok) {
          return res.json();
        }
        return null;
      })
      .then(data => {
        if (data && data.description) {
          setArchiveDescription(data.description);
        } else {
          setArchiveDescription("");
        }
      })
      .catch(err => {
        console.error("Error fetching archive description:", err);
        setArchiveDescription("");
      });
  }, [year, locale]);

  // PDF: gün ve saate göre düzenli program PDF'i oluştur (kartlar sayfa ortasında kesilmez)
  const createPdfWrapper = () => {
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
  };

  const createPdfEntry = (
    item: ScheduleItem,
    speakerListPdf: ScheduleItemSpeakerResolved[],
    moderatorList: ScheduleItemModerator[],
    pdfLocale: string,
  ) => {
    // Site renk paleti
    const purplePrimary = "#4B4596";
    const orangePrimary = "#EA9267";
    const black = "#000000";
    const grayText = "#666666";

    // Kapsayıcı div – kart yok, düz belge formatı
    const entryDiv = document.createElement("div");
    entryDiv.style.marginBottom = "6px";
    entryDiv.style.padding = "0";

    // --- "SAAT: [saat] [BAŞLIK]" satırı ---
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

    // --- Not / Açıklama ---
    const noteText = programNoteToPlain(item.note || item.description);
    if (noteText) {
      const noteDiv = document.createElement("div");
      noteDiv.textContent = noteText;
      noteDiv.style.fontSize = "12px";
      noteDiv.style.color = grayText;
      noteDiv.style.lineHeight = "1.5";
      noteDiv.style.marginBottom = "8px";
      noteDiv.style.paddingLeft = "24px";
      noteDiv.style.whiteSpace = "pre-line";
      entryDiv.appendChild(noteDiv);
    }

    // --- Konuşmacılar: bullet liste "• İSİM/ Unvan" ---
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

    // --- Moderatör: "➤ MODERATÖR: İSİM/ Unvan" ---
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
  };

  const generateProgramPdf = async () => {
    if (programDays.length === 0) return;
    setIsGeneratingPdf(true);
    try {
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

      // --- Ana başlık: büyük, koyu mavi, ortalı, tam genişlik alt çizgi ---
      const titleBlock = document.createElement("div");
      titleBlock.style.textAlign = "center";
      titleBlock.style.marginBottom = "4px";
      const title = document.createElement("h1");
      title.textContent = `UEZ ${displayYear} Programı`;
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
        // --- Gün başlığı: koyu mavi, alt çizgi ---
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
          const itemSpeakersPdf = (item.speakerIds || []).map((id) => speakers.find((s) => s.id === id)).filter(Boolean) as Speaker[];
          const speakerListPdf: ScheduleItemSpeakerResolved[] =
            item.speakers && item.speakers.length > 0
              ? item.speakers
              : itemSpeakersPdf.map((s) => ({
                  id: s.id!,
                  name: s.name,
                  title: s.title,
                  titleEn: s.titleEn,
                  photo: s.photo,
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
            speakers,
          );
          const entry = createPdfEntry(item, speakerListPdf, moderatorList, locale);
          await addSegmentToPdf(entry);
        }
      }

      doc.save(`program-${displayYear}.pdf`);
    } catch (err) {
      console.error("Archive PDF error:", err);
      alert(t("program.pdfError"));
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Hash ile scroll: sadece URL değişiminde, sonra dur
  const hasScrolledRef = useRef(false);
  
  useEffect(() => {
    const raw = location.hash?.replace(/^#/, "");
    if (!raw) {
      hasScrolledRef.current = false;
      return;
    }
    
    hasScrolledRef.current = false;
    
    let id: string;
    try {
      id = decodeURIComponent(raw);
    } catch {
      id = raw;
    }
    
    const scrollToTarget = () => {
      if (hasScrolledRef.current) return; // Bir kez scroll ettiyse dur
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
        hasScrolledRef.current = true; // bir daha scroll etme
      }
    };
    
    // İlk deneme hemen, layout için birkaç deneme daha
    scrollToTarget();
    const t1 = setTimeout(scrollToTarget, 200);
    const t2 = setTimeout(scrollToTarget, 600);
    
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [location.pathname, location.hash]);

  // Yükleme bitince hash varsa son bir deneme (veri geldiyse)
  useEffect(() => {
    if (!loading && location.hash && !hasScrolledRef.current) {
      const raw = location.hash.replace(/^#/, "");
      if (raw) {
        let id: string;
        try {
          id = decodeURIComponent(raw);
        } catch {
          id = raw;
        }
        const element = document.getElementById(id);
        if (element) {
          setTimeout(() => {
            if (!hasScrolledRef.current) {
              element.scrollIntoView({ behavior: "smooth", block: "start" });
              hasScrolledRef.current = true;
            }
          }, 100);
        }
      }
    }
  }, [loading]);

  // Çeviri anahtarı yoksa (örn. /arsiv/tr ile "archive.year_tr" görünmesin) geçerli yıl veya boş
  const rawYearLabel = year ? (t(`archive.year_${year}`) as string) : "";
  const isKeyFallback = rawYearLabel.startsWith("archive.") || rawYearLabel.includes("year_");
  const looksLikeYear = year && /^20\d{2}(-\w+)?$/.test(year);
  const yearLabel =
    rawYearLabel && !isKeyFallback ? rawYearLabel : looksLikeYear ? year : "";
  const displayYear = getFilterYear(year || "2024");

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-purple-dark via-purple-primary to-purple-dark overflow-hidden">
        <div className="absolute inset-0 bg-[url('/bg-dot.png')] opacity-5" />
        <Header />
        
        <div className="container mx-auto px-4 lg:px-16 py-16 lg:py-24 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <span className="inline-block px-6 py-2 bg-orange-primary/20 border border-orange-primary text-orange-primary rounded-full text-sm font-medium mb-6">
              {t("archive.badge")}
            </span>
            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6">
              {t("archive.title", { year: yearLabel })}
            </h1>
            <p className="text-lg text-white/80 mb-8">
              {t("archive.description", { year: yearLabel })}
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <a 
                href="#konusmacilar" 
                className="px-6 py-3 bg-purple-accent/50 hover:bg-purple-accent text-white rounded-full transition-colors"
              >
                {t("archive.speakers")}
              </a>
              <a 
                href="#program" 
                className="px-6 py-3 bg-purple-accent/50 hover:bg-purple-accent text-white rounded-full transition-colors"
              >
                {t("archive.program")}
              </a>
              {hasSponsors && (
                <a 
                  href="#sponsorlar" 
                  className="px-6 py-3 bg-purple-accent/50 hover:bg-purple-accent text-white rounded-full transition-colors"
                >
                  {t("archive.sponsors")}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="sticky top-0 z-40 bg-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-8 py-4">
            <a href="#konusmacilar" className="text-gray-600 hover:text-purple-primary font-medium transition-colors">
              {t("archive.speakers")}
            </a>
            <a href="#program" className="text-gray-600 hover:text-purple-primary font-medium transition-colors">
              {t("archive.program")}
            </a>
            {hasSponsors && (
              <a href="#sponsorlar" className="text-gray-600 hover:text-purple-primary font-medium transition-colors">
                {t("archive.sponsors")}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Konuşmacılar Section */}
      <section
        id="konusmacilar"
        ref={konusmacilarRef}
        className="relative scroll-mt-24 bg-white py-16 lg:py-24 overflow-hidden"
      >
        {/* Background decoration */}
        <img
          src="https://api.builder.io/api/v1/image/assets/TEMP/69b54a07d12ee51bd042591fe1b9ab9ab70a2325?width=1848"
          alt=""
          className="absolute right-0 top-32 w-[924px] h-auto opacity-60 pointer-events-none"
        />

        <div className="container mx-auto px-8 lg:px-16 relative z-10">
          <div className="flex justify-center mb-2">
            <div className="inline-flex items-center px-6 py-3 rounded-xl bg-orange-primary">
              <span className="text-purple-dark text-3xl lg:text-4xl font-normal">
                {t("archive.sectionBusinessMeeting")}
              </span>
            </div>
          </div>

          <h2 className="text-5xl lg:text-7xl font-semibold text-purple-dark text-center mb-16 leading-tight">
            <br />
            {t("archive.speakers")}
          </h2>

          {/* Speakers grid */}
          {speakers.length > 0 ? (
            <>
              {/* Pinned speakers - single row centered */}
              {(() => {
                const currentYear = year ? getFilterYear(year).toString() : '';
                const pinnedSpeakers = speakers.filter(s => {
                  const pinnedYears = Array.isArray(s.pinnedYears) ? s.pinnedYears : [];
                  return pinnedYears.includes(currentYear);
                });
                const unpinnedSpeakers = speakers.filter(s => {
                  const pinnedYears = Array.isArray(s.pinnedYears) ? s.pinnedYears : [];
                  return !pinnedYears.includes(currentYear);
                });
                
                return (
                  <>
                    {pinnedSpeakers.length > 0 && (
                      <div className="flex justify-center mb-12">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 lg:gap-12 items-stretch" style={{ maxWidth: 'fit-content' }}>
                          {pinnedSpeakers.map((speaker, index) => (
                            <div
                              key={`pinned-${speaker.slug}-${index}`}
                              className="flex flex-col items-center group cursor-pointer min-h-0"
                              onClick={() => setSelectedSpeaker(speaker)}
                            >
                              {/* Speaker image */}
                              <div className="relative mb-4 flex-shrink-0">
                                <div className={`w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 lg:w-80 lg:h-80 overflow-hidden rounded-xl flex items-center justify-center relative ${speaker.photo && speaker.photo.trim() ? 'bg-gradient-to-br from-purple-primary/20 to-orange-primary/20 shadow-md ring-4 ring-purple-primary' : 'ring-4 ring-purple-primary'}`}>
                                  {speaker.photo && speaker.photo.trim() ? (
                                    <img
                                      src={speaker.photo}
                                      alt={speaker.name}
                                      className="w-full h-full object-contain object-bottom rounded-xl relative z-10"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = "none";
                                        const parent = (e.target as HTMLImageElement).parentElement;
                                        if (parent) {
                                          const icon = parent.querySelector('.user-icon-fallback') as HTMLElement;
                                          if (icon) {
                                            icon.style.display = "flex";
                                          }
                                        }
                                      }}
                                    />
                                  ) : null}
                                  <div className={`user-icon-fallback ${speaker.photo && speaker.photo.trim() ? 'hidden' : 'flex'} items-center justify-center absolute inset-0 z-20 overflow-hidden`}>
                                    <UserSquare className="w-full h-full min-w-[140%] min-h-[140%] text-purple-primary fill-purple-primary/30" strokeWidth={0} />
                                  </div>
                                </div>
                              </div>

                              {/* Speaker info */}
                              <div className="w-full flex flex-col items-center flex-1 min-h-0 gap-2.5 flex-grow">
                                <div className="flex justify-center w-full flex-shrink-0 min-h-[3.5rem] sm:min-h-[4rem] flex items-center">
                                  <div className="px-3 sm:px-4 py-2 sm:py-3 rounded-tl-xl bg-gradient-purple max-w-full">
                                    <h3 className="text-white text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-center break-words">
                                      {speaker.name}
                                    </h3>
                                  </div>
                                </div>
                                <div className="flex justify-center w-full flex-1 min-h-[4rem] w-full">
                                  <div className="px-3 sm:px-4 py-2 sm:py-3 rounded-br-xl bg-gradient-orange max-w-full w-full min-h-[4rem] flex flex-col items-center justify-start gap-0.5">
                                    {(() => {
                                      const sub = getProgramPersonSubtitle(speaker, locale);
                                      return (
                                        <>
                                          <p className="text-white text-sm sm:text-base md:text-lg lg:text-xl font-medium text-center break-words">{sub.line1}</p>
                                          {sub.line2 && <p className="text-white text-sm sm:text-base md:text-lg lg:text-xl font-medium text-center break-words">{sub.line2}</p>}
                                        </>
                                      );
                                    })()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Unpinned speakers - normal grid */}
                    {unpinnedSpeakers.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 lg:gap-12 mb-12 items-stretch">
                        {unpinnedSpeakers.map((speaker, index) => (
                          <div
                            key={`${speaker.slug}-${index}`}
                            className="flex flex-col items-center group cursor-pointer min-h-0"
                            onClick={() => setSelectedSpeaker(speaker)}
                          >
                            {/* Speaker image */}
                            <div className="relative mb-4 flex-shrink-0">
                              <div className={`w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 lg:w-80 lg:h-80 overflow-hidden rounded-xl flex items-center justify-center relative ${speaker.photo && speaker.photo.trim() ? 'bg-gradient-to-br from-purple-primary/20 to-orange-primary/20 shadow-md' : ''}`}>
                                {speaker.photo && speaker.photo.trim() ? (
                                  <img
                                    src={speaker.photo}
                                    alt={speaker.name}
                                    className="w-full h-full object-contain object-bottom rounded-xl relative z-10"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = "none";
                                      const parent = (e.target as HTMLImageElement).parentElement;
                                      if (parent) {
                                        const icon = parent.querySelector('.user-icon-fallback') as HTMLElement;
                                        if (icon) {
                                          icon.style.display = "flex";
                                        }
                                      }
                                    }}
                                  />
                                ) : null}
<div className={`user-icon-fallback ${speaker.photo && speaker.photo.trim() ? 'hidden' : 'flex'} items-center justify-center absolute inset-0 z-20 overflow-hidden`}>
                                <UserSquare className="w-full h-full min-w-[140%] min-h-[140%] text-purple-primary fill-purple-primary/30" strokeWidth={0} />
                              </div>
                              </div>
                            </div>

                            {/* Speaker info */}
                            <div className="w-full flex flex-col items-center flex-1 min-h-0 gap-2.5 flex-grow">
                              <div className="flex justify-center w-full flex-shrink-0 min-h-[3.5rem] sm:min-h-[4rem] flex items-center">
                                <div className="px-3 sm:px-4 py-2 sm:py-3 rounded-tl-xl bg-gradient-purple max-w-full">
                                  <h3 className="text-white text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-center break-words">
                                    {speaker.name}
                                  </h3>
                                </div>
                              </div>
                              <div className="flex justify-center w-full flex-1 min-h-[4rem] w-full">
                                <div className="px-3 sm:px-4 py-2 sm:py-3 rounded-br-xl bg-gradient-orange max-w-full w-full min-h-[4rem] flex flex-col items-center justify-start gap-0.5">
                                  {(() => {
                                    const sub = getProgramPersonSubtitle(speaker, locale);
                                    return (
                                      <>
                                        <p className="text-white text-sm sm:text-base md:text-lg lg:text-xl font-medium text-center break-words">{sub.line1}</p>
                                        {sub.line2 && <p className="text-white text-sm sm:text-base md:text-lg lg:text-xl font-medium text-center break-words">{sub.line2}</p>}
                                      </>
                                    );
                                  })()}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              {loading ? t("archive.loading") : t("archive.noSpeakers", { year: displayYear })}
            </div>
          )}
        </div>

        {/* Speaker Modal */}
        <Dialog open={!!selectedSpeaker} onOpenChange={(open) => !open && setSelectedSpeaker(null)}>
          {selectedSpeaker && (
            <DialogContent className="max-w-4xl w-[95%] sm:w-[90%] md:w-[85%] lg:w-[80%] max-h-[90vh] overflow-y-auto bg-white p-0 rounded-2xl border-0 shadow-2xl [&>button]:hidden">
              {/* Background pattern */}
              <div className="relative bg-white rounded-2xl overflow-hidden">
                <div
                  className="absolute inset-0 opacity-20 pointer-events-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234B4596' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  }}
                />
                
                {/* Content */}
                <div className="relative z-10 p-6 sm:p-8 md:p-10 lg:p-12">
                  {/* Close button */}
                  <button
                    onClick={() => setSelectedSpeaker(null)}
                    className="absolute right-4 top-4 sm:right-6 sm:top-6 z-20 rounded-full bg-white/80 hover:bg-white p-2 transition-colors shadow-lg"
                    aria-label={t("common.close")}
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M18 6L6 18M6 6L18 18"
                        stroke="#1F0034"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>

                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-gray-text mb-8 sm:mb-10 md:mb-12 mt-10 sm:mt-0 text-center sm:text-left">
                    {t("archive.speakers")}
                  </h2>

                  {/* Speaker Content */}
                  <div className="flex flex-col">
                    {/* Profile Image and Info Row */}
                    <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 mb-6 sm:mb-8">
                      {/* Speaker Image */}
                      <div className="relative flex-shrink-0">
                        <div className={`w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 lg:w-72 lg:h-72 rounded-xl overflow-hidden flex items-center justify-center relative ${selectedSpeaker.photo && selectedSpeaker.photo.trim() ? 'bg-gradient-to-br from-purple-primary/20 to-orange-primary/20' : ''}`}>
                          {selectedSpeaker.photo && selectedSpeaker.photo.trim() ? (
                            <img
                              src={selectedSpeaker.photo}
                              alt={selectedSpeaker.name}
                              className="w-full h-full object-contain object-bottom rounded-xl relative z-10"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                                const parent = (e.target as HTMLImageElement).parentElement;
                                if (parent) {
                                  const icon = parent.querySelector('.user-icon-fallback') as HTMLElement;
                                  if (icon) {
                                    icon.style.display = "flex";
                                  }
                                }
                              }}
                            />
                          ) : null}
                          <div className={`user-icon-fallback ${selectedSpeaker.photo && selectedSpeaker.photo.trim() ? 'hidden' : 'flex'} items-center justify-center absolute inset-0 z-20 overflow-hidden`}>
                            <UserSquare className="w-full h-full min-w-[140%] min-h-[140%] text-purple-primary fill-purple-primary/30" strokeWidth={0} />
                          </div>
                        </div>
                      </div>

                      {/* Name and Title */}
                      <div className="flex flex-col items-center gap-2.5 flex-1">
                        {/* Name Badge */}
                        <div className="flex justify-center w-full">
                          <div className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-tl-xl bg-gradient-purple">
                            <h3 className="text-white text-base sm:text-lg md:text-xl font-semibold text-center">
                              {selectedSpeaker.name}
                            </h3>
                          </div>
                        </div>

                        {/* Title Badge */}
                        <div className="flex justify-center w-full">
                          <div className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-br-xl bg-gradient-orange flex flex-col items-center gap-0.5">
                            {(() => {
                              const sub = getProgramPersonSubtitle(selectedSpeaker, locale);
                              return (
                                <>
                                  <p className="text-white text-base sm:text-lg md:text-xl font-medium text-center">{sub.line1}</p>
                                  {sub.line2 && <p className="text-white text-base sm:text-lg md:text-xl font-medium text-center">{sub.line2}</p>}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Biography */}
                    {(selectedSpeaker.bio || selectedSpeaker.biography) && (
                      <div className="w-full">
            
                        <div className="text-base sm:text-lg md:text-xl text-gray-text leading-relaxed whitespace-pre-line">
                          {cleanHtmlToText(selectedSpeaker.bio || selectedSpeaker.biography || "")}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </DialogContent>
          )}
        </Dialog>
      </section>

      {/* Program Section */}
      <section id="program" ref={programRef} className="relative scroll-mt-24 bg-gray-light py-16 lg:py-24">
        <div className="container mx-auto px-8 lg:px-16">
          <h2 className="text-5xl lg:text-7xl font-semibold text-purple-dark text-center mb-12">
            {t("archive.program")}
          </h2>

          {programDays.length > 0 ? (
            <>
              {/* Day Tabs */}
              <div className="flex flex-wrap justify-center gap-6 mb-12">
                {programDays.map((day) => (
                  <button
                    key={day.id}
                    onClick={() => setActiveDay(day.id)}
                    className={`px-8 py-4 rounded-xl text-xl lg:text-2xl font-medium transition-colors ${
                      activeDay === day.id
                        ? "bg-gradient-to-r from-orange-accent via-salmon to-coral text-white"
                        : "bg-purple-primary text-white hover:bg-purple-accent"
                    }`}
                  >
                    {cleanProgramText(day.title)}
                  </button>
                ))}
              </div>

              {/* Program Schedule */}
              <div className="max-w-6xl mx-auto space-y-6">
                {programDays
                  .filter(day => day.id === activeDay)
                  .map(day => (
                    <div key={day.id} className="space-y-6">
                      {(day.scheduleItems || []).map((item, index) => {
                        const itemSpeakers = (item.speakerIds || [])
                          .map(id => speakers.find(s => s.id === id))
                          .filter(Boolean) as Speaker[];
                        const speakerList: ScheduleItemSpeakerResolved[] =
                          item.speakers && item.speakers.length > 0
                            ? item.speakers
                            : itemSpeakers.map((s) => ({
                                id: s.id!,
                                name: s.name,
                                title: s.title,
                                titleEn: s.titleEn,
                                photo: s.photo,
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
                          speakers,
                        );
                        return (
                          <div
                            key={item.id || index}
                            className={`rounded-xl p-6 lg:p-8 ${
                              index % 2 === 0 ? "bg-gray-medium" : "bg-gray-dark"
                            }`}
                          >
                            {/* Time and Content */}
                            <div className="flex items-start gap-4 lg:gap-8">
                              {/* Time with bullet */}
                              <div className="relative flex-shrink-0">
                                <div className="absolute -left-8 lg:-left-12 top-2 w-3 h-3 lg:w-4 lg:h-4 rounded-full bg-purple-primary"></div>
                                <span className="text-2xl lg:text-3xl font-semibold text-black">
                                  {cleanProgramText(item.time)}
                                </span>
                              </div>

                              <div className="flex-1">
                                {/* Session Title */}
                                {cleanProgramText(item.title).trim() ? (
                                  <div className="inline-flex items-center px-4 lg:px-6 py-2 lg:py-3 rounded-xl bg-purple-primary mb-4 lg:mb-6">
                                    <h3 className="text-white text-lg lg:text-2xl font-semibold">
                                      {cleanProgramText(item.title)}
                                    </h3>
                                  </div>
                                ) : (
                                  <div className="py-2 lg:py-3 mb-4 lg:mb-6" aria-hidden />
                                )}

                                {(item.note || item.description) && (
                                  <p
                                    className="text-sm leading-relaxed text-gray-600 mb-4 lg:text-base [&_b]:font-bold"
                                    dangerouslySetInnerHTML={{
                                      __html: programNoteToSafeHtml(item.note || item.description),
                                    }}
                                  />
                                )}

                                {/* Moderators - first (with photo like speakers) */}
                                {moderatorList.length > 0 && (
                                  <div className="mb-4">
                                    <p className="text-sm font-semibold text-purple-primary mb-3 uppercase tracking-wide">
                                      {t("program.moderators")}
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
                                      {moderatorList.map((mod, i) => (
                                        <div key={i} className="flex items-start gap-3 min-w-0">
                                          <div className={`w-12 h-12 lg:w-16 lg:h-16 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center relative ${mod.photo && mod.photo.trim() ? "bg-gradient-to-br from-purple-primary/20 to-orange-primary/20" : ""}`}>
                                            {mod.photo && mod.photo.trim() ? (
                                              <img
                                                src={mod.photo}
                                                alt={mod.name}
                                                className="w-full h-full object-cover relative z-10"
                                                onError={(e) => {
                                                  (e.target as HTMLImageElement).style.display = "none";
                                                  const parent = (e.target as HTMLImageElement).parentElement;
                                                  if (parent) {
                                                    const icon = parent.querySelector(".user-icon-fallback") as HTMLElement;
                                                    if (icon) icon.style.display = "flex";
                                                  }
                                                }}
                                              />
                                            ) : null}
                                            <div className={`user-icon-fallback ${mod.photo && mod.photo.trim() ? "hidden" : "flex"} items-center justify-center absolute inset-0 z-20 overflow-hidden`}>
                                              <UserSquare className="w-full h-full min-w-[140%] min-h-[140%] text-purple-primary fill-purple-primary/30" strokeWidth={0} />
                                            </div>
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <p className="text-base lg:text-lg font-bold text-black break-words">
                                              {cleanProgramText(mod.name)}
                                            </p>
                                            {(() => {
                                              const sub = getProgramPersonSubtitle(mod, locale);
                                              if (!sub.line1) return null;
                                              return (
                                                <>
                                                  <p className="text-xs lg:text-sm text-gray-text break-words leading-relaxed">
                                                    {cleanProgramText(sub.line1)}
                                                  </p>
                                                  {sub.line2 && (
                                                    <p className="text-xs lg:text-sm text-gray-text break-words leading-relaxed">
                                                      {cleanProgramText(sub.line2)}
                                                    </p>
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

                                {/* Speakers - hemen moderatörlerin altında */}
                                {speakerList.length > 0 && (
                                  <div>
                                    <p className="text-sm font-semibold text-purple-primary mb-3 uppercase tracking-wide">
                                      {speakerList.length === 1 ? t("program.speaker") : t("program.speakers")}
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
                                      {speakerList.map((speaker, speakerIndex) => (
                                        <div
                                          key={speaker.id ?? speakerIndex}
                                          className="flex items-start gap-3 min-w-0"
                                        >
                                          <div className={`w-12 h-12 lg:w-16 lg:h-16 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center relative ${speaker.photo && speaker.photo.trim() ? 'bg-gradient-to-br from-purple-primary/20 to-orange-primary/20' : ''}`}>
                                            {speaker.photo && speaker.photo.trim() ? (
                                              <img
                                                src={speaker.photo}
                                                alt={speaker.name}
                                                className="w-full h-full object-cover relative z-10"
                                                onError={(e) => {
                                                  (e.target as HTMLImageElement).style.display = "none";
                                                  const parent = (e.target as HTMLImageElement).parentElement;
                                                  if (parent) {
                                                    const icon = parent.querySelector('.user-icon-fallback') as HTMLElement;
                                                    if (icon) icon.style.display = "flex";
                                                  }
                                                }}
                                              />
                                            ) : null}
                                            <div className={`user-icon-fallback ${speaker.photo && speaker.photo.trim() ? 'hidden' : 'flex'} items-center justify-center absolute inset-0 z-20 overflow-hidden`}>
                                              <UserSquare className="w-full h-full min-w-[140%] min-h-[140%] text-purple-primary fill-purple-primary/30" strokeWidth={0} />
                                            </div>
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <p className="text-base lg:text-lg font-bold text-black break-words">
                                              {cleanProgramText(speaker.name)}
                                            </p>
                                            {(() => {
                                              const sub = getProgramPersonSubtitle(speaker, locale);
                                              if (!sub.line1) return null;
                                              return (
                                                <>
                                                  <p className="text-xs lg:text-sm text-gray-text break-words leading-relaxed">{cleanProgramText(sub.line1)}</p>
                                                  {sub.line2 && <p className="text-xs lg:text-sm text-gray-text break-words leading-relaxed">{cleanProgramText(sub.line2)}</p>}
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
                      })}
                    </div>
                  ))}
              </div>

              {/* Programı PDF olarak indir - programın hemen altında */}
              <div className="max-w-6xl mx-auto mt-10 flex justify-end">
                <button
                  type="button"
                  onClick={generateProgramPdf}
                  disabled={isGeneratingPdf}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-primary text-white font-medium hover:bg-purple-accent disabled:opacity-70 disabled:cursor-not-allowed transition-colors shadow-md"
                >
                  {isGeneratingPdf ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t("program.pdfGenerating")}
                    </>
                  ) : (
                    <>
                      <FileDown className="w-5 h-5" />
                      {t("program.pdfDownload")}
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              {loading ? t("archive.loading") : t("archive.noProgram", { year: displayYear })}
            </div>
          )}
        </div>
      </section>

      {/* Sponsorlar Section */}
      {hasSponsors && (
        <section id="sponsorlar" ref={sponsorlarRef} className="relative scroll-mt-24 bg-purple-dark py-12 lg:py-16 overflow-hidden">
        <div className="container mx-auto px-8 lg:px-16 relative z-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-semibold text-white text-center mb-8 sm:mb-12 md:mb-14 lg:mb-16 leading-tight">
            {t("archive.sponsorsTitle")}
          </h2>

          {/* Loading state */}
          {sponsorsLoading && (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-purple-accent border-t-orange-primary rounded-full animate-spin" />
            </div>
          )}

          {/* Sponsor categories */}
          <div className="space-y-16">
            {sponsorCategories
              .map((cat) => ({
                ...cat,
                sponsors: cat.sponsors.filter((s) => s.active !== false),
              }))
              .filter((cat) => cat.sponsors.length > 0)
              .map((category) => (
                <div key={category.id} className="space-y-8">
                  {/* Category divider */}
                  <div className="border-t border-purple-accent pt-8">
                    <h3 className="text-2xl lg:text-3xl font-semibold text-white text-center mb-8">
                      {category.title}
                    </h3>
                  </div>

                  {/* Sponsors grid */}
                  <div
                    className={`grid gap-8 ${
                      category.sponsors.length === 1
                        ? "grid-cols-1 justify-items-center"
                        : category.sponsors.length <= 3
                          ? "grid-cols-1 md:grid-cols-3"
                          : "grid-cols-2 md:grid-cols-4"
                    }`}
                  >
                    {category.sponsors.map((sponsor) => (
                      <a
                        key={sponsor.id}
                        href={sponsor.url || undefined}
                        target={sponsor.url ? "_blank" : undefined}
                        rel={sponsor.url ? "noopener noreferrer" : undefined}
                        className={`flex items-center justify-center p-8 lg:p-12 bg-purple-dark/50 rounded-lg hover:bg-purple-dark/70 transition-colors ${
                          sponsor.url ? "cursor-pointer" : "cursor-default"
                        }`}
                      >
                        <img
                          src={sponsor.localImage || sponsor.image}
                          alt={sponsor.name}
                          className="object-contain"
                          style={{
                            width: sponsor.width ? `${sponsor.width}%` : "100%",
                            height: "auto",
                            maxWidth: "100%",
                            maxHeight: "300px",
                          }}
                          onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </a>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>
      )}

      {/* UEZ Info Section */}
      <section id="uez" ref={uezRef} className="scroll-mt-24 py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4 lg:px-16">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl lg:text-5xl font-bold text-purple-dark mb-8 text-center">
              UEZ {displayYear}
            </h2>
            {archiveDescription && (
              <p className="text-lg text-gray-600 mb-8 text-justify">
                {archiveDescription}
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 text-center">
              <div className="bg-purple-50 rounded-2xl p-8">
                <div className="text-4xl font-bold text-purple-primary mb-2">{speakers.length}+</div>
                <div className="text-gray-600">{t("archive.speakerCount")}</div>
              </div>
              <div className="bg-purple-50 rounded-2xl p-8">
                <div className="text-4xl font-bold text-purple-primary mb-2">{programDays.length}</div>
                <div className="text-gray-600">{t("archive.dayCount")}</div>
              </div>
              <div className="bg-purple-50 rounded-2xl p-8">
                <div className="text-4xl font-bold text-purple-primary mb-2">
                  {programDays.reduce((acc, day) => acc + (day.scheduleItems?.length || 0), 0)}+
                </div>
                <div className="text-gray-600">{t("archive.sessionCount")}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}



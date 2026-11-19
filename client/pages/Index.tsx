import { useEffect, useRef, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useSponsors } from "@/hooks/useSponsors";
import { UserSquare, FileDown, Loader2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cleanHtmlToText } from "@/utils/htmlUtils";
import { getApiBase } from "@shared/getApiBase";
import { getProgramPersonSubtitle } from "@/utils/programPersonDisplay";
import { enrichModeratorsWithSpeakerCatalog } from "@/utils/enrichProgramModerators";
import { cleanProgramText, downloadProgramPdf2026 } from "@/utils/programPdfExport";
import { ProgramNoteBlock } from "@/components/ProgramNoteBlock";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/** Yakında kartı hep gösterilir. 2026 yüklendiğinde bu blok gerçek Program/Konuşmacı/Sponsor içeriği ile değiştirilebilir */
const SHOW_PROGRAM_SPEAKERS_SPONSORS = true;
const YEAR_2026 = "2026";

interface Speaker {
  id?: number;
  slug?: string;
  name: string;
  title: string;
  titleEn?: string;
  company?: string;
  companyEn?: string;
  position?: string;
  positionEn?: string;
  photo: string;
  bio?: string;
  biography?: string;
  pinnedYears?: string[];
  order?: number;
}

/** Sıralama için unvanları (Prof. Dr., Dr. Av., Dr., Av., Prof.) kaldırır */
function nameForSort(name: string): string {
  let s = (name || "").trim();
  const profDr = /^Prof\.\s*Dr\.\s*/i;
  const drAv = /^Dr\.\s*Av\.\s*/i;
  const dr = /^Dr\.\s*/i;
  const av = /^Av\.\s*/i;
  const prof = /^Prof\.\s*/i;
  s = s.replace(profDr, "").trim();
  s = s.replace(drAv, "").trim();
  s = s.replace(dr, "").trim();
  s = s.replace(av, "").trim();
  s = s.replace(prof, "").trim();
  return s;
}

async function fetchSpeakers2026(locale: string): Promise<Speaker[]> {
  const res = await fetch(`${getApiBase()}/api/speakers?year=${YEAR_2026}&locale=${locale}`);
  if (!res.ok) throw new Error(`Speakers request failed: ${res.status}`);
  const data = await res.json();
  if (Array.isArray(data)) return data;
  if (data?.speakers && Array.isArray(data.speakers)) return data.speakers;
  return [];
}

interface ProgramItemModerator {
  name: string;
  title?: string;
  titleEn?: string;
  photo?: string;
  company?: string;
  companyEn?: string;
  position?: string;
  positionEn?: string;
}

interface ProgramItemSpeaker {
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

interface ProgramScheduleItem {
  id?: number;
  time: string;
  title: string;
  note?: string;
  note_image?: string;
  description?: string;
  moderator?: string;
  moderatorTitle?: string;
  moderatorIds?: number[];
  moderators?: ProgramItemModerator[];
  speakerIds?: number[];
  speakerNames?: string[];
  speakers?: ProgramItemSpeaker[];
}

interface ProgramDay {
  id: number;
  title: string;
  order?: number;
  scheduleItems?: ProgramScheduleItem[];
}

async function fetchProgram2026(locale: string): Promise<{ days: ProgramDay[] }> {
  const res = await fetch(`${getApiBase()}/api/program?year=${parseInt(YEAR_2026, 10)}&locale=${locale}`);
  if (!res.ok) throw new Error(`Program request failed: ${res.status}`);
  const data = await res.json();
  return { days: data?.days ?? [] };
}

export default function Index() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const { pathname, hash } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { settings } = useSiteSettings();
  const locale = i18n.language?.startsWith("en") ? "en" : "tr";

  const { data: speakers2026 = [], isLoading: speakersLoading, error: speakersError, refetch: retrySpeakers } = useQuery({
    queryKey: ["speakers", YEAR_2026, locale],
    queryFn: () => fetchSpeakers2026(locale),
  });

  const { categories: sponsorCategories, isLoading: sponsorsLoading, error: sponsorsError } = useSponsors(YEAR_2026, locale);
  const sponsors2026 = sponsorCategories
    .map((cat) => ({
      ...cat,
      title: locale === "en" && cat.title_en ? cat.title_en : cat.title,
      // Tera Finans was withdrawn from the 2026 summit sponsor display.
      sponsors: cat.sponsors.filter((s) => s.active && s.id !== 4290),
    }))
    .filter((cat) => cat.sponsors.length > 0);
  const hasSpeakers = speakers2026.length > 0;
  const hasSponsors = sponsors2026.length > 0;
  const [selectedSpeaker, setSelectedSpeaker] = useState<Speaker | null>(null);
  const [activeProgramDayId, setActiveProgramDayId] = useState<number | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const { data: program2026Data, isLoading: programLoading, error: programError, refetch: retryProgram } = useQuery({
    queryKey: ["program", YEAR_2026, locale],
    queryFn: () => fetchProgram2026(locale),
  });
  const programDays = (program2026Data?.days ?? []).sort(
    (a: ProgramDay, b: ProgramDay) => (a.order ?? a.id) - (b.order ?? b.id)
  );
  const activeProgramDay =
    programDays.length > 0 && activeProgramDayId !== null && programDays.some((d) => d.id === activeProgramDayId)
      ? activeProgramDayId
      : programDays[0]?.id ?? null;
  useEffect(() => {
    if (programDays.length > 0 && activeProgramDayId === null) setActiveProgramDayId(programDays[0].id);
  }, [programDays, activeProgramDayId]);

  useEffect(() => {
    const payment = searchParams.get("payment");
    if (payment === "success" || payment === "failed" || payment === "error") {
      const messageKey =
        payment === "success"
          ? "registration.paymentSuccess"
          : payment === "failed"
            ? "registration.paymentFailed"
            : "registration.paymentError";
      if (payment === "success") {
        toast.success(t(messageKey));
      } else if (payment === "failed") {
        toast.warning(t(messageKey));
      } else {
        toast.error(t(messageKey));
      }
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, t]);

  const generateProgramPdf = async () => {
    if (programDays.length === 0) return;
    setIsGeneratingPdf(true);
    try {
      await downloadProgramPdf2026({
        days: programDays,
        speakers: speakers2026,
        locale,
      });
    } catch (err) {
      console.error("Index program PDF error:", err);
      alert(t("program.pdfError"));
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Menüden Program / Sponsorlar tıklanınca scroll (anasayfadaysak veya başka sayfadan /#program, /#sponsorlar ile gelindiyse)
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (!/^\/arsiv\/2026\/zirve\/?$/.test(pathname)) return;
    const hashValue = (hash || window.location.hash || "").replace(/^#/, "") ? (hash || window.location.hash) : "";
    const hasHash = hashValue === "#program" || hashValue === "program" || hashValue === "#sponsorlar" || hashValue === "sponsorlar";
    // Hash varsa her zaman scroll (başka sayfadan gelince de çalışsın); hash yoksa sadece ilk mount'ta atlama
    if (!hasHash && isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (hasHash) isInitialMount.current = false;
    if (hashValue === "#program" || hashValue === "program") {
      setTimeout(() => {
        document.getElementById("program")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    }
    if (hashValue === "#sponsorlar" || hashValue === "sponsorlar") {
      setTimeout(() => {
        document.getElementById("sponsorlar")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    }
  }, [pathname, hash]);

  useEffect(() => {
    // #stars-of-region -> scroll (tarayıcı ile direkt girilirse)
    const handleHashChange = () => {
      const h = window.location.hash;
      if (h === "#stars-of-region") {
        setTimeout(() => {
          const starsSection = document.getElementById("stars-of-region");
          if (starsSection) starsSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
        window.history.replaceState(null, "", window.location.pathname);
      }
    };
    if (window.location.hash === "#stars-of-region") handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero section with header */}
      <div className="relative overflow-hidden bg-[url('/background-800.png')] bg-cover bg-center bg-no-repeat pt-2">
        <div>
          <Header />
        </div>
        <Hero />
      </div>

      {SHOW_PROGRAM_SPEAKERS_SPONSORS && (
        <>
          {(speakersError || sponsorsError || programError) ? (
            <div role="alert" className="mx-auto max-w-3xl px-8 py-8 text-center text-purple-dark">
              <p>{t("index.contentError")}</p>
              <button type="button" className="mt-3 rounded-lg border border-purple-dark px-5 py-2" onClick={() => { void retrySpeakers(); void retryProgram(); void queryClient.invalidateQueries({ queryKey: ["sponsors"] }); }}>
                {t("index.retryContent")}
              </button>
            </div>
          ) : (!speakersLoading && !sponsorsLoading && !programLoading && !hasSpeakers && !hasSponsors && programDays.length === 0) ? (
            <p role="status" className="px-8 py-8 text-center text-purple-dark">{t("index.contentEmpty")}</p>
          ) : null}
          {/* 2026 Konuşmacılar */}
          {(hasSpeakers || speakersLoading) && (
            <section id="konusmacilar" className="relative bg-white py-12 lg:py-16 overflow-hidden">
              <div className="container mx-auto px-8 lg:px-16 relative z-10">
                {/* Konuşmacılar — arşiv ile aynı tasarım, pinned ortalı */}
                {(hasSpeakers || speakersLoading) && (
                  <div className="mb-12 lg:mb-16">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-semibold text-purple-dark text-center mb-8 sm:mb-12 md:mb-14 lg:mb-16 leading-tight">
                      {t("index.speakers2026")}
                    </h2>
                    {speakersLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="w-8 h-8 border-4 border-purple-primary border-t-orange-primary rounded-full animate-spin" />
                      </div>
                    ) : (() => {
                      const byName = (a: Speaker, b: Speaker) =>
                        nameForSort(a.name).localeCompare(nameForSort(b.name), locale === "tr" ? "tr-TR" : "en-US", { sensitivity: "accent" });
                      const pinnedSpeakers = speakers2026
                        .filter((s) => {
                          const pinnedYears = Array.isArray(s.pinnedYears) ? s.pinnedYears : [];
                          return pinnedYears.includes(YEAR_2026);
                        })
                        .slice()
                        .sort((a, b) => {
                          // For pinned speakers, sort by order field first, then by name
                          const aOrder = a.order || 0;
                          const bOrder = b.order || 0;
                          if (aOrder !== bOrder) {
                            return aOrder - bOrder;
                          }
                          return byName(a, b);
                        });
                      const unpinnedSpeakers = speakers2026
                        .filter((s) => {
                          const pinnedYears = Array.isArray(s.pinnedYears) ? s.pinnedYears : [];
                          return !pinnedYears.includes(YEAR_2026);
                        })
                        .slice()
                        .sort(byName);
                      return (
                        <>
                          {pinnedSpeakers.length > 0 && (
                            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 md:gap-8 lg:gap-12 mb-12 items-stretch">
                              {pinnedSpeakers.map((speaker, index) => (
                                <div
                                  key={`pinned-${speaker.slug ?? speaker.id ?? speaker.name}-${index}`}
                                  className="flex flex-col items-center cursor-pointer min-h-0"
                                  onClick={() => setSelectedSpeaker(speaker)}
                                >
                                  <div className="relative mb-3 sm:mb-4 flex-shrink-0">
                                    <div className={`w-56 h-56 sm:w-52 sm:h-52 md:w-64 md:h-64 lg:w-72 lg:h-72 xl:w-80 xl:h-80 overflow-hidden rounded-xl flex items-center justify-center relative ${speaker.photo?.trim() ? "bg-gradient-to-br from-purple-primary/20 to-orange-primary/20 shadow-md ring-4 ring-purple-primary" : "ring-4 ring-purple-primary"}`}>
                                      {speaker.photo?.trim() ? (
                                        <img
                                          src={speaker.photo}
                                          alt={speaker.name}
                                          className="w-full h-full object-cover object-center rounded-xl relative z-10"
                                        />
                                      ) : null}
                                      <div className={`user-icon-fallback ${speaker.photo?.trim() ? "hidden" : "flex"} items-center justify-center absolute inset-0 z-20 overflow-hidden`}>
                                        <UserSquare className="w-full h-full min-w-[140%] min-h-[140%] text-purple-primary fill-purple-primary/30" strokeWidth={0} />
                                      </div>
                                    </div>
                                  </div>
                                  <div className="w-full flex flex-col items-center flex-1 min-h-0 gap-2.5 flex-grow">
                                    <div className="flex justify-center w-full flex-shrink-0 min-h-[3.5rem] sm:min-h-[4rem] flex items-center">
                                      <div className="px-3 sm:px-4 py-2 sm:py-3 rounded-tl-xl bg-gradient-purple max-w-full min-w-0">
                                        <h3 className="text-white text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-center break-words">{speaker.name}</h3>
                                      </div>
                                    </div>
                                    <div className="flex justify-center w-full flex-1 min-h-[4rem] w-full">
                                      <div className="px-3 sm:px-4 py-2 sm:py-3 rounded-br-xl bg-gradient-orange max-w-full min-w-0 w-full min-h-[4rem] flex flex-col items-center justify-center gap-0.5 text-center">
                                        {(() => {
                                          const sub = getProgramPersonSubtitle(speaker, locale);
                                          return (
                                            <>
                                              <p className="text-white text-xs sm:text-sm md:text-base lg:text-lg font-medium text-center break-words w-full">{sub.line1}</p>
                                              {sub.line2 && <p className="text-white text-xs sm:text-sm md:text-base lg:text-lg font-medium text-center break-words w-full">{sub.line2}</p>}
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
                          {unpinnedSpeakers.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8 md:gap-10 lg:gap-12 xl:gap-16 items-stretch">
                              {unpinnedSpeakers.map((speaker, index) => (
                                <div
                                  key={`${speaker.slug ?? speaker.id ?? speaker.name}-${index}`}
                                  className="flex flex-col items-center cursor-pointer min-h-0"
                                  onClick={() => setSelectedSpeaker(speaker)}
                                >
                                  <div className="relative mb-3 sm:mb-4 flex-shrink-0">
                                    <div className={`w-56 h-56 sm:w-52 sm:h-52 md:w-64 md:h-64 lg:w-72 lg:h-72 xl:w-80 xl:h-80 overflow-hidden rounded-xl flex items-center justify-center relative ${speaker.photo?.trim() ? "bg-gradient-to-br from-purple-primary/20 to-orange-primary/20 shadow-md" : ""}`}>
                                      {speaker.photo?.trim() ? (
                                        <img
                                          src={speaker.photo}
                                          alt={speaker.name}
                                          className="w-full h-full object-cover object-center rounded-xl relative z-10"
                                        />
                                      ) : null}
                                      <div className={`user-icon-fallback ${speaker.photo?.trim() ? "hidden" : "flex"} items-center justify-center absolute inset-0 z-20 overflow-hidden`}>
                                        <UserSquare className="w-full h-full min-w-[140%] min-h-[140%] text-purple-primary fill-purple-primary/30" strokeWidth={0} />
                                      </div>
                                    </div>
                                  </div>
                                  <div className="w-full flex flex-col items-center flex-1 min-h-0 gap-2.5 flex-grow">
                                    <div className="flex justify-center w-full flex-shrink-0 min-h-[3.5rem] sm:min-h-[4rem] flex items-center">
                                      <div className="px-3 sm:px-4 py-2 sm:py-3 rounded-tl-xl bg-gradient-purple max-w-full min-w-0">
                                        <h3 className="text-white text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-center break-words">{speaker.name}</h3>
                                      </div>
                                    </div>
                                    <div className="flex justify-center w-full flex-1 min-h-[4rem] w-full">
                                      <div className="px-3 sm:px-4 py-2 sm:py-3 rounded-br-xl bg-gradient-orange max-w-full min-w-0 w-full min-h-[4rem] flex flex-col items-center justify-center gap-0.5 text-center">
                                        {(() => {
                                          const sub = getProgramPersonSubtitle(speaker, locale);
                                          return (
                                            <>
                                              <p className="text-white text-xs sm:text-sm md:text-base lg:text-lg font-medium text-center break-words w-full">{sub.line1}</p>
                                              {sub.line2 && <p className="text-white text-xs sm:text-sm md:text-base lg:text-lg font-medium text-center break-words w-full">{sub.line2}</p>}
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
                  </div>
                )}

                {/* Konuşmacı modal — arşivdeki gibi */}
                <Dialog open={!!selectedSpeaker} onOpenChange={(open) => !open && setSelectedSpeaker(null)}>
                  {selectedSpeaker && (
                    <DialogContent className="max-w-4xl w-[95%] sm:w-[90%] md:w-[85%] lg:w-[80%] max-h-[90vh] overflow-y-auto bg-white p-0 rounded-2xl border-0 shadow-2xl [&>button]:hidden">
                      <div className="relative bg-white rounded-2xl overflow-hidden">
                        <div
                          className="absolute inset-0 opacity-20 pointer-events-none"
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234B4596' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                          }}
                        />
                        <div className="relative z-10 p-6 sm:p-8 md:p-10 lg:p-12">
                          <button
                            onClick={() => setSelectedSpeaker(null)}
                            className="absolute right-4 top-4 sm:right-6 sm:top-6 z-20 rounded-full bg-white/80 hover:bg-white p-2 transition-colors shadow-lg"
                            aria-label={t("common.close")}
                          >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M18 6L6 18M6 6L18 18" stroke="#1F0034" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                          <div className="flex flex-col pt-6">
                            <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 mb-6 sm:mb-8">
                              <div className="relative flex-shrink-0">
                                <div className={`w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 lg:w-72 lg:h-72 rounded-xl overflow-hidden flex items-center justify-center relative ${selectedSpeaker.photo?.trim() ? "bg-gradient-to-br from-purple-primary/20 to-orange-primary/20" : ""}`}>
                                  {selectedSpeaker.photo?.trim() ? (
                                    <img
                                      src={selectedSpeaker.photo}
                                      alt={selectedSpeaker.name}
                                      className="w-full h-full object-cover object-center rounded-xl relative z-10"
                                    />
                                  ) : null}
                                  <div className={`user-icon-fallback ${selectedSpeaker.photo?.trim() ? "hidden" : "flex"} items-center justify-center absolute inset-0 z-20 overflow-hidden`}>
                                    <UserSquare className="w-full h-full min-w-[140%] min-h-[140%] text-purple-primary fill-purple-primary/30" strokeWidth={0} />
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col items-center gap-2.5 flex-1">
                                <div className="flex justify-center w-full">
                                  <div className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-tl-xl bg-gradient-purple">
                                    <h3 className="text-white text-base sm:text-lg md:text-xl font-semibold text-center">{selectedSpeaker.name}</h3>
                                  </div>
                                </div>
                                <div className="flex justify-center w-full">
                                  <div className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-br-xl bg-gradient-orange flex flex-col items-center gap-0.5">
                                    {(() => {
                                      const sub = getProgramPersonSubtitle(selectedSpeaker, locale);
                                      return (
                                        <>
                                          <p className="text-white text-sm sm:text-base md:text-lg font-medium text-center">{sub.line1}</p>
                                          {sub.line2 && <p className="text-white text-sm sm:text-base md:text-lg font-medium text-center">{sub.line2}</p>}
                                        </>
                                      );
                                    })()}
                                  </div>
                                </div>
                              </div>
                            </div>
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
              </div>
            </section>
          )}

          {/* 2026 Program — Konuşmacılar ile aynı başlık/bölüm ritmi */}
          <section id="program" className="relative bg-gray-light py-12 lg:py-16 overflow-hidden">
            <div className="container mx-auto px-8 lg:px-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-semibold text-purple-dark text-center mb-8 sm:mb-12 md:mb-14 lg:mb-16 leading-tight">
                {t("index.program2026")}
              </h2>

              {programDays.length > 0 ? (
                <>
                  {/* Gün sekmeleri */}
                  <div className="flex flex-wrap justify-center gap-6 mb-12">
                    {programDays.map((day) => (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => setActiveProgramDayId(day.id)}
                        className={`px-8 py-4 rounded-xl text-xl lg:text-2xl font-medium transition-colors ${
                          activeProgramDay === day.id
                            ? "bg-gradient-to-r from-orange-accent via-salmon to-coral text-white"
                            : "bg-purple-primary text-white hover:bg-purple-accent"
                        }`}
                      >
                        {cleanProgramText(day.title)}
                      </button>
                    ))}
                  </div>

                  {/* Program listesi — seçili gün */}
                  <div className="max-w-6xl mx-auto space-y-6">
                    {programDays
                      .filter((day) => day.id === activeProgramDay)
                      .map((day) => (
                        <div key={day.id} className="space-y-6">
                          {(day.scheduleItems || []).map((item, index) => {
                            const itemSpeakersFromIds = (item.speakerIds || [])
                              .map((id) => speakers2026.find((s) => s.id === id))
                              .filter(Boolean) as Speaker[];
                            const speakerList: ProgramItemSpeaker[] =
                              item.speakers && item.speakers.length > 0
                                ? item.speakers
                                : itemSpeakersFromIds.map((s) => ({
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
                              speakers2026,
                            );
                            return (
                              <div
                                key={item.id ?? index}
                                className={`rounded-xl p-6 lg:p-8 ${
                                  index % 2 === 0 ? "bg-gray-medium" : "bg-gray-dark"
                                }`}
                              >
                                <div className="flex items-start gap-4 lg:gap-8">
                                  <div className="relative flex-shrink-0">
                                    <div className="absolute -left-8 lg:-left-12 top-2 w-3 h-3 lg:w-4 lg:h-4 rounded-full bg-purple-primary" />
                                    <span className="text-2xl lg:text-3xl font-semibold text-black">
                                      {cleanProgramText(item.time)}
                                    </span>
                                  </div>
                                  <div className="flex-1">
                                    {cleanProgramText(item.title).trim() ? (
                                      <div className="inline-flex items-center px-4 lg:px-6 py-2 lg:py-3 rounded-xl bg-purple-primary mb-4 lg:mb-6">
                                        <h3 className="text-white text-lg lg:text-2xl font-semibold">
                                          {cleanProgramText(item.title)}
                                        </h3>
                                      </div>
                                    ) : (
                                      <div className="py-2 lg:py-3 mb-4 lg:mb-6" aria-hidden />
                                    )}
                                    {(item.note || item.description || item.note_image) && (
                                      <div className="mb-4">
                                        <ProgramNoteBlock
                                          text={item.note || item.description}
                                          imageUrl={item.note_image}
                                          className="text-gray-600"
                                        />
                                      </div>
                                    )}
                                    {moderatorList.length > 0 && (
                                      <div className="mb-4">
                                        <p className="text-sm font-semibold text-purple-primary mb-3 uppercase tracking-wide">
                                          {t("program.moderators")}
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
                                          {moderatorList.map((mod, i) => (
                                            <div key={i} className="flex items-start gap-3 min-w-0">
                                              <div
                                                className={`w-12 h-12 lg:w-16 lg:h-16 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center relative ${
                                                  mod.photo?.trim() ? "bg-gradient-to-br from-purple-primary/20 to-orange-primary/20" : ""
                                                }`}
                                              >
                                                {mod.photo?.trim() ? (
                                                  <img
                                                    src={mod.photo}
                                                    alt={mod.name}
                                                    className="w-full h-full object-cover relative z-10"
                                                  />
                                                ) : null}
                                                <div
                                                  className={`user-icon-fallback ${mod.photo?.trim() ? "hidden" : "flex"} items-center justify-center absolute inset-0 z-20 overflow-hidden`}
                                                >
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
                                    {speakerList.length > 0 && (
                                      <div>
                                        <p className="text-sm font-semibold text-purple-primary mb-3 uppercase tracking-wide">
                                          {speakerList.length === 1 ? t("program.speaker") : t("program.speakers")}
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
                                          {speakerList.map((speaker, speakerIndex) => (
                                            <div key={speaker.id ?? speakerIndex} className="flex items-start gap-3 min-w-0">
                                              <div
                                                className={`w-12 h-12 lg:w-16 lg:h-16 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center relative ${
                                                  speaker.photo?.trim() ? "bg-gradient-to-br from-purple-primary/20 to-orange-primary/20" : ""
                                                }`}
                                              >
                                                {speaker.photo?.trim() ? (
                                                  <img
                                                    src={speaker.photo}
                                                    alt={speaker.name}
                                                    className="w-full h-full object-cover relative z-10"
                                                  />
                                                ) : null}
                                                <div
                                                  className={`user-icon-fallback ${speaker.photo?.trim() ? "hidden" : "flex"} items-center justify-center absolute inset-0 z-20 overflow-hidden`}
                                                >
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
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                  </div>

                  {/* Programı PDF olarak indir — arşivdeki gibi */}
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
                  {programError ? t("index.contentError") : programLoading ? t("common.loading", "Yükleniyor…") : t("index.programEmpty")}
                </div>
              )}
            </div>
          </section>

          {/* Sponsorlar — Konuşmacılar/Program ile aynı başlık ve bölüm ritmi */}
          {(hasSponsors || sponsorsLoading) && (
            <section id="sponsorlar" className="relative bg-purple-dark py-12 lg:py-16 overflow-hidden">
              <div className="container mx-auto px-8 lg:px-16 relative z-10 max-w-[1600px]">
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-semibold text-white text-center mb-8 sm:mb-12 md:mb-14 lg:mb-16 leading-tight">
                  {t("index.sponsors2026")}
                </h2>
                {sponsorsLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-purple-accent border-t-orange-primary rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-16">
                    {sponsors2026.map((category) => (
                      <div key={category.id} className="space-y-8">
                        <div className="border-t border-purple-accent pt-6">
                          <h3 className="text-xl lg:text-2xl font-semibold text-white text-center mb-6">
                            {category.title}
                          </h3>
                        </div>
                        <div className="flex flex-wrap justify-center gap-x-3 lg:gap-x-4 gap-y-1 lg:gap-y-2">
                          {category.sponsors.map((sponsor) => (
                            <a
                              key={sponsor.id}
                              href={sponsor.url || undefined}
                              target={sponsor.url ? "_blank" : undefined}
                              rel={sponsor.url ? "noopener noreferrer" : undefined}
                              className={cn(
                                "flex items-center justify-center aspect-[4/3] overflow-hidden bg-purple-dark/50 rounded-lg hover:bg-purple-dark/70 transition-colors",
                                category.order === 1
                                  ? "p-4 lg:p-6 min-w-[108px] lg:min-w-[128px]"
                                  : "p-4 lg:p-5 min-w-[100px]",
                                category.order === 1 && category.sponsors.length === 1
                                  ? "w-[min(360px,88vw)] lg:w-[min(440px,85vw)]"
                                  : category.order === 1
                                    ? "w-[calc(50%-0.375rem)] sm:w-[calc(33.33%-0.5rem)] lg:w-[calc((100%-4rem)/5)]"
                                    : category.sponsors.length === 1
                                      ? "w-[min(320px,85vw)]"
                                      : "w-[calc(50%-0.375rem)] sm:w-[calc(33.33%-0.5rem)] lg:w-[calc((100%-4rem)/5)]"
                              )}
                            >
                              <img
                                src={sponsor.localImage || sponsor.image}
                                alt={locale === "en" && sponsor.name_en ? sponsor.name_en : sponsor.name}
                                className="object-contain max-w-full max-h-full"
                                style={{
                                  width: sponsor.width ? `${sponsor.width}%` : "100%",
                                  height: "auto",
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
                )}
              </div>
            </section>
          )}
        </>
      )}

      {/* FAQ section */}
      <FAQ />

      {/* Footer */}
      <Footer />
    </div>
  );
}

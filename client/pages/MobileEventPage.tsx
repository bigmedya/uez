import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import * as Separator from "@radix-ui/react-separator";
import * as Tooltip from "@radix-ui/react-tooltip";
import {
  Ticket,
  Mic,
  CalendarDays,
  GraduationCap,
  MapPin,
  LayoutGrid,
  Handshake,
  HelpCircle,
  Mail,
  Navigation,
  Clock,
  ChevronDown,
  UserSquare,
  FileDown,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMobilePage } from "@/hooks/useMobilePage";
import { useAbout, type AboutData } from "@/hooks/useAbout";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useContact } from "@/hooks/useContact";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useActiveFaq } from "@/hooks/useFaq";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { QuickAction } from "@/hooks/useMobilePage.types";
import { cleanHtmlToText } from "@/utils/htmlUtils";
import { downloadProgramPdf2026 } from "@/utils/programPdfExport";
import { ProgramNoteBlock } from "@/components/ProgramNoteBlock";
import { getProgramPersonSubtitle } from "@/utils/programPersonDisplay";
import {
  enrichModeratorsWithSpeakerCatalog,
  type SpeakerCatalogEntry,
  type ProgramModeratorFields,
} from "@/utils/enrichProgramModerators";
import { oneSignalService } from "@/lib/onesignal";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LiveStreamButtons from "@/components/LiveStreamButtons";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

/** API'den gelen Hakkımızda sections'ı locale'e göre tek metin yapar */
function getFullAboutTextFromApi(data: AboutData | undefined, locale: "tr" | "en"): string {
  if (!data?.sections?.length) return "";
  const isEn = locale === "en";
  return data.sections
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((s) => {
      if (s.type === "text") return (isEn ? s.content_en ?? s.content : s.content) ?? "";
      if (s.type === "text-block" || s.type === "image-text") {
        const paras = isEn ? s.paragraphs_en ?? s.paragraphs : s.paragraphs;
        return paras?.join("\n\n") ?? "";
      }
      return "";
    })
    .filter(Boolean)
    .join("\n\n");
}

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Mic,
  CalendarDays,
  GraduationCap,
  MapPin,
  LayoutGrid,
  Handshake,
  HelpCircle,
  Ticket,
  Mail,
  Navigation,
  Clock,
};

function IconButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-white/80 shadow-sm backdrop-blur",
        "active:scale-[0.98] transition",
        props.className
      )}
    />
  );
}

function Card(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn(
        "rounded-2xl border border-black/10 bg-white/80 shadow-sm backdrop-blur",
        props.className
      )}
    />
  );
}

function PrimaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { disabled, className, ...rest } = props;
  return (
    <button
      {...rest}
      disabled={disabled}
      className={cn(
        "inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold",
        "bg-coral text-white shadow-sm active:scale-[0.99] transition hover:bg-coral-pink",
        disabled && "cursor-not-allowed opacity-50 pointer-events-none hover:bg-coral",
        className
      )}
    />
  );
}

const MOBILE_YEAR = "2026";

/** Index.tsx program satırı ile aynı: yuvarlak foto (veya ikon) + isim + şirket/unvan (gray-text) */
function ProgramSchedulePersonRow({
  person,
  locale,
}: {
  person: ProgramModeratorFields & { id?: number };
  locale: "tr" | "en";
}) {
  const sub = getProgramPersonSubtitle(person, locale);
  const clean = (s: string | undefined) =>
    s ? String(s).replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim() : "";
  const photoUrl = person.photo?.trim();
  const hasPhoto = Boolean(photoUrl);
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div
        className={cn(
          "relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full",
          hasPhoto ? "bg-gradient-to-br from-purple-primary/20 to-orange-primary/20" : ""
        )}
      >
        {hasPhoto ? (
          <img src={photoUrl} alt="" className="relative z-10 h-full w-full object-cover" loading="lazy" />
        ) : null}
        <div
          className={cn(
            "absolute inset-0 z-20 flex items-center justify-center overflow-hidden",
            hasPhoto ? "hidden" : "flex"
          )}
        >
          <UserSquare
            className="min-h-[140%] min-w-[140%] text-purple-primary fill-purple-primary/30"
            strokeWidth={0}
          />
        </div>
      </div>
      <div className="min-w-0 flex-1 space-y-0.5 text-left">
        <p className="text-base font-bold text-black break-words">{clean(person.name)}</p>
        {sub.line1 ? (
          <p className="text-xs text-gray-text break-words leading-relaxed">{clean(sub.line1)}</p>
        ) : null}
        {sub.line2 ? (
          <p className="text-xs text-gray-text break-words leading-relaxed">{clean(sub.line2)}</p>
        ) : null}
      </div>
    </div>
  );
}

/** Program: 2026 API'den; ana sayfa program akışı ile aynı sıra (not → moderatör → konuşmacı); PDF ile uyumlu */
function ProgramContent({ locale }: { locale: "tr" | "en" }) {
  const { t } = useTranslation();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["program", MOBILE_YEAR, locale],
    queryFn: () => fetch(`/api/program?year=${MOBILE_YEAR}&locale=${locale}`).then((r) => r.json()),
    staleTime: 1000 * 60 * 5,
  });
  const { data: speakersData } = useQuery({
    queryKey: ["speakers", MOBILE_YEAR, locale],
    queryFn: () => fetch(`/api/speakers?year=${MOBILE_YEAR}&locale=${locale}`).then((r) => r.json()),
    staleTime: 1000 * 60 * 5,
  });
  const speakersList = Array.isArray(speakersData) ? speakersData : (speakersData?.speakers ?? []);

  const speakerCatalog = useMemo<SpeakerCatalogEntry[]>(
    () =>
      (
        speakersList as Array<{
          id: number;
          name: string;
          title?: string;
          titleEn?: string;
          photo?: string;
          image?: string;
          company?: string;
          companyEn?: string;
          position?: string;
          positionEn?: string;
        }>
      ).map((s) => ({
        id: s.id,
        name: s.name,
        title: s.title,
        titleEn: s.titleEn,
        photo: s.photo ?? s.image,
        company: s.company,
        companyEn: s.companyEn,
        position: s.position,
        positionEn: s.positionEn,
      })),
    [speakersList]
  );

  const days = (data?.days || [])
    .slice()
    .sort(
      (a: { order?: number; id: number }, b: { order?: number; id: number }) =>
        (a.order ?? a.id) - (b.order ?? b.id)
    );
  if (isLoading) return <p className="text-sm text-black/50 py-2">{t("mobilePage.loading")}</p>;
  if (!days.length) return <p className="text-sm text-black/60 py-2">{t("mobilePage.detailsComingSoon")}</p>;

  const handleProgramPdf = async () => {
    if (!days.length) return;
    setIsGeneratingPdf(true);
    try {
      await downloadProgramPdf2026({
        days,
        speakers: speakersList,
        locale,
      });
    } catch (err) {
      console.error("Mobile /m program PDF error:", err);
      alert(t("program.pdfError"));
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  type ResolvedScheduleSpeaker = {
    id: number;
    name: string;
    title?: string;
    titleEn?: string;
    company?: string;
    companyEn?: string;
    position?: string;
    positionEn?: string;
    photo?: string;
  };

  type ScheduleItemType = {
    id: number;
    order?: number;
    time: string;
    title: string;
    note?: string;
    note_image?: string;
    speakerIds?: number[];
    speakerId?: number;
    speakers?: number[] | ResolvedScheduleSpeaker[];
    speakerNames?: string[];
    moderatorIds?: number[];
    moderators?: ProgramModeratorFields[];
    moderator?: string;
    moderatorTitle?: string;
  };

  const cleanProgramLine = (text: string | undefined) =>
    text ? String(text).replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim() : "";

  /** API'deki çözümlü konuşmacı bazen eksik alanlı; Index'teki gibi /api/speakers kaydı ile tamamla */
  const mergeResolvedSpeakerWithCatalog = (s: ResolvedScheduleSpeaker): ResolvedScheduleSpeaker => {
    const cat = speakersList.find((x: { id: number }) => x.id === s.id) as
      | {
          id: number;
          name: string;
          title?: string;
          titleEn?: string;
          company?: string;
          companyEn?: string;
          position?: string;
          positionEn?: string;
          photo?: string;
          image?: string;
        }
      | undefined;
    if (!cat) return s;
    return {
      ...s,
      name: s.name?.trim() || cat.name,
      title: s.title?.trim() || cat.title,
      titleEn: s.titleEn?.trim() || cat.titleEn,
      company: s.company?.trim() || cat.company,
      companyEn: s.companyEn?.trim() || cat.companyEn,
      position: s.position?.trim() || cat.position,
      positionEn: s.positionEn?.trim() || cat.positionEn,
      photo: s.photo?.trim() || cat.photo || cat.image,
    };
  };

  const resolveItemSpeakers = (item: ScheduleItemType): ResolvedScheduleSpeaker[] => {
    const raw = item.speakers;
    let base: ResolvedScheduleSpeaker[] = [];
    if (Array.isArray(raw) && raw.length > 0) {
      const first = raw[0] as unknown;
      if (typeof first === "object" && first !== null && "name" in (first as object)) {
        base = raw as ResolvedScheduleSpeaker[];
      }
    }
    if (base.length === 0) {
      const idsRaw = item.speakerIds?.length
        ? item.speakerIds
        : item.speakerId != null
          ? [item.speakerId]
          : Array.isArray(raw) && raw.length && typeof raw[0] === "number"
            ? raw
            : [];
      const ids = idsRaw
        .map((id) => (typeof id === "number" ? id : Number(id)))
        .filter((n) => !Number.isNaN(n));
      ids.forEach((id, idx) => {
        const cat = speakersList.find((s: { id: number }) => s.id === id) as
          | (ResolvedScheduleSpeaker & { id: number; name: string; photo?: string; image?: string })
          | undefined;
        if (cat?.name) {
          base.push({
            id: cat.id,
            name: cat.name,
            title: cat.title,
            titleEn: cat.titleEn,
            company: cat.company,
            companyEn: cat.companyEn,
            position: cat.position,
            positionEn: cat.positionEn,
            photo: cat.photo ?? cat.image,
          });
          return;
        }
        const name = item.speakerNames?.[idx]?.trim();
        if (name) base.push({ id, name });
      });
    }
    return base.map(mergeResolvedSpeakerWithCatalog);
  };

  return (
    <div className="space-y-5 py-2">
      <div className="flex justify-center">
        <button
          type="button"
          onClick={handleProgramPdf}
          disabled={isGeneratingPdf}
          className="inline-flex items-center gap-1.5 rounded-xl bg-purple-primary px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-purple-accent disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {isGeneratingPdf ? (
            <>
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              {t("program.pdfGenerating")}
            </>
          ) : (
            <>
              <FileDown className="h-4 w-4 shrink-0" />
              {t("program.pdfDownload")}
            </>
          )}
        </button>
      </div>
      {days.map((day: { id: number; title: string; scheduleItems?: ScheduleItemType[] }) => (
        <div key={day.id}>
          <div className="py-2 text-center border-b border-black/20 pb-2 mb-2">
            <span className="font-semibold text-black/90 text-sm tracking-wide">{day.title}</span>
          </div>
          <div className="space-y-4 text-left">
            {(day.scheduleItems || [])
              .slice()
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
              .map((item: ScheduleItemType, i: number) => {
                const itemSpeakers = resolveItemSpeakers(item);
                const moderatorList = enrichModeratorsWithSpeakerCatalog(
                  item.moderatorIds,
                  item.moderators,
                  item.moderator,
                  item.moderatorTitle,
                  speakerCatalog
                );
                const hasNoteBlock = Boolean(item.note?.trim() || item.note_image?.trim());
                const titleText = cleanProgramLine(item.title);
                return (
                  <div key={item.id ?? i} className="flex gap-3">
                    <div className="flex w-4 shrink-0 justify-center pt-2.5">
                      <div
                        className="h-3 w-3 shrink-0 rounded-full bg-purple-primary shadow-sm ring-2 ring-white"
                        aria-hidden
                      />
                    </div>
                    <div
                      className={cn(
                        "min-w-0 flex-1 rounded-2xl px-4 py-3.5 space-y-3 shadow-sm",
                        i % 2 === 0 ? "bg-gray-medium" : "bg-gray-dark"
                      )}
                    >
                      <div className="flex flex-wrap items-center gap-2 border-b border-black/[0.08] pb-2.5">
                        <span className="shrink-0 text-lg font-semibold leading-none text-black tabular-nums">
                          {cleanProgramLine(item.time)}
                        </span>
                        {titleText ? (
                          <span className="inline-flex max-w-[calc(100%-4.5rem)] items-center rounded-full bg-purple-primary px-3 py-1.5 text-center text-xs font-bold uppercase leading-snug tracking-wide text-white sm:text-[13px] sm:leading-tight">
                            {titleText}
                          </span>
                        ) : null}
                      </div>
                      {hasNoteBlock && (
                        <div className="pt-2 text-left">
                          <ProgramNoteBlock
                            text={item.note}
                            imageUrl={item.note_image}
                            compactImage
                            className="text-left text-gray-600"
                            textClassName="text-[11px] leading-snug text-black/65 break-words [&_b]:font-bold"
                          />
                        </div>
                      )}
                      {moderatorList.length > 0 && (
                        <div className="space-y-2 pt-0.5">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-purple-primary">
                            {t("program.moderators")}
                          </p>
                          <div className="flex flex-col gap-3">
                            {moderatorList.map((mod, mi) => (
                              <ProgramSchedulePersonRow key={`m-${item.id}-${mi}`} person={mod} locale={locale} />
                            ))}
                          </div>
                        </div>
                      )}
                      {itemSpeakers.length > 0 && (
                        <div className="space-y-2 pt-0.5">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-purple-primary">
                            {itemSpeakers.length === 1 ? t("program.speaker") : t("program.speakers")}
                          </p>
                          <div className="flex flex-col gap-3">
                            {itemSpeakers.map((speaker) => (
                              <ProgramSchedulePersonRow
                                key={speaker.id}
                                person={speaker}
                                locale={locale}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}

type SpeakerItem = {
  id: number;
  name: string;
  title?: string;
  titleEn?: string;
  company?: string;
  companyEn?: string;
  position?: string;
  positionEn?: string;
  photo?: string;
  image?: string;
  pinnedYears?: string[];
  bio?: string;
  biography?: string;
  order?: number;
};

/** Konuşmacılar: 2026 API'den; hepsi gelir, alfabetik; pinned önce ortalı. Webde yan yana 4 sütun. Tıklanınca hakkında modalı. */
function SpeakersContent({ locale }: { locale: "tr" | "en" }) {
  const { t } = useTranslation();
  const [selectedSpeaker, setSelectedSpeaker] = useState<SpeakerItem | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["speakers", MOBILE_YEAR, locale],
    queryFn: () => fetch(`/api/speakers?year=${MOBILE_YEAR}&locale=${locale}`).then((r) => r.json()),
    staleTime: 1000 * 60 * 5,
  });
  const rawList: SpeakerItem[] = Array.isArray(data) ? data : (data?.speakers ?? []);
  if (isLoading) return <p className="text-sm text-black/50 py-2">{t("mobilePage.loading")}</p>;
  if (!rawList.length) return <p className="text-sm text-black/60 py-2">{t("mobilePage.detailsComingSoon")}</p>;

  const byName = (a: SpeakerItem, b: SpeakerItem) =>
    (a.name || "").trim().localeCompare((b.name || "").trim(), locale === "tr" ? "tr-TR" : "en-US", { sensitivity: "accent" });
  const pinnedYears = (s: SpeakerItem) => (Array.isArray(s.pinnedYears) ? s.pinnedYears : []) as string[];
  const pinned = rawList.filter((s) => pinnedYears(s).includes(MOBILE_YEAR)).slice().sort((a, b) => {
    // For pinned speakers, sort by order field first, then by name
    const aOrder = a.order || 0;
    const bOrder = b.order || 0;
    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }
    return byName(a, b);
  });
  const unpinned = rawList.filter((s) => !pinnedYears(s).includes(MOBILE_YEAR)).slice().sort(byName);

  const card = (s: SpeakerItem, wrapperClass = "", isPinned = false) => (
    <button
      type="button"
      key={s.id}
      onClick={() => setSelectedSpeaker(s)}
      className={`rounded-xl border bg-white/60 p-2 flex flex-col items-center text-center min-w-0 cursor-pointer ${isPinned ? "border-2 border-purple-primary" : "border border-black/10"} ${wrapperClass}`}
    >
      <div className="aspect-square w-full rounded-lg overflow-hidden bg-black/5 mb-1.5 shrink-0">
        <img src={s.photo || s.image || ""} alt={s.name} className="w-full h-full object-cover" />
      </div>
      <div className="w-full min-w-0 space-y-1 text-center">
        <div className="px-2 py-1 rounded-tl-lg bg-gradient-purple max-w-full min-w-0">
          <span className="text-white font-semibold text-xs leading-tight break-words">{s.name}</span>
        </div>
        {(() => {
          const sub = getProgramPersonSubtitle(s, locale);
          if (!sub.line1) return null;
          return (
            <div className="px-2 py-1 rounded-br-lg bg-gradient-orange max-w-full min-w-0 w-full flex flex-col items-center justify-center gap-0.5 min-h-[2.25rem]">
              <span className="text-white text-[10px] font-medium leading-tight break-words text-center w-full">
                {sub.line1}
              </span>
              {sub.line2 && (
                <span className="text-white text-[10px] font-medium leading-tight break-words text-center w-full">
                  {sub.line2}
                </span>
              )}
            </div>
          );
        })()}
      </div>
    </button>
  );

  /* Mobil 2 sütun, web (md+) yan yana 4 sütun; pinned satırı ortalı, pinli kart çerçeveli */
  const gridClass = "grid grid-cols-2 md:grid-cols-4 gap-3";
  const pinnedCardWidth = "w-[calc(50%-6px)] md:w-[calc(25%-9px)]";

  return (
    <div className="space-y-4 py-2">
      {pinned.length > 0 && (
        <div className="flex flex-wrap justify-center gap-3">
          {pinned.map((s) => card(s, pinnedCardWidth, true))}
        </div>
      )}
      {unpinned.length > 0 && (
        <div className={gridClass}>
          {unpinned.map((s) => card(s))}
        </div>
      )}

      <Dialog open={!!selectedSpeaker} onOpenChange={(open) => !open && setSelectedSpeaker(null)}>
        {selectedSpeaker && (
          <DialogContent className="max-w-md w-[95%] max-h-[90vh] overflow-y-auto rounded-2xl border border-black/10 p-0 [&>button]:hidden">
            <div className="p-4 sm:p-6">
              <button
                type="button"
                onClick={() => setSelectedSpeaker(null)}
                className="absolute right-3 top-3 rounded-full bg-white/80 hover:bg-white p-1.5 transition-colors shadow border border-black/10"
                aria-label={t("common.close")}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
              <div className="flex flex-col items-center pt-2">
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-xl overflow-hidden flex items-center justify-center relative bg-black/5 shrink-0 mb-4">
                  {(selectedSpeaker.photo || selectedSpeaker.image) ? (
                    <img
                      src={selectedSpeaker.photo || selectedSpeaker.image || ""}
                      alt={selectedSpeaker.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserSquare className="w-full h-full min-w-[140%] min-h-[140%] text-coral fill-coral/20" strokeWidth={0} />
                  )}
                </div>
                <div className="w-full flex flex-col items-center gap-2 text-center mb-4">
                  <div className="w-full max-w-full px-3 py-2 rounded-tl-xl rounded-tr-xl bg-gradient-purple">
                    <h3 className="text-white text-base sm:text-lg font-semibold break-words">{selectedSpeaker.name}</h3>
                  </div>
                  {(() => {
                    const sub = getProgramPersonSubtitle(selectedSpeaker, locale);
                    if (!sub.line1) return null;
                    return (
                      <div className="w-full max-w-full px-3 py-2 rounded-bl-xl rounded-br-xl bg-gradient-orange flex flex-col items-center gap-0.5">
                        <p className="text-white text-sm font-medium break-words text-center w-full">{sub.line1}</p>
                        {sub.line2 && (
                          <p className="text-white text-sm font-medium break-words text-center w-full">{sub.line2}</p>
                        )}
                      </div>
                    );
                  })()}
                </div>
                {(selectedSpeaker.bio || selectedSpeaker.biography) && (
                  <div className="w-full text-left text-sm text-black/80 leading-relaxed whitespace-pre-line border-t border-black/10 pt-4">
                    {cleanHtmlToText(selectedSpeaker.bio || selectedSpeaker.biography || "")}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

type SponsorItem = {
  id: number;
  name: string;
  name_en?: string;
  image?: string;
  localImage?: string;
  url?: string;
  active?: boolean;
  width?: number;
};

function SponsorsContent({ locale }: { locale: "tr" | "en" }) {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ["sponsors", MOBILE_YEAR, locale],
    queryFn: () => fetch(`/api/sponsors?year=${MOBILE_YEAR}&locale=${locale}`).then((r) => r.json()),
    staleTime: 1000 * 60 * 5,
  });
  const categories = (data?.categories || []).filter(
    (c: { sponsors?: { active?: boolean }[] }) => (c.sponsors || []).filter((s) => s.active !== false).length > 0
  );

  const wrapperClass = "bg-purple-dark rounded-xl py-8 px-4 -mx-1";
  if (isLoading) {
    return (
      <div className={wrapperClass}>
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-semibold text-white text-center mb-8 sm:mb-12 md:mb-14 lg:mb-16 leading-tight">
          {t("index.sponsors2026")}
        </h2>
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-purple-accent border-t-orange-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }
  if (!categories.length) {
    return (
      <div className={wrapperClass}>
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-semibold text-white text-center mb-8 sm:mb-12 md:mb-14 lg:mb-16 leading-tight">
          {t("index.sponsors2026")}
        </h2>
        <p className="text-sm text-white/70 py-2 text-center">{t("mobilePage.detailsComingSoon")}</p>
      </div>
    );
  }

  return (
    <div className={wrapperClass}>
      <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-semibold text-white text-center mb-8 sm:mb-12 md:mb-14 lg:mb-16 leading-tight">
        {t("index.sponsors2026")}
      </h2>
      <div className="space-y-10 lg:space-y-16">
        {categories.map((cat: { id: number; title: string; sponsors: SponsorItem[] }) => {
          const list = cat.sponsors.filter((s) => s.active !== false);
          const cardClass =
            list.length === 1
              ? "w-[min(320px,85vw)]"
              : "w-[calc(50%-0.375rem)] sm:w-[calc(33.33%-0.5rem)] lg:w-[calc((100%-4rem)/5)]";
          return (
            <div key={cat.id} className="space-y-8">
              <div className="border-t border-purple-accent pt-6">
                <h3 className="text-xl lg:text-2xl font-semibold text-white text-center mb-6">{cat.title}</h3>
              </div>
              <div className="flex flex-wrap justify-center gap-x-3 lg:gap-x-4 gap-y-1 lg:gap-y-2">
                {list.map((s) => (
                  <a
                    key={s.id}
                    href={s.url || undefined}
                    target={s.url ? "_blank" : undefined}
                    rel={s.url ? "noopener noreferrer" : undefined}
                    className={`flex items-center justify-center p-4 lg:p-5 min-w-[100px] aspect-[4/3] overflow-hidden bg-purple-dark/50 rounded-lg hover:bg-purple-dark/70 transition-colors ${cardClass}`}
                  >
                    <img
                      src={s.localImage || s.image || ""}
                      alt={locale === "en" && s.name_en ? s.name_en : s.name}
                      className="object-contain max-w-full max-h-full"
                      style={{
                        width: s.width ? `${s.width}%` : "100%",
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
          );
        })}
      </div>
    </div>
  );
}

function FAQContent() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith("en") ? "en" : "tr";
  const { items: list, isLoading } = useActiveFaq(locale);
  if (isLoading) return <p className="text-sm text-black/50 py-2">{t("mobilePage.faqLoading")}</p>;
  if (!list.length) return <p className="text-sm text-black/60 py-2">{t("mobilePage.faqNoQuestions")}</p>;
  return (
    <div className="space-y-3 py-2">
      {list.map((item: { id: number; question: string; answer: string }) => (
        <div
          key={item.id}
          className="rounded-xl border-l-4 border-coral bg-white/80 shadow-sm overflow-hidden"
        >
          <div className="px-3 pt-3 pb-1">
            <div className="font-semibold text-black/90 text-sm leading-snug">{item.question}</div>
          </div>
          <div className="px-3 pb-3 pt-1.5 text-[12px] text-black/70 leading-relaxed whitespace-pre-line border-t border-black/5 mt-2">
            {item.answer}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Kroki: iletişim sayfasındaki harita + konuma git linki */
function MapContent({
  mapSection,
  locationLink,
}: {
  mapSection?: { embedUrl?: string; image?: string; venueName?: string; venueDetails?: string };
  locationLink?: string;
}) {
  const { t } = useTranslation();
  const konumaGit = locationLink?.trim();
  const linkButton = konumaGit ? (
    <a
      href={konumaGit}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center gap-2 w-full mt-3 py-2.5 rounded-xl bg-coral text-white text-sm font-semibold hover:bg-coral-pink transition-colors"
    >
      <MapPin className="h-4 w-4 shrink-0" />
      {t("mobilePage.goToLocation")}
    </a>
  ) : null;

  if (!mapSection) return <p className="text-sm text-black/60 py-2">{t("mobilePage.mapLoadError")}</p>;

  const infoBlock = (
    <div className="py-2 md:py-4 md:flex md:flex-col md:min-h-[220px] md:justify-center md:items-center md:text-center">
      <div className="md:w-full md:flex md:flex-col md:items-center md:gap-3">
        {mapSection.venueName && (
          <p className="text-sm font-medium text-black/90">{mapSection.venueName}</p>
        )}
        {mapSection.venueDetails && (
          <p className="text-xs text-black/60 mt-0.5 md:mt-0">{mapSection.venueDetails}</p>
        )}
        {linkButton && <div className="mt-3 md:mt-0 md:w-full md:max-w-xs">{linkButton}</div>}
      </div>
    </div>
  );

  if (mapSection.embedUrl) {
    return (
      <div className="py-2 -mx-1 flex flex-col md:flex-row md:gap-4 md:items-stretch">
        <div className="w-full md:w-2/3 shrink-0 aspect-video md:aspect-auto md:min-h-[220px] rounded-xl overflow-hidden border border-black/10">
          <iframe
            src={mapSection.embedUrl}
            title={t("mobilePage.mapTitle")}
            className="w-full h-full min-h-[220px]"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
        <div className="w-full md:w-1/3 mt-2 md:mt-0 md:flex md:items-center md:justify-center">{infoBlock}</div>
      </div>
    );
  }
  if (mapSection.image) {
    return (
      <div className="py-2 -mx-1 flex flex-col md:flex-row md:gap-4 md:items-stretch">
        <div className="w-full md:w-2/3 shrink-0 rounded-xl overflow-hidden border border-black/10">
          <img
            src={mapSection.image}
            alt={mapSection.venueName || t("mobilePage.mapVenueFallback")}
            className="w-full h-full object-cover max-h-48 md:max-h-none md:min-h-[220px]"
          />
        </div>
        <div className="w-full md:w-1/3 mt-2 md:mt-0 md:flex md:items-center md:justify-center">{infoBlock}</div>
      </div>
    );
  }
  return (
    <div className="py-2 text-sm">
      <p className="font-medium text-black/90">{mapSection.venueName || t("mobilePage.mapVenueFallback")}</p>
      {mapSection.venueDetails && <p className="text-black/60 mt-1">{mapSection.venueDetails}</p>}
      {linkButton}
    </div>
  );
}

/** Kısayol açıldığında gösterilen içerik: Program/Konuşmacılar/Sponsorlar API'den locale ile dilde, SSS locale ile, kroki iletişim */
function ShortcutExpandContent({
  action,
  venueName,
  venueDetails,
  mapSection,
  locationLink,
  locale,
}: {
  action: QuickAction;
  venueName: string;
  venueDetails: string;
  mapSection?: { embedUrl?: string; image?: string; venueName?: string; venueDetails?: string };
  locationLink?: string;
  locale: "tr" | "en";
}) {
  const { t } = useTranslation();
  const key = action.key;
  const description = (action.description || "").trim();

  if (key === "program") return <ProgramContent locale={locale} />;
  if (key === "speakers") return <SpeakersContent locale={locale} />;
  if (key === "sponsors") return <SponsorsContent locale={locale} />;
  if (key === "faq") return <FAQContent />;
  if (key === "map") return <MapContent mapSection={mapSection} locationLink={locationLink} />;

  if (description) {
    return (
      <div className="py-2 text-sm text-black/80 whitespace-pre-line">{description}</div>
    );
  }

  if (key === "howto") {
    return (
      <div className="py-2 text-[10px] sm:text-xs leading-relaxed max-w-full">
        <p className="font-semibold text-black/90 tracking-tight">{venueName}</p>
        {venueDetails && (
          <p className="text-black/75 mt-1.5 leading-relaxed break-words">{venueDetails}</p>
        )}
      </div>
    );
  }

  return <p className="py-2 text-sm text-black/60">{t("mobilePage.detailsComingSoon")}</p>;
}

export default function MobileEventPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith("en") ? "en" : "tr";
  const { data: mobilePage, isLoading } = useMobilePage(locale);
  const { settings } = useSiteSettings();
  const { mapSection, contactCards } = useContact(locale);
  const { data: aboutData } = useAbout(locale);

  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [aboutExpanded, setAboutExpanded] = useState(false);

  const locationCard = contactCards.find((card) => card.icon === "location");
  const emailCard = contactCards.find((card) => card.icon === "email");

  // OneSignal bildirim iznini /m sayfasında tetikle 
  useEffect(() => {
    if (isLoading) return;
    const timer = setTimeout(async () => {
      try {
        const initialized = await oneSignalService.init();
        if (!initialized) return;
        const permission = await oneSignalService.getNotificationPermission();
        if (permission === "default") {
          await oneSignalService.requestNotificationPermission();
        }
      } catch {
        // OneSignal izin akışı sessizce atlanır
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [isLoading]);

  useEffect(() => {
    if (!expandedKey) return;
    const id = `m-shortcut-${expandedKey}`;
    const t = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    return () => clearTimeout(t);
  }, [expandedKey]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f6f7]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-coral border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-black/60">{t("mobilePage.loading")}</p>
        </div>
      </div>
    );
  }

  const eventTitle = "UEZ 2026";
  const eventDate = mobilePage?.eventDate || "";
  const eventTime = mobilePage?.eventTime || "";
  const venueName = mobilePage?.venueName || mapSection?.venueName || locationCard?.title || t("mobilePage.venueFallback");
  const venueDetails = mobilePage?.venueDetails || mapSection?.venueDetails || locationCard?.lines?.join(", ") || "";
  const email = emailCard?.lines?.[0] || "";
  const quickActions = (mobilePage?.quickActions || []).filter(a => a.active).sort((a, b) => a.order - b.order);
  const socialMedia = (mobilePage?.socialMedia || []).filter(s => s.active && s.url);

  return (
    <div className="min-h-screen">
      <div className="relative bg-purple-dark">
        <Header />
      </div>

      <Tooltip.Provider delayDuration={150}>
        <div className="bg-[#f6f6f7]">
          {settings.liveButtonActive && (
            <div className="bg-purple-dark md:hidden">
              <div className="mx-auto w-full max-w-md md:max-w-4xl lg:max-w-6xl px-4 py-3">
                <LiveStreamButtons settings={settings} variant="header" />
              </div>
            </div>
          )}
          <main
            className={cn(
              "mx-auto w-full max-w-md md:max-w-4xl lg:max-w-6xl px-4 pb-6",
              settings.liveButtonActive ? "pt-2 md:pt-6" : "pt-6"
            )}
          >
          {/* Event Information Card */}
          <Card className="mt-4 p-5">
            <div className="flex items-start gap-4">
              {/* Logo */}
              <div className="flex-shrink-0">
                <div className="h-16 w-16 rounded-full bg-purple-dark flex items-center justify-center overflow-hidden">
                  <img
                    src={mobilePage?.logoUrl || settings?.logoUrl || "https://api.builder.io/api/v1/image/assets/TEMP/bc1aefcc49920778079094c811fbb255fd0b276e?width=295"}
                    alt="UEZ Logo"
                    className="h-12 w-12 object-contain"
                  />
                </div>
              </div>
              
              {/* Event Details */}
              <div className="flex-1 space-y-3">
                <div>
                  <h1 className="text-xl font-bold text-black/90 leading-tight">{eventTitle}</h1>
                </div>
                
                {eventDate && (
                  <div className="flex items-center gap-2 text-sm text-black/70">
                    <CalendarDays className="h-4 w-4 text-black/50" />
                    <span>{eventDate}</span>
                  </div>
                )}
                
                {eventTime && (
                  <div className="flex items-center gap-2 text-sm text-black/70">
                    <Clock className="h-4 w-4 text-black/50" />
                    <span>{eventTime}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-sm text-black/70">
                  <MapPin className="h-4 w-4 text-black/50" />
                  <span>{venueName}</span>
                </div>
              </div>
            </div>
          </Card>

          <div className="mt-4">
            <PrimaryButton type="button" disabled aria-disabled>
              <Ticket className="h-4 w-4" />
              {mobilePage?.ticketButtonText ? (
                mobilePage.ticketButtonText
              ) : (
                <>
                  <span className="md:hidden">{t("mobilePage.getTicket")}</span>
                  <span className="hidden md:inline">{t("mobilePage.shortcut.ticket")}</span>
                </>
              )}
            </PrimaryButton>
          </div>

          {/* Kısayollar: tıklanınca alta açılır; Program/Konuşmacılar/Sponsorlar 2026 API, diğerleri panel açıklaması */}
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-semibold text-black/80">Kısayollar</div>
            </div>
            <div className="space-y-2">
              {quickActions.map((a) => {
                const IconComponent = iconMap[a.icon] || HelpCircle;
                const isOpen = expandedKey === a.key;
                const isSponsors = a.key === "sponsors";
                const contentIsPurple = isSponsors && isOpen;
                return (
                  <Collapsible
                    key={a.id}
                    open={isOpen}
                    onOpenChange={(open) => setExpandedKey(open ? a.key : null)}
                  >
                    <div
                      id={`m-shortcut-${a.key}`}
                      className="scroll-mt-24 md:scroll-mt-28 rounded-2xl border border-black/10 bg-white/70 shadow-sm backdrop-blur-md overflow-hidden"
                    >
                      <CollapsibleTrigger className="flex w-full items-center gap-3 p-3 text-left active:scale-[0.99] transition">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-coral">
                          <IconComponent className="h-6 w-6" />
                        </div>
                        <span className="whitespace-pre-line text-[12px] font-semibold text-black/80 leading-tight flex-1">
                          {t(`mobilePage.shortcut.${a.key}`, { defaultValue: a.title })}
                        </span>
                        <ChevronDown
                          className={cn("h-5 w-5 shrink-0 text-black/40 transition-transform", isOpen && "rotate-180")}
                        />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className={cn("border-t pt-1", contentIsPurple ? "border-purple-primary/40 bg-purple-dark px-3 pb-3" : "border-black/10 bg-white/50 px-3 pb-3")}>
                          <ShortcutExpandContent
                            action={a}
                            venueName={venueName}
                            venueDetails={venueDetails}
                            mapSection={mapSection}
                            locationLink={mobilePage?.locationLink}
                            locale={locale}
                          />
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                );
              })}
            </div>
          </div>

          {/* Location card — mobilde üstte harita altta bilgi; webde solda harita (geniş) sağda bilgi */}
          <Card className="mt-5 p-0 overflow-hidden">
            <div className="flex flex-col md:flex-row md:min-h-[260px]">
              {/* Sol: harita / kroki kutusu — webde daha geniş (60%) */}
              <div className="w-full md:w-3/5 md:min-h-[260px] shrink-0">
                {mapSection?.embedUrl ? (
                  <div className="relative h-48 md:h-full md:min-h-[260px] w-full">
                    <iframe
                      src={mapSection.embedUrl}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="w-full h-full absolute inset-0"
                    />
                  </div>
                ) : mapSection?.image ? (
                  mobilePage?.locationLink ? (
                    <a
                      href={mobilePage.locationLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative h-48 md:h-full md:min-h-[260px] w-full block group"
                    >
                      <img
                        src={mapSection.image}
                        alt={venueName}
                        className="w-full h-full object-cover absolute inset-0"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-purple-dark/80 via-purple-primary/40 to-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-white/90 hover:bg-white px-4 py-2 rounded-lg font-semibold text-sm text-purple-dark flex items-center gap-2 shadow-lg">
                          <Navigation className="h-4 w-4" />
                          {t("mobilePage.openMap")}
                        </div>
                      </div>
                    </a>
                  ) : (
                    <div className="relative h-48 md:h-full md:min-h-[260px] w-full">
                      <img
                        src={mapSection.image}
                        alt={venueName}
                        className="w-full h-full object-cover absolute inset-0"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-purple-dark/80 via-purple-primary/40 to-transparent" />
                    </div>
                  )
                ) : (
                  <div className="relative h-48 md:h-full md:min-h-[260px] w-full bg-gradient-to-br from-purple-primary/20 to-purple-dark/40">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <MapPin className="h-12 w-12 text-purple-primary/50" />
                    </div>
                    <p className="absolute bottom-4 left-4 right-4 text-center text-xs text-black/40">
                      Harita yükleniyor...
                    </p>
                  </div>
                )}
              </div>
              {/* Sağ: bilgiler — webde daha dar (40%) */}
              <div className="p-4 md:w-2/5 md:flex md:flex-col md:justify-center">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <div className="text-sm font-bold text-black/85">{venueName}</div>
                    {venueDetails && (
                      <div className="mt-1 text-xs text-black/55 line-clamp-2">{venueDetails}</div>
                    )}
                  </div>
                </div>

                <Separator.Root className="my-3 h-px w-full bg-black/10" />

                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {email && (
                      <a href={`mailto:${email}`}>
                        <IconButton aria-label="E-posta" className="h-11 w-11">
                          <Mail className="h-5 w-5" />
                        </IconButton>
                      </a>
                    )}
                  </div>
                  {mobilePage?.locationLink && (
                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <a
                          href={mobilePage.locationLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-black/10 bg-white/80 shadow-sm"
                          aria-label="Yol tarifi"
                        >
                          <Navigation className="h-5 w-5" />
                        </a>
                      </Tooltip.Trigger>
                      <Tooltip.Portal>
                        <Tooltip.Content
                          sideOffset={8}
                          className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs shadow-sm"
                        >
                          Yol tarifi
                          <Tooltip.Arrow className="fill-white" />
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* About — API'den (Hakkımızda sections) hepsi çekilir; Daha fazla ile tamamı gösterilir */}
          <Card className="mt-5 p-4">
            <div className="text-sm font-bold text-black/85 mb-2">{t("mobilePage.about")}</div>

            <p
              className={cn(
                "text-sm leading-relaxed text-black/65 mb-3 whitespace-pre-line transition-[max-height] duration-300 ease-out",
                aboutExpanded ? "" : "line-clamp-5"
              )}
            >
              {getFullAboutTextFromApi(aboutData, locale) ||
                mobilePage?.aboutText ||
                "Uluslararası Ekonomi Zirvesi, ekonomi ve iş dünyasını bir araya getiren; ilham veren konuşmalar, paneller ve atölyelerle dolu bir etkinliktir…"}
            </p>

            <div className="text-right">
              <button
                type="button"
                onClick={() => setAboutExpanded((v) => !v)}
                className="text-xs font-semibold text-coral hover:text-coral-pink inline-block transition-colors"
              >
                {aboutExpanded ? t("mobilePage.readLess") : t("mobilePage.readMore")}
              </button>
            </div>
          </Card>

          {/* Sosyal Medya - mobil sayfa panelinden (Sosyal Medya); kart + yuvarlak gradient butonlar */}
          {socialMedia.length > 0 && (
            <Card className="mt-5 p-4">
              <div className="flex flex-row items-center justify-center gap-2 sm:gap-3 md:gap-4">
                {socialMedia.map((sm) => {
                  const btnClass = "w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex items-center justify-center rounded-full bg-gradient-to-br from-purple-primary/10 to-orange-primary/10 hover:from-purple-primary/20 hover:to-orange-primary/20 border-2 border-purple-primary/30 hover:border-purple-primary/50 transition-all transform hover:scale-110 flex-shrink-0";
                  const labels: Record<string, string> = { twitter: "X (Twitter)", youtube: "YouTube", instagram: "Instagram", linkedin: "LinkedIn", facebook: "Facebook" };
                  const svgs: Record<string, React.ReactNode> = {
                    twitter: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="currentColor" className="text-purple-primary" /></svg>,
                    youtube: <svg width="24" height="18" viewBox="0 0 31 22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.3379 0C15.4143 1.02231e-05 24.9469 0.00222208 27.3232 0.637695C28.6441 0.985761 29.6891 2.01106 30.0439 3.30664C30.691 5.65311 30.7136 10.5057 30.7139 10.5576C30.7139 10.5576 30.714 15.4698 30.0635 17.8096C29.7086 19.1051 28.6635 20.1295 27.3428 20.4775C24.9643 21.1136 15.4169 21.1162 15.3574 21.1162C15.3574 21.1162 5.75648 21.1157 3.37109 20.4775C2.05033 20.1295 1.00526 19.1051 0.650391 17.8096C-0.000168656 15.4504 0 10.5576 0 10.5576C1.79573e-05 10.5058 0.00343725 5.65351 0.630859 3.32617C0.98571 2.03059 2.03073 1.00529 3.35156 0.657227C5.73735 0.0191668 15.3379 0 15.3379 0ZM12.2832 15.083L20.248 10.5576L12.2832 6.0332V15.083Z" fill="currentColor" className="text-purple-primary" /></svg>,
                    instagram: <svg width="24" height="24" viewBox="0 0 37 37" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.07129 26.7118V10.1568C3.19146 9.58293 3.26357 8.99279 3.44263 8.43752C4.48275 5.21525 7.39159 3.0927 10.7974 3.08308C15.8848 3.06866 20.9721 3.06866 26.0595 3.08308C27.7054 3.08308 29.2191 3.54401 30.5482 4.52115C32.7113 6.11125 33.7784 8.26986 33.7808 10.9513C33.7857 15.9087 33.7845 20.8662 33.7773 25.8235C33.7841 26.333 33.7454 26.8419 33.6618 27.3445C33.1463 30.1822 31.5348 32.1623 28.871 33.2458C28.1879 33.5234 27.4289 33.6147 26.7044 33.7914H10.1496C9.9345 33.7536 9.71879 33.7175 9.50427 33.6766C6.68497 33.1448 4.71108 31.5488 3.6253 28.9046C3.34229 28.2122 3.25095 27.4437 3.07129 26.7118ZM24.8273 18.4349C24.8273 14.9223 21.9815 12.0678 18.4429 12.0348C14.944 12.0023 12.0304 14.9079 12.0273 18.4331C12.0273 21.945 14.8719 24.7995 18.4111 24.8338C21.9063 24.8668 24.8255 21.9564 24.8273 18.4349ZM26.7453 12.0276C27.2498 12.0275 27.7341 11.8286 28.0933 11.4739C28.4524 11.1193 28.6573 10.6375 28.6638 10.1328C28.6819 9.09014 27.7991 8.20015 26.7464 8.19834C26.2419 8.20131 25.7589 8.40243 25.4013 8.75834C25.0437 9.11424 24.8403 9.59644 24.835 10.1009C24.8321 10.3534 24.8795 10.6039 24.9742 10.8379C25.0691 11.0718 25.2094 11.2846 25.3871 11.4639C25.5649 11.6432 25.7765 11.7853 26.0096 11.8821C26.2427 11.9789 26.4928 12.0283 26.7453 12.0276Z" fill="currentColor" className="text-purple-primary" /></svg>,
                    linkedin: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20.447 20.452H16.893V14.883C16.893 13.555 16.866 11.846 15.041 11.846C13.188 11.846 12.905 13.291 12.905 14.785V20.452H9.351V9H12.765V10.561H12.811C13.288 9.661 14.448 8.711 16.181 8.711C19.782 8.711 20.448 11.081 20.448 14.166V20.452H20.447ZM5.337 7.433C4.193 7.433 3.274 6.507 3.274 5.367C3.274 4.224 4.194 3.302 5.337 3.302C6.477 3.302 7.401 4.224 7.401 5.367C7.401 6.507 6.476 7.433 5.337 7.433ZM7.119 20.452H3.555V9H7.119V20.452ZM22.225 0H1.771C0.792 0 0 0.774 0 1.729V22.271C0 23.227 0.792 24 1.771 24H22.222C23.2 24 24 23.227 24 22.271V1.729C24 0.774 23.2 0 22.222 0H22.225Z" fill="currentColor" className="text-purple-primary" /></svg>,
                    facebook: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.099 4.388 23.094 10.125 24V15.563H7.078V12.073H10.125V9.413C10.125 6.388 11.917 4.716 14.658 4.716C15.97 4.716 17.344 4.951 17.344 4.951V7.923H15.831C14.34 7.923 13.875 8.853 13.875 9.808V12.073H17.203L16.671 15.563H13.875V24C19.612 23.094 24 18.099 24 12.073Z" fill="currentColor" className="text-purple-primary" /></svg>,
                  };
                  return (
                    <a key={sm.platform} href={sm.url} target="_blank" rel="noopener noreferrer" className={btnClass} aria-label={labels[sm.platform] ?? sm.platform}>
                      {svgs[sm.platform] ?? svgs.linkedin}
                    </a>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Host Information Card */}
          {mobilePage?.hostName && (
            <Card className="mt-5 p-4">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  {mobilePage.hostLogo ? (
                    <img
                      src={mobilePage.hostLogo}
                      alt={mobilePage.hostName}
                      className="h-16 w-16 rounded-xl object-contain"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-xl bg-black flex items-center justify-center">
                      <span className="text-pink-500 font-bold text-xs">{mobilePage.hostName.substring(0, 6).toUpperCase()}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-xs text-black/50 mb-1">Ev sahibi</div>
                  <div className="text-sm font-bold text-black/85">{mobilePage.hostName}</div>
                </div>
              </div>
            </Card>
          )}

          </main>
        </div>
      </Tooltip.Provider>

      {/* Footer */}
      <Footer />
    </div>
  );
}

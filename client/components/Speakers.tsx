import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { cleanHtmlToText } from "@/utils/htmlUtils";
import { Loader2 } from "lucide-react";
import { usePreloadSpeakerImages } from "@/hooks/usePreloadSpeakerImages";

interface Speaker {
  id: number;
  name: string;
  title: string;
  titleEn?: string;
  company?: string;
  companyEn?: string;
  position?: string;
  positionEn?: string;
  image: string;
  biography: string;
}

function getSpeakerSubtitle(speaker: Speaker, locale: string): { line1: string; line2?: string } {
  const useEn = locale === "en";
  if (speaker.company && speaker.position) {
    const company = useEn ? (speaker.companyEn || speaker.company) : speaker.company;
    const position = useEn ? (speaker.positionEn || speaker.position) : speaker.position;
    return { line1: company, line2: position };
  }
  const title = useEn ? (speaker.titleEn || speaker.title) : speaker.title;
  return { line1: title || "" };
}

export default function Speakers() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "en" ? "en" : "tr";
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpeaker, setSelectedSpeaker] = useState<Speaker | null>(null);

  useEffect(() => {
    setLoading(true);
    const url = locale ? `/api/speakers?locale=${locale}` : "/api/speakers";
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setSpeakers(list.map((s: any) => ({
          id: s.id,
          name: s.name,
          title: s.title || "",
          titleEn: s.titleEn,
          company: s.company,
          companyEn: s.companyEn,
          position: s.position,
          positionEn: s.positionEn,
          image: s.image || s.photo || "",
          biography: s.bio || s.biography || "",
        })));
      })
      .catch(() => setSpeakers([]))
      .finally(() => setLoading(false));
  }, [locale]);

  usePreloadSpeakerImages(speakers.map((s) => ({ photo: s.image })));

  if (loading) {
    return (
      <section className="relative bg-white py-16 lg:py-24 overflow-hidden">
        <div className="container mx-auto px-8 lg:px-16 flex justify-center items-center min-h-[300px]">
          <Loader2 className="w-10 h-10 animate-spin text-purple-primary" />
        </div>
      </section>
    );
  }

  return (
    <section className="relative bg-white py-16 lg:py-24 overflow-hidden">
      <div className="container mx-auto px-8 lg:px-16 relative z-10">
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-semibold text-purple-dark text-center mb-8 sm:mb-12 md:mb-14 lg:mb-16 leading-tight">
          {t("speakers.title")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 lg:gap-12 mb-12">
          {speakers.length === 0 ? (
            <p className="col-span-full text-center text-gray-500 py-8">{t("speakers.noSpeakers", "Henüz konuşmacı eklenmedi.")}</p>
          ) : speakers.map((speaker) => (
            <div key={speaker.id} className="flex flex-col items-center group cursor-pointer" onClick={() => setSelectedSpeaker(speaker)}>
              <div className="relative mb-4">
                <div className="w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-lg overflow-hidden bg-gray-200 flex items-end">
                  <img src={speaker.image || "https://api.builder.io/api/v1/image/assets/TEMP/6f9dc6136c36c2ca690a661cfdfcff4dee974339?width=711"} alt={speaker.name} className="w-full h-full object-contain object-bottom group-hover:scale-110 transition-transform duration-300" />
                </div>
              </div>
              <div className="w-full max-w-sm flex flex-col items-center">
                <div className="flex justify-center mb-2 min-h-[3.5rem] sm:min-h-[4rem] flex items-center">
                  <div className="px-3 sm:px-4 py-2 sm:py-3 rounded-tl-xl bg-gradient-purple">
                    <h3 className="text-white text-base sm:text-lg md:text-xl font-semibold text-center whitespace-nowrap">{speaker.name}</h3>
                  </div>
                </div>
                <div className="flex justify-center flex-col items-center gap-1 w-full">
                  {(() => {
                    const sub = getSpeakerSubtitle(speaker, locale);
                    return (
                      <>
                        <div className="px-3 sm:px-4 py-2 sm:py-3 rounded-br-xl bg-gradient-orange">
                          <p className="text-white text-base sm:text-lg md:text-xl font-medium text-center whitespace-nowrap">{sub.line1}</p>
                        </div>
                        {sub.line2 && (
                          <div className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-br-xl bg-gradient-orange/90">
                            <p className="text-white text-base sm:text-lg md:text-xl font-medium text-center whitespace-nowrap">{sub.line2}</p>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Dialog open={!!selectedSpeaker} onOpenChange={(open) => !open && setSelectedSpeaker(null)}>
        {selectedSpeaker && (
          <DialogContent className="max-w-4xl w-[95%] sm:w-[90%] md:w-[85%] lg:w-[80%] max-h-[90vh] overflow-y-auto bg-white p-0 rounded-2xl border-0 shadow-2xl">
            <div className="relative bg-white rounded-2xl overflow-hidden">
              <div className="relative z-10 p-6 sm:p-8 md:p-10 lg:p-12">
                <button onClick={() => setSelectedSpeaker(null)} className="absolute right-4 top-4 sm:right-6 sm:top-6 z-20 rounded-full bg-white/80 hover:bg-white p-2 transition-colors shadow-lg" aria-label={t("speakers.close")}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18M6 6L18 18" stroke="#1F0034" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-gray-text mb-8 sm:mb-10 md:mb-12 text-center sm:text-left">{t("speakers.title")}</h2>
                <div className="flex flex-col items-center sm:items-start">
                  <div className="relative mb-6 sm:mb-8">
                    <div className="w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-full overflow-hidden bg-gray-200 shadow-lg">
                      <img src={selectedSpeaker.image} alt={selectedSpeaker.name} className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <div className="w-full max-w-md mb-3 sm:mb-4">
                    <div className="px-4 sm:px-6 py-3 sm:py-4 rounded-tl-xl bg-gradient-purple inline-block">
                      <h3 className="text-white text-lg sm:text-xl md:text-2xl font-semibold">{selectedSpeaker.name}</h3>
                    </div>
                  </div>
                  {(() => {
                    const sub = getSpeakerSubtitle(selectedSpeaker, locale);
                    return (
                      <div className="w-full max-w-md mb-6 sm:mb-8 space-y-2">
                        <div className="px-4 sm:px-6 py-3 sm:py-4 rounded-br-xl bg-gradient-orange inline-block">
                          <p className="text-white text-lg sm:text-xl md:text-2xl font-medium">{sub.line1}</p>
                        </div>
                        {sub.line2 && (
                          <div className="px-4 sm:px-6 py-2 sm:py-3 rounded-br-xl bg-gradient-orange/90 inline-block">
                            <p className="text-white text-lg sm:text-xl md:text-2xl font-medium">{sub.line2}</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  <div className="w-full max-w-3xl">
                    <div className="text-base sm:text-lg md:text-xl text-gray-text leading-relaxed whitespace-pre-line">
                      {cleanHtmlToText(selectedSpeaker.biography)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </section>
  );
}

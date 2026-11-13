import { useEffect } from "react";

/**
 * Konuşmacı resimlerini arka planda önceden yükleyerek tarayıcı cache'ine alır.
 * Sayfa açıldığında resimler daha hızlı görünür.
 */
export function usePreloadSpeakerImages(
  speakers: Array<{ photo?: string | null; image?: string | null }>
) {
  useEffect(() => {
    if (!speakers?.length) return;
    speakers.forEach((s) => {
      const url = (s.photo || s.image || "").trim();
      if (!url || url.startsWith("data:")) return;
      const img = new Image();
      img.src = url;
    });
  }, [speakers]);
}

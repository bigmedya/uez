import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useHomepage } from "@/hooks/useHomepage";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Link } from "react-router-dom";
import InfoBanner from "@/components/InfoBanner";
import LiveStreamButtons from "@/components/LiveStreamButtons";

// YouTube URL'ini embed formatına çevir (watch, kısa link, canlı /live/…)
function getYouTubeEmbedUrl(url: string): string | null {
  const trimmed = url.trim();
  const liveMatch = trimmed.match(/youtube\.com\/live\/([a-zA-Z0-9_-]{11})/);
  if (liveMatch) {
    return `https://www.youtube.com/embed/${liveMatch[1]}`;
  }
  const regExp =
    /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = trimmed.match(regExp);
  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}`;
  }
  return null;
}

/** Ana sayfa video URL’si yoksa, site ayarlarındaki canlı YouTube linklerini kullan */
function resolveHeroVideoUrl(
  homeVideo: string,
  liveTr: string,
  liveEn: string,
): string {
  const h = homeVideo?.trim() ?? "";
  if (h && (getYouTubeEmbedUrl(h) || isMp4Url(h))) return h;
  const tr = liveTr?.trim() ?? "";
  if (tr && getYouTubeEmbedUrl(tr)) return tr;
  const en = liveEn?.trim() ?? "";
  if (en && getYouTubeEmbedUrl(en)) return en;
  return h;
}

// URL'nin MP4 olup olmadığını kontrol et
function isMp4Url(url: string): boolean {
  return url.toLowerCase().endsWith('.mp4') || url.includes('.mp4?');
}

export default function Hero() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith("en") ? "en" : "tr";
  const { homepage } = useHomepage(locale);
  const { settings } = useSiteSettings();
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  // Default values while loading
  const hero = homepage?.hero || {
    dateText: "9 - 12 Nisan da",
    title: "BÜYÜK DÖNÜŞÜM:",
    subtitle: "Dayanıklı ve sürdürülebilir bir küresel sisteme geçişin pusulası",
    buttonText: "Keşfet",
    buttonLink: "/uez-2026",
    videoImage: "https://api.builder.io/api/v1/image/assets/TEMP/72290d79abf52f87a2347354794d9ee246900632?width=1925",
    videoUrl: "",
  };

  const effectiveVideoUrl = resolveHeroVideoUrl(
    hero.videoUrl,
    settings.liveButtonActive ? (settings.liveButtonUrl ?? "") : "",
    settings.liveButtonActive ? (settings.liveButtonUrl_en ?? "") : "",
  );
  const youtubeEmbed = effectiveVideoUrl
    ? getYouTubeEmbedUrl(effectiveVideoUrl)
    : null;
  const ytIdForPoster = youtubeEmbed?.match(/\/embed\/([^/?]+)/)?.[1];
  const defaultPoster =
    "https://api.builder.io/api/v1/image/assets/TEMP/72290d79abf52f87a2347354794d9ee246900632?width=1925";
  const videoPosterSrc =
    hero.videoImage?.trim() ||
    (ytIdForPoster
      ? `https://i.ytimg.com/vi/${ytIdForPoster}/hqdefault.jpg`
      : "") ||
    defaultPoster;
  const canPlayHeroVideo = Boolean(
    effectiveVideoUrl &&
      (youtubeEmbed || isMp4Url(effectiveVideoUrl)),
  );

  // Split title for styling (first word orange, rest white)
  const titleParts = hero.title.split(/\n|<br\s*\/?>/);

  return (
    <section className="relative overflow-hidden pb-6 sm:pb-8 lg:pb-0">

      {/* Content — içerik yüksekliği; min-h yok (dik ekranda konuşmacılar daha erken görünsün) */}
      <div className="relative z-10 container mx-auto px-8 lg:px-16">
        <div className="grid items-start gap-6 lg:grid-cols-[1.35fr_1fr] lg:gap-16">
          {/* Left content - daha geniş alan (grid 1.35fr ile) */}
          <div className="pt-6 sm:pt-10 lg:pt-28">
            <div className="space-y-3 sm:space-y-4 text-left [&_p]:m-0 [&_h1]:m-0">
              {hero.dateText && (
                <p className="text-2xl sm:text-2xl md:text-3xl lg:text-4xl text-white font-medium -mt-4 sm:-mt-6 first:mt-0">
                  {hero.dateText}
                </p>
              )}
              <h1 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl xl:text-6xl text-orange-primary">
                {titleParts.map((part, i) => (
                  <span key={i} className="block">
                    {part}
                  </span>
                ))}
              </h1>

              <p className="text-sm sm:text-xl md:text-2xl lg:text-2xl text-white font-medium -mt-4 sm:-mt-6 leading-snug">
                {(hero.subtitle ?? "")
                  .replace(/\/n/g, "\n")
                  .split(/\n/)
                  .map((line, i) => (
                    <span key={i} className="block">{line}</span>
                  ))}
              </p>
            </div>

            {/* Keşfet + Etkinlik Bilgisi: içerik genişliği, aynı uzunlukta zorunlu değil */}
            <div className="mt-3 flex w-full flex-col gap-1.5">
              <div className="flex w-full max-w-full flex-row flex-wrap items-center justify-start gap-1.5 sm:gap-3">
                <Link
                  to={hero.buttonLink}
                  className="inline-flex min-h-[40px] max-w-full shrink-0 items-center gap-1.5 rounded-2xl border border-coral-pink bg-gradient-primary px-3 py-2 text-sm font-medium leading-tight text-white transition-transform hover:scale-[1.02] sm:min-h-[48px] sm:gap-2 sm:rounded-lg sm:px-6 sm:py-3 sm:text-lg"
                >
                  <span className="min-w-0 truncate sm:whitespace-nowrap">{hero.buttonText}</span>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 27 27"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 shrink-0 opacity-95 sm:h-5 sm:w-5"
                  >
                    <path
                      d="M16.1553 6.63892L22.9509 13.4346L16.1553 20.2302"
                      stroke="white"
                      strokeWidth="1.67932"
                      strokeMiterlimit="10"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M3.91797 13.4346H22.76"
                      stroke="white"
                      strokeWidth="1.67932"
                      strokeMiterlimit="10"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
                <div className="shrink-0">
                  <InfoBanner inline className="gap-0" />
                </div>
              </div>

              {/* Mobil / tablet: canlı yayınlar — masaüstünde üst bardaki canlılar */}
              <LiveStreamButtons
                settings={settings}
                hideOnDesktop
                className="mt-3 sm:mt-4"
              />
            </div>
          </div>

          {/* Right content — lg altı: sol sütundaki canlı butonlarıyla aynı içerik genişliği (max-w-[520px] sadece masaüstü 2 sütunda); web: header ile video arasında nefes */}
          <div className="w-full min-w-0 space-y-6 lg:ml-auto lg:mr-0 lg:max-w-[520px] lg:pt-8 xl:pt-10">
            {/* Video/Image container */}
            <div className="relative rounded-[40px] border border-purple-accent overflow-hidden shadow-[0_4px_130px_0_rgba(44,0,73,1)] bg-gray-500 aspect-video w-full">
              {isVideoPlaying && canPlayHeroVideo ? (
                <>
                  {youtubeEmbed ? (
                    <iframe
                      src={
                        youtubeEmbed +
                        "?autoplay=1&rel=0&mute=0&playsinline=1"
                      }
                      className="absolute inset-0 h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      title={t("hero.playVideo")}
                    />
                  ) : isMp4Url(effectiveVideoUrl) ? (
                    <video
                      src={effectiveVideoUrl}
                      controls
                      autoPlay
                      className="h-full w-full object-contain"
                    >
                      {t("hero.videoNotSupported")}
                    </video>
                  ) : null}
                </>
              ) : (
                <>
                  <img
                    src={videoPosterSrc}
                    alt=""
                    className="absolute inset-0 h-full w-full bg-gray-500 object-cover object-center"
                  />

                  {/* Play button */}
                  {canPlayHeroVideo && (
                    <button
                      onClick={() => setIsVideoPlaying(true)}
                      className="absolute inset-0 flex items-center justify-center cursor-pointer group"
                      aria-label={t("hero.playVideo")}
                    >
                      <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 transition-colors">
                        <svg
                          width="90"
                          height="90"
                          viewBox="0 0 90 90"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M44.6698 82.1003C65.2802 82.1003 81.9881 65.3923 81.9881 44.782C81.9881 24.1716 65.2802 7.46368 44.6698 7.46368C24.0595 7.46368 7.35156 24.1716 7.35156 44.782C7.35156 65.3923 24.0595 82.1003 44.6698 82.1003Z"
                            stroke="white"
                            strokeWidth="1.67932"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M32.6162 45.6402V39.4081C32.6162 31.6459 38.102 28.4738 44.8193 32.3549L50.2304 35.4897L55.6416 38.6244C62.3589 42.5055 62.3589 48.8496 55.6416 52.7307L50.2304 55.8655L44.8193 59.0002C38.102 62.8813 32.6162 59.7092 32.6162 51.947V45.6402Z"
                            stroke="white"
                            strokeWidth="1.67932"
                            strokeMiterlimit="10"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Etkinlik sonu — statik çeviri; API beklenmez, skeleton yok */}
            <p
              className="px-2 text-center font-poppins text-base font-bold !text-white subpixel-antialiased tracking-wide sm:text-lg sm:tracking-wider md:text-xl"
              style={{ color: "#ffffff" }}
            >
              {t("hero.eventEnded")}
            </p>

            {/* Social Media */}
            <div className="pb-4 sm:pb-8">
              <div className="flex items-center justify-center gap-2 sm:gap-3 md:gap-4">
                {/* Twitter/X */}
                {settings.twitter && (
                  <a
                    href={settings.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 sm:w-10 sm:h-10 md:w-11 md:h-11 flex items-center justify-center rounded-full bg-gradient-to-br from-purple-primary/10 to-orange-primary/10 hover:from-purple-primary/20 hover:to-orange-primary/20 border-2 border-purple-primary/30 hover:border-purple-primary/50 transition-all transform hover:scale-110 flex-shrink-0 backdrop-blur-sm"
                    aria-label="X (Twitter)"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
                        fill="currentColor"
                        className="text-white"
                      />
                    </svg>
                  </a>
                )}

                {/* YouTube */}
                {settings.youtube && (
                  <a
                    href={settings.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 sm:w-10 sm:h-10 md:w-11 md:h-11 flex items-center justify-center rounded-full bg-gradient-to-br from-purple-primary/10 to-orange-primary/10 hover:from-purple-primary/20 hover:to-orange-primary/20 border-2 border-purple-primary/30 hover:border-purple-primary/50 transition-all transform hover:scale-110 flex-shrink-0 backdrop-blur-sm"
                    aria-label="YouTube"
                  >
                    <svg
                      width="20"
                      height="15"
                      viewBox="0 0 31 22"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M15.3379 0C15.4143 1.02231e-05 24.9469 0.00222208 27.3232 0.637695C28.6441 0.985761 29.6891 2.01106 30.0439 3.30664C30.691 5.65311 30.7136 10.5057 30.7139 10.5576C30.7139 10.5576 30.714 15.4698 30.0635 17.8096C29.7086 19.1051 28.6635 20.1295 27.3428 20.4775C24.9643 21.1136 15.4169 21.1162 15.3574 21.1162C15.3574 21.1162 5.75648 21.1157 3.37109 20.4775C2.05033 20.1295 1.00526 19.1051 0.650391 17.8096C-0.000168656 15.4504 0 10.5576 0 10.5576C1.79573e-05 10.5058 0.00343725 5.65351 0.630859 3.32617C0.98571 2.03059 2.03073 1.00529 3.35156 0.657227C5.73735 0.0191668 15.3379 0 15.3379 0ZM12.2832 15.083L20.248 10.5576L12.2832 6.0332V15.083Z"
                        fill="currentColor"
                        className="text-white"
                      />
                    </svg>
                  </a>
                )}

                {/* Instagram */}
                {settings.instagram && (
                  <a
                    href={settings.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 sm:w-10 sm:h-10 md:w-11 md:h-11 flex items-center justify-center rounded-full bg-gradient-to-br from-purple-primary/10 to-orange-primary/10 hover:from-purple-primary/20 hover:to-orange-primary/20 border-2 border-purple-primary/30 hover:border-purple-primary/50 transition-all transform hover:scale-110 flex-shrink-0 backdrop-blur-sm"
                    aria-label="Instagram"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 37 37"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M3.07129 26.7118V10.1568C3.19146 9.58293 3.26357 8.99279 3.44263 8.43752C4.48275 5.21525 7.39159 3.0927 10.7974 3.08308C15.8848 3.06866 20.9721 3.06866 26.0595 3.08308C27.7054 3.08308 29.2191 3.54401 30.5482 4.52115C32.7113 6.11125 33.7784 8.26986 33.7808 10.9513C33.7857 15.9087 33.7845 20.8662 33.7773 25.8235C33.7841 26.333 33.7454 26.8419 33.6618 27.3445C33.1463 30.1822 31.5348 32.1623 28.871 33.2458C28.1879 33.5234 27.4289 33.6147 26.7044 33.7914H10.1496C9.9345 33.7536 9.71879 33.7175 9.50427 33.6766C6.68497 33.1448 4.71108 31.5488 3.6253 28.9046C3.34229 28.2122 3.25095 27.4437 3.07129 26.7118ZM24.8273 18.4349C24.8273 14.9223 21.9815 12.0678 18.4429 12.0348C14.944 12.0023 12.0304 14.9079 12.0273 18.4331C12.0273 21.945 14.8719 24.7995 18.4111 24.8338C21.9063 24.8668 24.8255 21.9564 24.8273 18.4349ZM26.7453 12.0276C27.2498 12.0275 27.7341 11.8286 28.0933 11.4739C28.4524 11.1193 28.6573 10.6375 28.6638 10.1328C28.6819 9.09014 27.7991 8.20015 26.7464 8.19834C26.2419 8.20131 25.7589 8.40243 25.4013 8.75834C25.0437 9.11424 24.8403 9.59644 24.835 10.1009C24.8321 10.3534 24.8795 10.6039 24.9742 10.8379C25.0691 11.0718 25.2094 11.2846 25.3871 11.4639C25.5649 11.6432 25.7765 11.7853 26.0096 11.8821C26.2427 11.9789 26.4928 12.0283 26.7453 12.0276Z"
                        fill="currentColor"
                        className="text-white"
                      />
                    </svg>
                  </a>
                )}

                {/* LinkedIn */}
                {settings.linkedin && (
                  <a
                    href={settings.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 sm:w-10 sm:h-10 md:w-11 md:h-11 flex items-center justify-center rounded-full bg-gradient-to-br from-purple-primary/10 to-orange-primary/10 hover:from-purple-primary/20 hover:to-orange-primary/20 border-2 border-purple-primary/30 hover:border-purple-primary/50 transition-all transform hover:scale-110 flex-shrink-0 backdrop-blur-sm"
                    aria-label="LinkedIn"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M20.447 20.452H16.893V14.883C16.893 13.555 16.866 11.846 15.041 11.846C13.188 11.846 12.905 13.291 12.905 14.785V20.452H9.351V9H12.765V10.561H12.811C13.288 9.661 14.448 8.711 16.181 8.711C19.782 8.711 20.448 11.081 20.448 14.166V20.452H20.447ZM5.337 7.433C4.193 7.433 3.274 6.507 3.274 5.367C3.274 4.224 4.194 3.302 5.337 3.302C6.477 3.302 7.401 4.224 7.401 5.367C7.401 6.507 6.476 7.433 5.337 7.433ZM7.119 20.452H3.555V9H7.119V20.452ZM22.225 0H1.771C0.792 0 0 0.774 0 1.729V22.271C0 23.227 0.792 24 1.771 24H22.222C23.2 24 24 23.227 24 22.271V1.729C24 0.774 23.2 0 22.222 0H22.225Z"
                        fill="currentColor"
                        className="text-white"
                      />
                    </svg>
                  </a>
                )}

                {/* Facebook */}
                {settings.facebook && (
                  <a
                    href={settings.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 sm:w-10 sm:h-10 md:w-11 md:h-11 flex items-center justify-center rounded-full bg-gradient-to-br from-purple-primary/10 to-orange-primary/10 hover:from-purple-primary/20 hover:to-orange-primary/20 border-2 border-purple-primary/30 hover:border-purple-primary/50 transition-all transform hover:scale-110 flex-shrink-0 backdrop-blur-sm"
                    aria-label="Facebook"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.099 4.388 23.094 10.125 24V15.563H7.078V12.073H10.125V9.413C10.125 6.388 11.917 4.716 14.658 4.716C15.97 4.716 17.344 4.951 17.344 4.951V7.923H15.831C14.34 7.923 13.875 8.853 13.875 9.808V12.073H17.203L16.671 15.563H13.875V24C19.612 23.094 24 18.099 24 12.073Z"
                        fill="currentColor"
                        className="text-white"
                      />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

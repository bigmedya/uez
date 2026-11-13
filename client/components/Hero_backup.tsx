import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHomepage } from "@/hooks/useHomepage";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Link } from "react-router-dom";
import InfoBanner from "@/components/InfoBanner";


/** Patlama kabukları (sol uçtaki kaldırıldı: rakama doğru “kuyruk” gibi görünüyordu) */
const FW_SHELLS: { left: string; top: string; delay: number; primary: string; secondary: string }[] = [
  { left: "28%", top: "16%", delay: 0, primary: "#fca5a5", secondary: "#c4b5fd" },
  { left: "46%", top: "12%", delay: 0.45, primary: "#fef08a", secondary: "#fb923c" },
  { left: "64%", top: "18%", delay: 0.9, primary: "#fbcfe8", secondary: "#a78bfa" },
  { left: "82%", top: "24%", delay: 1.35, primary: "#fde047", secondary: "#f87171" },
];

function CountdownFireworksOverlay() {
  return (
    <div
      className="uez-countdown-fireworks pointer-events-none absolute left-0 right-0 top-0 z-[5] h-[60%] overflow-visible"
      aria-hidden
    >
      {FW_SHELLS.map((shell, si) => (
        <div
          key={si}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: shell.left, top: shell.top }}
        >
          <div className="relative h-0 w-0">
              {Array.from({ length: FW_RAY_COUNT }).map((_, ri) => {
                const deg = (360 / FW_RAY_COUNT) * ri;
                /* Sağa (0°) giden ışın rakama doğru “kuyruk” gibi görünüyordu */
                if (ri === 0) return null;
                const grad = ri % 2 === 0 ? shell.primary : shell.secondary;
                return (
                  <div
                    key={ri}
                    className="absolute left-0 top-0 h-[2px] w-12 origin-left rounded-full will-change-transform"
                    style={{
                      marginTop: -1,
                      background: `linear-gradient(90deg, ${grad} 0%, ${shell.secondary}55 35%, transparent 92%)`,
                      boxShadow: `0 0 8px ${grad}, 0 0 16px rgba(255, 200, 150, 0.35)`,
                      ["--angle" as string]: `${deg}deg`,
                      animation: `uez-fw-ray ${FW_CYCLE_S}s ease-out infinite`,
                      animationDelay: `${shell.delay}s`,
                      animationFillMode: "backwards",
                    }}
                  />
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(eventDate: string): TimeLeft {
  const difference = new Date(eventDate).getTime() - new Date().getTime();

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

// YouTube URL'ini embed formatına çevir
function getYouTubeEmbedUrl(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}`;
  }
  return null;
}

// URL'nin MP4 olup olmadığını kontrol et
function isMp4Url(url: string): boolean {
  return url.toLowerCase().endsWith('.mp4') || url.includes('.mp4?');
}

export default function Hero() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith("en") ? "en" : "tr";
  const { homepage, isLoading } = useHomepage(locale);
  const { settings } = useSiteSettings();
  /** Sadece saniyede bir yeniden çizim için (sayaç canlı kalsın) */
  const [, setTick] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const hasEventDate = Boolean(homepage?.hero.eventDate);
  const eventDateMs = homepage?.hero.eventDate
    ? new Date(homepage.hero.eventDate).getTime()
    : null;
  const eventHasStarted = eventDateMs !== null && eventDateMs <= Date.now();
  const displayTimeLeft: TimeLeft = homepage?.hero.eventDate
    ? calculateTimeLeft(homepage.hero.eventDate)
    : { days: 0, hours: 0, minutes: 0, seconds: 0 };

  /** Tarih varsa sayaç kutusu; bittiğinde 0 kalır, üstte fişek katmanı */
  const showCountdownGrid = hasEventDate && !isLoading;

  useEffect(() => {
    if (!homepage?.hero.eventDate) return;
    const timer = setInterval(() => {
      setTick((n) => n + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [homepage?.hero.eventDate]);

  const CountdownCircle = ({
    value,
    label,
    valueOnTop = false,
  }: {
    value: number;
    label: string;
    /** Rakamı efektlerin üstünde tutar */
    valueOnTop?: boolean;
  }) => (
    <div className="flex flex-col items-center">
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28">
        {/* Background circle */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-primary to-purple-dark opacity-40" />

        {/* Border circle */}
        <svg className="absolute inset-0 h-full w-full -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r="45%"
            fill="none"
            stroke="#F37A71"
            strokeWidth="2.5"
            strokeOpacity="0.2"
            className="circle-progress"
          />
          <circle
            cx="50%"
            cy="50%"
            r="45%"
            fill="none"
            stroke="#F37A71"
            strokeWidth="2.5"
            strokeDasharray="283"
            strokeDashoffset="70"
            strokeLinecap="round"
            className="animate-pulse"
          />
        </svg>

        <div
          className={`absolute inset-0 ${
            valueOnTop ? "pointer-events-none z-20" : ""
          }`}
        >
          <span className="absolute left-1/2 top-1/2 inline-block -translate-x-1/2 -translate-y-1/2 font-poppins text-2xl font-bold tabular-nums leading-none text-white sm:text-3xl md:text-4xl">
            {value}
          </span>
        </div>
      </div>

      {/* Label */}
      <span className="mt-2 whitespace-nowrap font-poppins text-xs text-white sm:text-sm md:text-base lg:text-lg">
        {label}
      </span>
    </div>
  );

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


  // Split title for styling (first word orange, rest white)
  const titleParts = hero.title.split(/\n|<br\s*\/?>/);

  return (
    <section className="relative min-h-screen overflow-hidden">

      {/* Content */}
      <div className="relative z-10 container mx-auto px-8 lg:px-16">
        <div className="grid lg:grid-cols-[1.35fr_1fr] gap-8 lg:gap-16 items-start min-h-[calc(100vh-148px)]">
          {/* Left content - daha geniş alan (grid 1.35fr ile) */}
          <div className="pt-8 sm:pt-12 lg:pt-28">
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

            <div className="flex justify-start pt-1 mt-4">
              <Link
                to={hero.buttonLink}
                className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl
                  border border-coral-pink bg-gradient-primary text-white
                  text-base sm:text-lg hover:scale-105 transition-transform" >
                {hero.buttonText}
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 27 27"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="flex-shrink-0"
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
            </div>

            <div className="mt-8 sm:mt-16 lg:mt-24">
              <InfoBanner inline className="flex-wrap justify-start gap-6" />
            </div>
          </div>

          {/* Right content - Video + saat kutusu eşit genişlikte */}
          <div className="space-y-6 max-w-[520px] mx-auto lg:mr-0 lg:ml-auto">
            {/* Video/Image container */}
            <div className="relative rounded-[40px] border border-purple-accent overflow-hidden shadow-[0_4px_130px_0_rgba(44,0,73,1)] bg-gray-500 aspect-video w-full">
              {isVideoPlaying && hero.videoUrl ? (
                <>
                  {getYouTubeEmbedUrl(hero.videoUrl) ? (
                    <iframe
                      src={getYouTubeEmbedUrl(hero.videoUrl) + "?autoplay=1&rel=0"}
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title="Video Player"
                    />
                  ) : isMp4Url(hero.videoUrl) ? (
                    <video
                      src={hero.videoUrl}
                      controls
                      autoPlay
                      className="w-full h-full object-contain"
                    >
                      {t("hero.videoNotSupported")}
                    </video>
                  ) : null}
                </>
              ) : (
                <>
                  <img
                    src={hero.videoImage || "https://api.builder.io/api/v1/image/assets/TEMP/72290d79abf52f87a2347354794d9ee246900632?width=1925"}
                    alt="Summit"
                    className="w-full h-full object-contain"
                  />

                  {/* Play button */}
                  {hero.videoUrl && (
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

            {/* Countdown Timer - video ile aynı genişlikte; overflow-visible: fişek ışınları üstten kesilmesin */}
            <div className="relative overflow-visible rounded-xl border border-purple-medium bg-[#26023F] p-5 md:p-6">
              {/* Arka plan sadece bu katmanda kırpılır (köşeler); kartın kendisi taşmaya izin verir */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
                <img
                  src="https://api.builder.io/api/v1/image/assets/TEMP/381e8b17c5fa919c50c30c74e9e5fdb4a9f04259?width=2456"
                  alt=""
                  className="h-full w-full object-cover opacity-30 rotate-[0deg]"
                />
              </div>

              {isLoading ? (
                <div
                  className="relative flex min-h-[140px] items-center justify-center"
                  aria-busy="true"
                >
                  <div className="h-10 w-48 animate-pulse rounded-lg bg-white/10" />
                </div>
              ) : showCountdownGrid ? (
                <div className="relative min-h-[140px] overflow-visible">
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
                    <CountdownCircle
                      value={displayTimeLeft.days}
                      label={t("hero.days")}
                      valueOnTop={eventHasStarted}
                    />
                    <CountdownCircle
                      value={displayTimeLeft.hours}
                      label={t("hero.hours")}
                      valueOnTop={eventHasStarted}
                    />
                    <CountdownCircle
                      value={displayTimeLeft.minutes}
                      label={t("hero.minutes")}
                      valueOnTop={eventHasStarted}
                    />
                    <CountdownCircle
                      value={displayTimeLeft.seconds}
                      label={t("hero.seconds")}
                      valueOnTop={eventHasStarted}
                    />
                  </div>
                  {eventHasStarted && (
                    <p className="relative z-10 mt-4 text-center text-xs font-medium text-white/95 md:text-sm">
                      {t("hero.countdownComplete")}
                    </p>
                  )}
                </div>
              ) : null}
            </div>

            {/* Social Media */}
            <div className="pb-8">
              <div className="flex items-center justify-center gap-4 sm:gap-6 md:gap-8">
                {/* Twitter/X */}
                {settings.twitter && (
                  <a
                    href={settings.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex items-center justify-center rounded-full bg-gradient-to-br from-purple-primary/10 to-orange-primary/10 hover:from-purple-primary/20 hover:to-orange-primary/20 border-2 border-purple-primary/30 hover:border-purple-primary/50 transition-all transform hover:scale-110 flex-shrink-0 backdrop-blur-sm"
                    aria-label="X (Twitter)"
                  >
                    <svg
                      width="20"
                      height="20"
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
                    className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex items-center justify-center rounded-full bg-gradient-to-br from-purple-primary/10 to-orange-primary/10 hover:from-purple-primary/20 hover:to-orange-primary/20 border-2 border-purple-primary/30 hover:border-purple-primary/50 transition-all transform hover:scale-110 flex-shrink-0 backdrop-blur-sm"
                    aria-label="YouTube"
                  >
                    <svg
                      width="24"
                      height="18"
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
                    className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex items-center justify-center rounded-full bg-gradient-to-br from-purple-primary/10 to-orange-primary/10 hover:from-purple-primary/20 hover:to-orange-primary/20 border-2 border-purple-primary/30 hover:border-purple-primary/50 transition-all transform hover:scale-110 flex-shrink-0 backdrop-blur-sm"
                    aria-label="Instagram"
                  >
                    <svg
                      width="24"
                      height="24"
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
                    className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex items-center justify-center rounded-full bg-gradient-to-br from-purple-primary/10 to-orange-primary/10 hover:from-purple-primary/20 hover:to-orange-primary/20 border-2 border-purple-primary/30 hover:border-purple-primary/50 transition-all transform hover:scale-110 flex-shrink-0 backdrop-blur-sm"
                    aria-label="LinkedIn"
                  >
                    <svg
                      width="24"
                      height="24"
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
                    className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex items-center justify-center rounded-full bg-gradient-to-br from-purple-primary/10 to-orange-primary/10 hover:from-purple-primary/20 hover:to-orange-primary/20 border-2 border-purple-primary/30 hover:border-purple-primary/50 transition-all transform hover:scale-110 flex-shrink-0 backdrop-blur-sm"
                    aria-label="Facebook"
                  >
                    <svg
                      width="24"
                      height="24"
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

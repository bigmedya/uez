import { useTranslation } from "react-i18next";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const partnerLogos = [
  { src: "/footer-logos/capitalbeyaz.png", alt: "Capital", href: "https://www.capital.com.tr" },
  { src: "/footer-logos/ekonomist-disi.png", alt: "Ekonomist", href: "https://www.ekonomist.com.tr" },
  { src: "/footer-logos/start-up.png", alt: "Start-up", href: "https://bmag.com.tr/dergi/start-up/tumu" },
  { src: "/footer-logos/ceo-life.png", alt: "CEO Life", href: "https://bmag.com.tr/dergi/ceo-life/tumu" },
];

export default function Footer() {
  const { t } = useTranslation();
  const { settings } = useSiteSettings();

  return (
    <footer className="bg-purple-dark py-12">
      <div className="container mx-auto px-8 lg:px-16">
        {/* Üst bölüm */}
        <div className="flex flex-col items-center justify-center gap-5 sm:gap-6 pb-8 border-b border-white/20">
          <img
            src="https://api.builder.io/api/v1/image/assets/TEMP/ce1b2a7994399c5296448438c407e6822ca63410?width=386"
            alt="UEZ Logo"
            className="h-24 sm:h-28 lg:h-32 w-auto shrink-0"
          />
          <div className="my-3 sm:my-0 flex flex-row items-center justify-center gap-2 sm:gap-4 lg:gap-6 px-3.5 py-3.5 sm:px-3 sm:py-3 rounded-xl border border-white/95 sm:border-white shrink-0 box-border">
            {partnerLogos.map((logo, index) => {
              const isCapital = logo.alt === "Capital";
              const mobileBox = isCapital ? "h-7" : "h-6";
              const boxSize = "min-w-14 w-14 sm:min-w-24 sm:w-24 lg:min-w-28 lg:w-28";
              return (
                <div key={logo.alt} className="flex flex-row items-center">
                  {index > 0 && (
                    <div className="flex items-center justify-center shrink-0 ml-0.5 sm:ml-1 lg:ml-1 mr-3 sm:mr-5 lg:mr-6" aria-hidden>
                      <div className="w-px h-5 sm:h-8 bg-white/70" />
                    </div>
                  )}
                  {logo.href ? (
                    <a
                      href={logo.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-center ${mobileBox} sm:h-10 lg:h-12 ${boxSize} shrink-0`}
                      aria-label={logo.alt}
                    >
                      <img
                        src={logo.src}
                        alt={logo.alt}
                        className={`${mobileBox} sm:h-10 lg:h-12 w-full max-w-[theme(spacing.28)] object-contain object-center hover:opacity-80 transition-opacity`}
                      />
                    </a>
                  ) : (
                    <span className={`flex items-center justify-center ${mobileBox} sm:h-10 lg:h-12 ${boxSize} shrink-0`} aria-hidden>
                      <img
                        src={logo.src}
                        alt={logo.alt}
                        className={`${mobileBox} sm:h-10 lg:h-12 w-full max-w-[theme(spacing.28)] object-contain object-center`}
                      />
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col items-center gap-8 pt-8">
          <div className="flex justify-center gap-1.5 sm:gap-2">
            {settings.twitter && (
              <a
                href={settings.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="w-14 h-14 lg:w-16 lg:h-16 flex items-center justify-center rounded-full hover:bg-purple-dark transition-colors"
                aria-label={t("footer.ariaTwitter")}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
                    fill="white"
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
                className="w-14 h-14 lg:w-16 lg:h-16 flex items-center justify-center rounded-full hover:bg-purple-dark transition-colors"
                aria-label={t("footer.ariaYoutube")}
              >
                <svg
                  width="31"
                  height="22"
                  viewBox="0 0 31 22"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M15.3379 0C15.4143 1.02231e-05 24.9469 0.00222208 27.3232 0.637695C28.6441 0.985761 29.6891 2.01106 30.0439 3.30664C30.691 5.65311 30.7136 10.5057 30.7139 10.5576C30.7139 10.5576 30.714 15.4698 30.0635 17.8096C29.7086 19.1051 28.6635 20.1295 27.3428 20.4775C24.9643 21.1136 15.4169 21.1162 15.3574 21.1162C15.3574 21.1162 5.75648 21.1157 3.37109 20.4775C2.05033 20.1295 1.00526 19.1051 0.650391 17.8096C-0.000168656 15.4504 0 10.5576 0 10.5576C1.79573e-05 10.5058 0.00343725 5.65351 0.630859 3.32617C0.98571 2.03059 2.03073 1.00529 3.35156 0.657227C5.73735 0.0191668 15.3379 0 15.3379 0ZM12.2832 15.083L20.248 10.5576L12.2832 6.0332V15.083Z"
                    fill="white"
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
                className="w-14 h-14 lg:w-16 lg:h-16 flex items-center justify-center rounded-full hover:bg-purple-dark transition-colors"
                aria-label={t("footer.ariaInstagram")}
              >
                <svg
                  width="37"
                  height="37"
                  viewBox="0 0 37 37"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3.07129 26.7118V10.1568C3.19146 9.58293 3.26357 8.99279 3.44263 8.43752C4.48275 5.21525 7.39159 3.0927 10.7974 3.08308C15.8848 3.06866 20.9721 3.06866 26.0595 3.08308C27.7054 3.08308 29.2191 3.54401 30.5482 4.52115C32.7113 6.11125 33.7784 8.26986 33.7808 10.9513C33.7857 15.9087 33.7845 20.8662 33.7773 25.8235C33.7841 26.333 33.7454 26.8419 33.6618 27.3445C33.1463 30.1822 31.5348 32.1623 28.871 33.2458C28.1879 33.5234 27.4289 33.6147 26.7044 33.7914H10.1496C9.9345 33.7536 9.71879 33.7175 9.50427 33.6766C6.68497 33.1448 4.71108 31.5488 3.6253 28.9046C3.34229 28.2122 3.25095 27.4437 3.07129 26.7118ZM24.8273 18.4349C24.8273 14.9223 21.9815 12.0678 18.4429 12.0348C14.944 12.0023 12.0304 14.9079 12.0273 18.4331C12.0273 21.945 14.8719 24.7995 18.4111 24.8338C21.9063 24.8668 24.8255 21.9564 24.8273 18.4349ZM26.7453 12.0276C27.2498 12.0275 27.7341 11.8286 28.0933 11.4739C28.4524 11.1193 28.6573 10.6375 28.6638 10.1328C28.6819 9.09014 27.7991 8.20015 26.7464 8.19834C26.2419 8.20131 25.7589 8.40243 25.4013 8.75834C25.0437 9.11424 24.8403 9.59644 24.835 10.1009C24.8321 10.3534 24.8795 10.6039 24.9742 10.8379C25.0691 11.0718 25.2094 11.2846 25.3871 11.4639C25.5649 11.6432 25.7765 11.7853 26.0096 11.8821C26.2427 11.9789 26.4928 12.0283 26.7453 12.0276Z"
                    fill="white"
                  />
                </svg>
              </a>
            )}

            {settings.linkedin && (
              <a
                href={settings.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="w-14 h-14 lg:w-16 lg:h-16 flex items-center justify-center rounded-full hover:bg-purple-dark transition-colors"
                aria-label={t("footer.ariaLinkedin")}
              >
                <svg
                  width="37"
                  height="37"
                  viewBox="0 0 37 37"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M29.2413 29.2429H24.6904V22.1158C24.6904 20.4162 24.6601 18.2284 22.3235 18.2284C19.9532 18.2284 19.5906 20.0801 19.5906 21.992V29.2424H15.0397V14.5861H19.4085V16.5891H19.4697C19.9069 15.8415 20.5387 15.2265 21.2978 14.8096C22.0569 14.3927 22.9148 14.1895 23.7803 14.2216C28.3928 14.2216 29.2432 17.2556 29.2432 21.2027L29.2413 29.2429ZM9.90474 12.5827C9.38241 12.5828 8.87177 12.428 8.43742 12.1379C8.00306 11.8478 7.66452 11.4354 7.46455 10.9528C7.26457 10.4703 7.21216 9.93926 7.31397 9.42693C7.41578 8.9146 7.66723 8.44397 8.03651 8.07455C8.40579 7.70513 8.87631 7.45351 9.38859 7.35151C9.90086 7.24952 10.4319 7.30172 10.9145 7.50153C11.3971 7.70134 11.8096 8.03977 12.0999 8.47403C12.3901 8.90829 12.5451 9.41889 12.5452 9.94123C12.5453 10.2881 12.477 10.6315 12.3444 10.9519C12.2117 11.2724 12.0172 11.5636 11.772 11.8089C11.5269 12.0541 11.2357 12.2487 10.9153 12.3815C10.5949 12.5143 10.2516 12.5827 9.90474 12.5827ZM12.1802 29.2429H7.62455V14.5861H12.1802V29.2429ZM31.5101 3.07436H5.33773C4.7437 3.06765 4.17127 3.29707 3.74629 3.7122C3.32131 4.12733 3.07854 4.6942 3.07129 5.28825V31.5701C3.07829 32.1645 3.32092 32.7317 3.74588 33.1473C4.17085 33.5628 4.7434 33.7927 5.33773 33.7864H31.5101C32.1056 33.7938 32.6798 33.5646 33.1064 33.1491C33.5331 32.7335 33.7773 32.1656 33.7856 31.5701V5.28636C33.7771 4.69113 33.5327 4.12361 33.106 3.70849C32.6793 3.29337 32.1054 3.06461 31.5101 3.07246"
                    fill="white"
                  />
                </svg>
              </a>
            )}

            {/* Facebook - panelden (Site Ayarları > Sosyal Medya) */}
            {settings.facebook && (
              <a
                href={settings.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="w-14 h-14 lg:w-16 lg:h-16 flex items-center justify-center rounded-full hover:bg-purple-dark transition-colors"
                aria-label={t("footer.ariaFacebook")}
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
                    fill="white"
                  />
                </svg>
              </a>
            )}
          </div>

          <div className="flex justify-center w-full px-2">
            <img
              src="/iyzico.png"
              alt={t("footer.paymentAlt")}
              className="max-h-10 sm:max-h-12 lg:max-h-14 w-auto max-w-full object-contain opacity-95 hover:opacity-100 transition-opacity"
            />
          </div>

          {/* Çerez / Aydınlatma linkleri ve telif - ortada, sosyal medyadan sonra */}
          <div className="text-center w-full">
            <div className="flex flex-row flex-wrap justify-center items-center gap-x-1 sm:gap-x-2 md:gap-x-3 gap-y-1.5 mb-4">
              <a
                href="/cerez-politikasi"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-purple-accent transition-colors text-[10px] sm:text-xs md:text-sm lg:text-base font-semibold whitespace-nowrap shrink-0"
              >
                {t("footer.cookiePolicy")}
              </a>
              <span className="text-white/50 text-[10px] sm:text-xs md:text-sm lg:text-base shrink-0">|</span>
              <a
                href="/acik-riza-metni"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-purple-accent transition-colors text-[10px] sm:text-xs md:text-sm lg:text-base font-semibold whitespace-nowrap shrink-0"
              >
                {t("footer.openConsent")}
              </a>
              <span className="text-white/50 text-[10px] sm:text-xs md:text-sm lg:text-base shrink-0">|</span>
              <a
                href="/aydinlatma-metni"
                className="text-white hover:text-purple-accent transition-colors text-[10px] sm:text-xs md:text-sm lg:text-base font-semibold whitespace-nowrap shrink-0"
              >
                {t("footer.disclosure")}
              </a>
              <span className="text-white/50 text-[10px] sm:text-xs md:text-sm lg:text-base shrink-0">|</span>
              <a
                href="/teslimat-ve-iade-sartlari"
                className="text-white hover:text-purple-accent transition-colors text-[10px] sm:text-xs md:text-sm lg:text-base font-semibold whitespace-nowrap shrink-0"
              >
                {t("footer.deliveryReturn")}
              </a>
              <span className="text-white/50 text-[10px] sm:text-xs md:text-sm lg:text-base shrink-0">|</span>
              <a
                href="/mesafeli-satis-sozlesmesi"
                className="text-white hover:text-purple-accent transition-colors text-[10px] sm:text-xs md:text-sm lg:text-base font-semibold whitespace-nowrap shrink-0"
              >
                {t("footer.distanceSales")}
              </a>
            </div>
            <p className="text-white text-xs sm:text-sm md:text-base lg:text-lg font-semibold">
              {settings.copyrightText}
            </p>
            <button type="button" className="efl-edit mt-2 inline-block text-white hover:text-purple-accent transition-colors text-[10px] sm:text-xs md:text-sm lg:text-base font-semibold" >
              {t("footer.cookiePreferences")}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

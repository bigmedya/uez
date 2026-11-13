import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { TURKEY_CITIES } from "@/data/turkey-cities-districts";
import { usePackages } from "@/hooks/usePackages";
import {
  formatCardNumber,
  formatExpiry,
  formatCvc,
  formatPhone,
  formatTCKimlik,
  formatVergiNo,
  formatPostaKodu,
  formatPriceWithCurrency,
  validateCardNumber,
  validateExpiry,
  validateCvc,
  validatePhone,
  validateTCKimlik,
  validateVergiNo,
  validatePostaKodu,
  validateEmail,
} from "@/utils/registrationFormatters";
import {
  parseUTMFromSearchParams,
  saveUTMToStorage,
  getUTMFromStorage,
  addUTMToFormData,
  isValidUTMData,
  type UTMData,
} from "@shared/utm";

// Step icons
const StepIcons = {
  katilimTipi: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  katilimciBilgileri: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  odemeYontemi: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="1" y1="10" x2="23" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  faturaBilgileri: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  ozetOnay: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="22,4 12,14.01 9,11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

const stepKeys = [
  { id: 1, key: "step1", icon: "katilimTipi" },
  { id: 2, key: "step2", icon: "katilimciBilgileri" },
  { id: 3, key: "step3", icon: "faturaBilgileri" },
  { id: 4, key: "step4", icon: "odemeYontemi" },
  { id: 5, key: "step5", icon: "ozetOnay" },
];

export default function Registration() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith("en") ? "en" : undefined;
  const { packages, isLoading: loadingPackages } = usePackages({ activeOnly: true, locale });

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"kredi" | "havale">("kredi");
  const [invoiceType, setInvoiceType] = useState<"firma" | "sahis">("firma");
  const [isEFatura, setIsEFatura] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [mesafeliVeIadeOnay, setMesafeliVeIadeOnay] = useState(false);
  const [acikRizaOnay, setAcikRizaOnay] = useState(false);
  const [aydinlatmaMetniOnay, setAydinlatmaMetniOnay] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [paymentResultMessage, setPaymentResultMessage] = useState<"success" | "failed" | "error" | null>(null);
  const [utmData, setUtmData] = useState<UTMData>({});

  // UTM parametrelerini yakala ve kaydet
  useEffect(() => {
    // URL'den UTM parametrelerini parse et
    const currentUtmData = parseUTMFromSearchParams(searchParams);
    
    if (isValidUTMData(currentUtmData)) {
      // Yeni UTM verisi varsa kaydet
      setUtmData(currentUtmData);
      saveUTMToStorage(currentUtmData);
    } else {
      // URL'de UTM yoksa localStorage'dan yükle
      const storedUtmData = getUTMFromStorage();
      if (isValidUTMData(storedUtmData)) {
        setUtmData(storedUtmData);
      }
    }
  }, [searchParams]);

  // iyzico callback sonrası payment=success | failed | error → state'e al, URL'i temizle
  useEffect(() => {
    const payment = searchParams.get("payment");
    if (payment === "success" || payment === "failed" || payment === "error") {
      setPaymentResultMessage(payment);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Scroll to title when page loads
  useEffect(() => {
    const titleElement = document.getElementById('registration-title');
    if (titleElement) {
      setTimeout(() => {
        titleElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
          inline: "nearest",
        });
      }, 100);
    }
  }, []);

  const [formData, setFormData] = useState({
    // Katılımcı bilgileri
    adSoyad: "",
    kurumAdi: "",
    unvan: "",
    kurumAdresi: "",
    telefon: "",
    eposta: "",
    ceptel: "",
    asistanAdSoyad: "",
    asistanEposta: "",
    asistanTelefon: "",
    // İkinci katılımcı (çift kişi için)
    adSoyad2: "",
    kurumAdi2: "",
    unvan2: "",
    kurumAdresi2: "",
    telefon2: "",
    eposta2: "",
    ceptel2: "",
    // Ödeme bilgileri
    kartNumarasi: "",
    cvc: "",
    sonKullanma: "",
    // Fatura bilgileri - Firma
    firmaUnvani: "",
    faturaSehir: "",
    faturaIlce: "",
    faturaAdres: "",
    faturaPostaKodu: "",
    vergiDairesi: "",
    vergiNo: "",
    eArsivEmail: "",
    // Fatura bilgileri - Şahıs
    tcKimlik: "",
    ilgiliKisi: "",
    sahisFaturaSehir: "",
    sahisFaturaIlce: "",
    sahisFaturaAdres: "",
    sahisFaturaPostaKodu: "",
    sahisEposta: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "faturaSehir") next.faturaIlce = "";
      if (name === "sahisFaturaSehir") next.sahisFaturaIlce = "";
      return next;
    });
  };

  const faturaDistricts = TURKEY_CITIES.find((c) => c.name === formData.faturaSehir)?.districts ?? [];
  const sahisDistricts = TURKEY_CITIES.find((c) => c.name === formData.sahisFaturaSehir)?.districts ?? [];

  const isValidEmail = (email: string) => validateEmail(email).valid;

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, kartNumarasi: formatCardNumber(e.target.value) }));
  };

  const handleCVCChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, cvc: formatCvc(e.target.value) }));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, sonKullanma: formatExpiry(e.target.value) }));
  };

  const handlePhoneChange = (field: "telefon" | "ceptel" | "telefon2" | "ceptel2" | "asistanTelefon") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: formatPhone(e.target.value) }));
    };

  const handleTCKimlikChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, tcKimlik: formatTCKimlik(e.target.value) }));
  };

  const handleVergiNoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, vergiNo: formatVergiNo(e.target.value) }));
  };

  const handlePostaKoduChange = (field: "faturaPostaKodu" | "sahisFaturaPostaKodu") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: formatPostaKodu(e.target.value) }));
    };

  /** Mevcut adım için zorunlu alanları kontrol eder. Hata varsa mesaj döner, yoksa null. */
  const getStepValidationError = (step: number): string | null => {
    if (step === 1) {
      if (!selectedPackage) return t("registration.selectPackageError");
      return null;
    }
    if (step === 2) {
      if (!formData.adSoyad.trim()) return t("registration.requiredFieldsError");
      if (!formData.kurumAdi.trim()) return t("registration.requiredFieldsError");
      if (!formData.telefon.trim()) return t("registration.requiredFieldsError");
      if (!validatePhone(formData.telefon).valid) return validatePhone(formData.telefon).message;
      if (!formData.eposta.trim()) return t("registration.requiredFieldsError");
      if (!validateEmail(formData.eposta).valid) return validateEmail(formData.eposta).message;
      return null;
    }
    if (step === 3) {
      if (invoiceType === "firma") {
        if (!formData.faturaSehir.trim()) return t("registration.requiredFieldsError");
        if (!formData.faturaIlce.trim()) return t("registration.requiredFieldsError");
        if (!formData.faturaAdres.trim()) return t("registration.requiredFieldsError");
        if (!formData.faturaPostaKodu.trim()) return t("registration.requiredFieldsError");
        if (!validatePostaKodu(formData.faturaPostaKodu).valid) return validatePostaKodu(formData.faturaPostaKodu).message;
      } else {
        if (!formData.sahisFaturaSehir.trim()) return t("registration.requiredFieldsError");
        if (!formData.sahisFaturaIlce.trim()) return t("registration.requiredFieldsError");
        if (!formData.sahisFaturaAdres.trim()) return t("registration.requiredFieldsError");
        if (!formData.sahisFaturaPostaKodu.trim()) return t("registration.requiredFieldsError");
        if (!validatePostaKodu(formData.sahisFaturaPostaKodu).valid) return validatePostaKodu(formData.sahisFaturaPostaKodu).message;
      }
      return null;
    }
    if (step === 4) {
      if (paymentMethod === "kredi") {
        if (!validateCardNumber(formData.kartNumarasi).valid) return validateCardNumber(formData.kartNumarasi).message;
        if (!validateCvc(formData.cvc).valid) return validateCvc(formData.cvc).message;
        if (!validateExpiry(formData.sonKullanma).valid) return validateExpiry(formData.sonKullanma).message;
      }
      if (!mesafeliVeIadeOnay || !acikRizaOnay || !aydinlatmaMetniOnay) {
        return t("registration.termsRequiredError");
      }
      return null;
    }
    return null;
  };

  const isCurrentStepValid = () => !getStepValidationError(currentStep);

  const nextStep = () => {
    if (currentStep >= 5) return;
    if (getStepValidationError(currentStep)) return;
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const getSelectedPackageData = () => {
    return packages.find((p) => p.packageId === selectedPackage);
  };

  // Check if participant info and payment method are filled
  const isFormValid = () => {
    // Check participant info (required fields + regex validations)
    const hasParticipantInfo =
      formData.adSoyad.trim() !== "" &&
      formData.eposta.trim() !== "" &&
      validateEmail(formData.eposta).valid &&
      formData.kurumAdi.trim() !== "" &&
      formData.telefon.trim() !== "" &&
      validatePhone(formData.telefon).valid;

    // Check payment method (kredi: kart bilgileri regex/format ile doğrula)
    let hasPaymentMethod = false;
    if (paymentMethod === "havale") {
      hasPaymentMethod = true;
    } else if (paymentMethod === "kredi") {
      const card = validateCardNumber(formData.kartNumarasi);
      const expiry = validateExpiry(formData.sonKullanma);
      const cvc = validateCvc(formData.cvc);
      hasPaymentMethod = card.valid && expiry.valid && cvc.valid;
    }

    const hasLegalConsents = mesafeliVeIadeOnay && acikRizaOnay && aydinlatmaMetniOnay;

    // Check fatura bilgileri (şehir, ilçe, açık adres, posta kodu zorunlu + format)
    const hasInvoiceAddress =
      invoiceType === "firma"
        ? formData.faturaSehir.trim() !== "" &&
          formData.faturaIlce.trim() !== "" &&
          formData.faturaAdres.trim() !== "" &&
          formData.faturaPostaKodu.trim() !== "" &&
          validatePostaKodu(formData.faturaPostaKodu).valid
        : formData.sahisFaturaSehir.trim() !== "" &&
          formData.sahisFaturaIlce.trim() !== "" &&
          formData.sahisFaturaAdres.trim() !== "" &&
          formData.sahisFaturaPostaKodu.trim() !== "" &&
          validatePostaKodu(formData.sahisFaturaPostaKodu).valid;

    return hasParticipantInfo && hasPaymentMethod && hasLegalConsents && hasInvoiceAddress;
  };

  const resetFormAfterSuccess = () => {
    setFormData({
      adSoyad: "",
      kurumAdi: "",
      unvan: "",
      kurumAdresi: "",
      telefon: "",
      eposta: "",
      ceptel: "",
      asistanAdSoyad: "",
      asistanEposta: "",
      asistanTelefon: "",
      adSoyad2: "",
      kurumAdi2: "",
      unvan2: "",
      kurumAdresi2: "",
      telefon2: "",
      eposta2: "",
      ceptel2: "",
      kartNumarasi: "",
      cvc: "",
      sonKullanma: "",
      firmaUnvani: "",
      faturaSehir: "",
      faturaIlce: "",
      faturaAdres: "",
      faturaPostaKodu: "",
      vergiDairesi: "",
      vergiNo: "",
      eArsivEmail: "",
      tcKimlik: "",
      ilgiliKisi: "",
      sahisFaturaSehir: "",
      sahisFaturaIlce: "",
      sahisFaturaAdres: "",
      sahisFaturaPostaKodu: "",
      sahisEposta: "",
    });
    setSelectedPackage(null);
    setMesafeliVeIadeOnay(false);
    setAcikRizaOnay(false);
    setAydinlatmaMetniOnay(false);
    setCurrentStep(1);
    setSubmitSuccess(true);
    setTimeout(() => setSubmitSuccess(false), 5000);
  };

  const handleSubmit = async () => {
    if (!selectedPackage) {
      setSubmitError("Lütfen bir katılım tipi seçin.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    const packageData = getSelectedPackageData();
    const consentTimestamp = new Date().toISOString();
    let formDataToSubmit = {
      packageId: selectedPackage,
      packageTitle: packageData?.title || "",
      packageSubtitle: packageData?.subtitle || "",
      packagePrice: packageData?.price || "",
      paymentMethod,
      invoiceType,
      isEFatura,
      ...formData,
      ...(mesafeliVeIadeOnay ? { mesafeliSatisVeIadeOnayTarihi: consentTimestamp } : {}),
      ...(acikRizaOnay ? { acikRizaOnayTarihi: consentTimestamp } : {}),
      ...(aydinlatmaMetniOnay ? { aydinlatmaMetniOnayTarihi: consentTimestamp } : {}),
    };

    // UTM verilerini form data'sına ekle
    formDataToSubmit = addUTMToFormData(formDataToSubmit, utmData);

    try {
      if (paymentMethod === "kredi") {
        const response = await fetch("/api/payment/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: formDataToSubmit }),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(result.error || t("registration.paymentProcessError"));
        }
        if (!result.success) {
          throw new Error(result.error || t("registration.paymentCompleteError"));
        }
        // 3D Secure: Banka doğrulama sayfasına yönlendir (HTML form otomatik submit olur)
        if (result.threeDSHtmlContent) {
          let html = result.threeDSHtmlContent as string;
          try {
            if (html.trim().length > 0 && !html.trimStart().startsWith("<")) {
              html = atob(html);
            }
          } catch {
            // Zaten düz HTML ise atob hata verir, olduğu gibi kullan
          }
          const win = window.open("", "_self");
          if (win) {
            win.document.open();
            win.document.write(html);
            win.document.close();
          }
          return;
        }
        resetFormAfterSuccess();
        return;
      }

      const response = await fetch("/api/forms/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formType: "kayit",
          formName: "UEZ 2026 Kayıt Formu",
          data: formDataToSubmit,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "Kayıt gönderilirken bir hata oluştu");
      }
      resetFormAfterSuccess();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Kayıt gönderilirken bir hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-light">
      {/* Header */}
      <div className="bg-purple-dark">
        <Header />
      </div>

      {/* Main Content */}
      <main className="py-12 lg:py-16 relative">
        <div className="container mx-auto px-4 lg:px-16">
          {/* Title */}
          <div id="registration-title" className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-bold text-purple-dark mb-2">
              {t("registration.pageTitle")}
            </h1>
            <h2 className="text-3xl lg:text-4xl font-light text-orange-primary italic">
              {t("registration.formTitle")}
            </h2>
          </div>

          {/* Step Indicator */}
          <div className="mb-12 overflow-x-auto scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0">
            <div className="flex items-center gap-4 lg:gap-8 justify-start lg:justify-center min-w-max">
              {stepKeys.map((step, index) => (
                <div key={step.id} className="flex items-center flex-shrink-0">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center transition-all ${
                        currentStep === step.id
                          ? "bg-purple-dark text-white"
                          : currentStep > step.id
                          ? "bg-orange-primary text-white"
                          : "bg-white border-2 border-purple-dark text-purple-dark"
                      }`}
                    >
                      {StepIcons[step.icon as keyof typeof StepIcons]}
                    </div>
                    <span
                      className={`mt-2 text-xs lg:text-sm font-medium text-center whitespace-nowrap ${
                        currentStep === step.id
                          ? "text-purple-dark"
                          : "text-gray-text"
                      }`}
                    >
                      {t(`registration.${step.key}`)}
                    </span>
                  </div>
                  {index < stepKeys.length - 1 && (
                    <div
                      className={`w-8 lg:w-16 h-0.5 mx-2 flex-shrink-0 ${
                        currentStep > step.id
                          ? "bg-orange-primary"
                          : "border-t-2 border-dashed border-gray-300"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="max-w-6xl mx-auto">
            {/* Ödeme / kayıt sonucu mesajları */}
            {currentStep === 1 && paymentResultMessage === "success" && (
              <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-center">
                {t("registration.paymentSuccess")}
              </div>
            )}
            {currentStep === 1 && paymentResultMessage === "failed" && (
              <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-center">
                {t("registration.paymentFailed")}
              </div>
            )}
            {currentStep === 1 && paymentResultMessage === "error" && (
              <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-center">
                {t("registration.paymentError")}
              </div>
            )}
            {currentStep === 1 && submitSuccess && !paymentResultMessage && (
              <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-center">
                {t("registration.submitSuccessMessage")}
              </div>
            )}

            {/* Step 1: Katılım Tipi */}
            {currentStep === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {loadingPackages ? (
                  <div className="col-span-full text-center py-12 text-gray-500">
                    {t("registration.packagesLoading")}
                  </div>
                ) : packages.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-gray-500">
                    {t("registration.noPackages")}
                  </div>
                ) : (
                  packages.map((pkg) => (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedPackage(pkg.packageId)}
                      className={`bg-white rounded-xl p-6 cursor-pointer transition-all hover:shadow-lg flex flex-col ${
                        selectedPackage === pkg.packageId
                          ? "ring-2 ring-purple-dark shadow-lg"
                          : "shadow"
                      }`}
                    >
                    <div className="flex items-baseline gap-2 mb-4">
                      <h3 className="text-xl font-bold text-gray-text italic">
                        {pkg.title}
                      </h3>
                      {pkg.subtitle && (
                        <span className="text-orange-primary font-medium italic">
                          {pkg.subtitle}
                        </span>
                      )}
                    </div>

                    <ul className="space-y-3 mb-6 flex-grow">
                      {pkg.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-text">
                          <Check className="w-4 h-4 text-orange-primary flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-auto">
                      <div className="text-2xl font-bold text-purple-dark mb-4 text-center">
                        {formatPriceWithCurrency(pkg.price)}
                      </div>

                      <button
                        className={`w-full py-3 rounded-lg font-medium transition-colors ${
                          selectedPackage === pkg.packageId
                            ? "bg-purple-dark text-white"
                            : "bg-purple-primary text-white hover:bg-purple-dark"
                        }`}
                      >
                        {t("registration.select")}
                      </button>
                    </div>
                  </div>
                  ))
                )}
              </div>
            )}

            {/* Step 2: Katılımcı Bilgileri */}
            {currentStep === 2 && (
              <div className="bg-white rounded-xl p-8 shadow">
                <h3 className="text-2xl font-semibold text-gray-text text-center mb-8">
                  {t("registration.sectionParticipant")}
                </h3>
                {!isCurrentStepValid() && (
                  <p className="text-center text-sm text-gray-500 mb-6">{t("registration.requiredFieldsHint")}</p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <label className="block text-sm font-medium text-gray-text mb-2">
                      {t("registration.fullName")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="adSoyad"
                      value={formData.adSoyad}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-purple-dark"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-text mb-2">
                      {t("registration.companyName")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="kurumAdi"
                      value={formData.kurumAdi}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-purple-dark"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-text mb-2">
                      {t("registration.title")}
                    </label>
                    <input
                      type="text"
                      name="unvan"
                      value={formData.unvan}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-purple-dark"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-text mb-2">
                      {t("registration.companyAddress")}
                    </label>
                    <input
                      type="text"
                      name="kurumAdresi"
                      value={formData.kurumAdresi}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-purple-dark"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-text mb-2">
                      {t("registration.phone")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="telefon"
                      value={formData.telefon}
                      onChange={handlePhoneChange("telefon")}
                      placeholder="5xx xxx xx xx"
                      maxLength={11}
                      className={`w-full px-4 py-3 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-purple-dark ${
                        formData.telefon && !validatePhone(formData.telefon).valid ? "border-2 border-red-500" : ""
                      }`}
                    />
                    {formData.telefon && !validatePhone(formData.telefon).valid && (
                      <p className="text-red-500 text-xs mt-1">{validatePhone(formData.telefon).message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-text mb-2">
                      {t("registration.email")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="eposta"
                      value={formData.eposta}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-purple-dark ${
                        formData.eposta && !validateEmail(formData.eposta).valid ? "border-2 border-red-500" : ""
                      }`}
                    />
                    {formData.eposta && !validateEmail(formData.eposta).valid && (
                      <p className="text-red-500 text-xs mt-1">{validateEmail(formData.eposta).message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-text mb-2">
                      {t("registration.mobilePhone")}
                    </label>
                    <input
                      type="tel"
                      name="ceptel"
                      value={formData.ceptel}
                      onChange={handlePhoneChange("ceptel")}
                      placeholder="5xx xxx xx xx"
                      maxLength={11}
                      className={`w-full px-4 py-3 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-purple-dark ${
                        formData.ceptel && !validatePhone(formData.ceptel).valid ? "border-2 border-red-500" : ""
                      }`}
                    />
                    {formData.ceptel && !validatePhone(formData.ceptel).valid && (
                      <p className="text-red-500 text-xs mt-1">{validatePhone(formData.ceptel).message}</p>
                    )}
                  </div>
                </div>

                {/* Asistan Bilgileri */}
                <div className="border-t pt-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-text mb-2">
                        {t("registration.assistantName")}
                      </label>
                      <input
                        type="text"
                        name="asistanAdSoyad"
                        value={formData.asistanAdSoyad}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-purple-dark"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-text mb-2">
                        {t("registration.email")}
                      </label>
                      <input
                        type="email"
                        name="asistanEposta"
                        value={formData.asistanEposta}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-purple-dark ${
                          formData.asistanEposta && !validateEmail(formData.asistanEposta).valid ? "border-2 border-red-500" : ""
                        }`}
                      />
                      {formData.asistanEposta && !validateEmail(formData.asistanEposta).valid && (
                        <p className="text-red-500 text-xs mt-1">{validateEmail(formData.asistanEposta).message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-text mb-2">
                        {t("registration.phone")}
                      </label>
                      <input
                        type="tel"
                        name="asistanTelefon"
                        value={formData.asistanTelefon}
                        onChange={handlePhoneChange("asistanTelefon")}
                        placeholder="5xx xxx xx xx"
                        maxLength={11}
                        className={`w-full px-4 py-3 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-purple-dark ${
                          formData.asistanTelefon && !validatePhone(formData.asistanTelefon).valid ? "border-2 border-red-500" : ""
                        }`}
                      />
                      {formData.asistanTelefon && !validatePhone(formData.asistanTelefon).valid && (
                        <p className="text-red-500 text-xs mt-1">{validatePhone(formData.asistanTelefon).message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* İkinci Katılımcı (Çift kişi için) */}
                {selectedPackage === "cift-kisi" && (
                  <div className="border-t pt-8 mt-8">
                    <h4 className="text-xl font-semibold text-gray-text text-center mb-6">
                      {t("registration.sectionSecondParticipant")}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-text mb-2">
                          {t("registration.fullName")}
                        </label>
                        <input
                          type="text"
                          name="adSoyad2"
                          value={formData.adSoyad2}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-purple-dark"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-text mb-2">
                          {t("registration.companyName")}
                        </label>
                        <input
                          type="text"
                          name="kurumAdi2"
                          value={formData.kurumAdi2}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-purple-dark"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-text mb-2">
                          {t("registration.title")}
                        </label>
                        <input
                          type="text"
                          name="unvan2"
                          value={formData.unvan2}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-purple-dark"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-text mb-2">
                          {t("registration.companyAddress")}
                        </label>
                        <input
                          type="text"
                          name="kurumAdresi2"
                          value={formData.kurumAdresi2}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-purple-dark"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-text mb-2">
                          {t("registration.phone")}
                        </label>
                        <input
                          type="tel"
                          name="telefon2"
                          value={formData.telefon2}
                          onChange={handlePhoneChange("telefon2")}
                          placeholder="5xx xxx xx xx"
                          maxLength={11}
                          className={`w-full px-4 py-3 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-purple-dark ${
                            formData.telefon2 && !validatePhone(formData.telefon2).valid ? "border-2 border-red-500" : ""
                          }`}
                        />
                        {formData.telefon2 && !validatePhone(formData.telefon2).valid && (
                          <p className="text-red-500 text-xs mt-1">{validatePhone(formData.telefon2).message}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-text mb-2">
                          {t("registration.email")}
                        </label>
                        <input
                          type="email"
                          name="eposta2"
                          value={formData.eposta2}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-purple-dark ${
                            formData.eposta2 && !validateEmail(formData.eposta2).valid ? "border-2 border-red-500" : ""
                          }`}
                        />
                        {formData.eposta2 && !validateEmail(formData.eposta2).valid && (
                          <p className="text-red-500 text-xs mt-1">{validateEmail(formData.eposta2).message}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-text mb-2">
                          {t("registration.mobilePhone")}
                        </label>
                        <input
                          type="tel"
                          name="ceptel2"
                          value={formData.ceptel2}
                          onChange={handlePhoneChange("ceptel2")}
                          placeholder="5xx xxx xx xx"
                          maxLength={11}
                          className={`w-full px-4 py-3 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-purple-dark ${
                            formData.ceptel2 && !validatePhone(formData.ceptel2).valid ? "border-2 border-red-500" : ""
                          }`}
                        />
                        {formData.ceptel2 && !validatePhone(formData.ceptel2).valid && (
                          <p className="text-red-500 text-xs mt-1">{validatePhone(formData.ceptel2).message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Fatura Bilgileri */}
            {currentStep === 3 && (
              <div className="bg-white rounded-xl p-8 shadow">
                <h3 className="text-2xl font-semibold text-gray-text text-center mb-8">
                  {t("registration.sectionInvoice")}
                </h3>
                {!isCurrentStepValid() && (
                  <p className="text-center text-sm text-gray-500 mb-6">{t("registration.requiredFieldsHint")}</p>
                )}
                {/* Invoice Type Toggle */}
                <div className="flex justify-center mb-8">
                  <div className="inline-flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setInvoiceType("firma")}
                      className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                        invoiceType === "firma"
                          ? "bg-white text-purple-dark shadow"
                          : "text-gray-text"
                      }`}
                    >
                      <Check className={`w-4 h-4 ${invoiceType === "firma" ? "text-purple-dark" : "text-transparent"}`} />
                      {t("registration.invoiceTypeFirma")}
                    </button>
                    <button
                      onClick={() => setInvoiceType("sahis")}
                      className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                        invoiceType === "sahis"
                          ? "bg-white text-purple-dark shadow"
                          : "text-gray-text"
                      }`}
                    >
                      <Check className={`w-4 h-4 ${invoiceType === "sahis" ? "text-purple-dark" : "text-transparent"}`} />
                      {t("registration.invoiceTypeSahis")}
                    </button>
                  </div>
                </div>

                {invoiceType === "firma" ? (
                  <div className="space-y-6">
                    {/* e-Fatura Toggle */}
                    <div className="flex items-center gap-4">
                      <span className="text-gray-text">{t("registration.eInvoiceQuestion")}</span>
                      <div className="inline-flex bg-gray-100 rounded-lg p-1">
                        <button
                          onClick={() => setIsEFatura(true)}
                          className={`px-4 py-1 rounded font-medium transition-colors flex items-center gap-2 ${
                            isEFatura ? "bg-white text-purple-dark shadow" : "text-gray-text"
                          }`}
                        >
                          <Check className={`w-3 h-3 ${isEFatura ? "text-purple-dark" : "text-transparent"}`} />
                          {t("registration.yes")}
                        </button>
                        <button
                          onClick={() => setIsEFatura(false)}
                          className={`px-4 py-1 rounded font-medium transition-colors ${
                            !isEFatura ? "bg-white text-purple-dark shadow" : "text-gray-text"
                          }`}
                        >
                          {t("registration.no")}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-text mb-2">
                          {t("registration.eArchiveEmail")}
                        </label>
                        <input
                          type="email"
                          name="eArsivEmail"
                          value={formData.eArsivEmail}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-purple-dark ${
                            formData.eArsivEmail && !validateEmail(formData.eArsivEmail).valid ? "border-2 border-red-500" : ""
                          }`}
                        />
                        {formData.eArsivEmail && !validateEmail(formData.eArsivEmail).valid && (
                          <p className="text-red-500 text-xs mt-1">{validateEmail(formData.eArsivEmail).message}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-text mb-2">
                          {t("registration.companyTitle")}
                        </label>
                        <input
                          type="text"
                          name="firmaUnvani"
                          value={formData.firmaUnvani}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-purple-dark"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-text mb-2">
                          {t("registration.city")} <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="faturaSehir"
                          value={formData.faturaSehir}
                          onChange={handleSelectChange}
                          className="w-full px-4 py-3 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-purple-dark"
                        >
                          <option value="">{t("registration.selectOption")}</option>
                          {TURKEY_CITIES.map((city) => (
                            <option key={city.name} value={city.name}>
                              {city.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-text mb-2">
                          {t("registration.district")} <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="faturaIlce"
                          value={formData.faturaIlce}
                          onChange={handleInputChange}
                          disabled={!formData.faturaSehir}
                          className="w-full px-4 py-3 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-purple-dark disabled:opacity-60"
                        >
                          <option value="">{t("registration.selectOption")}</option>
                          {faturaDistricts.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-text mb-2">
                          {t("registration.openAddress")} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="faturaAdres"
                          value={formData.faturaAdres}
                          onChange={handleInputChange}
                          placeholder={t("registration.addressPlaceholder")}
                          className="w-full px-4 py-3 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-purple-dark"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-text mb-2">
                          {t("registration.postalCode")} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="faturaPostaKodu"
                          value={formData.faturaPostaKodu}
                          onChange={handlePostaKoduChange("faturaPostaKodu")}
                          placeholder="34000"
                          maxLength={5}
                          className={`w-full px-4 py-3 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-purple-dark ${
                            formData.faturaPostaKodu && !validatePostaKodu(formData.faturaPostaKodu).valid ? "border-2 border-red-500" : ""
                          }`}
                        />
                        {formData.faturaPostaKodu && !validatePostaKodu(formData.faturaPostaKodu).valid && (
                          <p className="text-red-500 text-xs mt-1">{validatePostaKodu(formData.faturaPostaKodu).message}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-text mb-2">
                          {t("registration.taxOffice")}
                        </label>
                        <input
                          type="text"
                          name="vergiDairesi"
                          value={formData.vergiDairesi}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-purple-dark"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-text mb-2">
                          {t("registration.taxNumber")}
                        </label>
                        <input
                          type="text"
                          name="vergiNo"
                          value={formData.vergiNo}
                          onChange={handleVergiNoChange}
                          placeholder="10 rakam"
                          maxLength={10}
                          className={`w-full px-4 py-3 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-purple-dark ${
                            formData.vergiNo && !validateVergiNo(formData.vergiNo).valid ? "border-2 border-red-500" : ""
                          }`}
                        />
                        {formData.vergiNo && !validateVergiNo(formData.vergiNo).valid && (
                          <p className="text-red-500 text-xs mt-1">{validateVergiNo(formData.vergiNo).message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-text mb-2">
                        {t("registration.idNumber")}
                      </label>
                      <input
                        type="text"
                        name="tcKimlik"
                        value={formData.tcKimlik}
                        onChange={handleTCKimlikChange}
                        placeholder="11 rakam"
                        maxLength={11}
                        className={`w-full px-4 py-3 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-purple-dark ${
                          formData.tcKimlik && !validateTCKimlik(formData.tcKimlik).valid ? "border-2 border-red-500" : ""
                        }`}
                      />
                      {formData.tcKimlik && !validateTCKimlik(formData.tcKimlik).valid && (
                        <p className="text-red-500 text-xs mt-1">{validateTCKimlik(formData.tcKimlik).message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-text mb-2">
                        {t("registration.contactPerson")}
                      </label>
                      <input
                        type="text"
                        name="ilgiliKisi"
                        value={formData.ilgiliKisi}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-purple-dark"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-text mb-2">
                        {t("registration.city")} <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="sahisFaturaSehir"
                        value={formData.sahisFaturaSehir}
                        onChange={handleSelectChange}
                        className="w-full px-4 py-3 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-purple-dark"
                      >
                        <option value="">{t("registration.selectOption")}</option>
                        {TURKEY_CITIES.map((city) => (
                          <option key={city.name} value={city.name}>
                            {city.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-text mb-2">
                        {t("registration.district")} <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="sahisFaturaIlce"
                        value={formData.sahisFaturaIlce}
                        onChange={handleInputChange}
                        disabled={!formData.sahisFaturaSehir}
                        className="w-full px-4 py-3 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-purple-dark disabled:opacity-60"
                      >
                        <option value="">{t("registration.selectOption")}</option>
                        {sahisDistricts.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-text mb-2">
                        {t("registration.openAddress")} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="sahisFaturaAdres"
                        value={formData.sahisFaturaAdres}
                        onChange={handleInputChange}
                        placeholder={t("registration.addressPlaceholder")}
                        className="w-full px-4 py-3 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-purple-dark"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-text mb-2">
                        {t("registration.postalCode")} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="sahisFaturaPostaKodu"
                        value={formData.sahisFaturaPostaKodu}
                        onChange={handlePostaKoduChange("sahisFaturaPostaKodu")}
                        placeholder="34000"
                        maxLength={5}
                        className={`w-full px-4 py-3 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-purple-dark ${
                          formData.sahisFaturaPostaKodu && !validatePostaKodu(formData.sahisFaturaPostaKodu).valid ? "border-2 border-red-500" : ""
                        }`}
                      />
                      {formData.sahisFaturaPostaKodu && !validatePostaKodu(formData.sahisFaturaPostaKodu).valid && (
                        <p className="text-red-500 text-xs mt-1">{validatePostaKodu(formData.sahisFaturaPostaKodu).message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-text mb-2">
                        {t("registration.email")}
                      </label>
                      <input
                        type="email"
                        name="sahisEposta"
                        value={formData.sahisEposta}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-purple-dark ${
                          formData.sahisEposta && !validateEmail(formData.sahisEposta).valid ? "border-2 border-red-500" : ""
                        }`}
                      />
                      {formData.sahisEposta && !validateEmail(formData.sahisEposta).valid && (
                        <p className="text-red-500 text-xs mt-1">{validateEmail(formData.sahisEposta).message}</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-8 text-xs text-gray-400 space-y-1">
                  <p>*{t("registration.invoiceDateNote")}</p>
                  <p>*{t("registration.invoiceProcessorNote")}</p>
                  <p>*{t("registration.paymentCollectorNote")}</p>
                </div>
              </div>
            )}

            {/* Step 4: Ödeme Yöntemi */}
            {currentStep === 4 && (
              <div className="bg-white rounded-xl p-8 shadow">
                <h3 className="text-2xl font-semibold text-gray-text text-center mb-8">
                  {t("registration.sectionPayment")}
                </h3>
                {!isCurrentStepValid() && (
                  <p className="text-center text-sm text-gray-500 mb-6">{t("registration.requiredFieldsHint")}</p>
                )}
                {/* Payment Method Toggle */}
                <div className="flex justify-center mb-8">
                  <div className="inline-flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setPaymentMethod("kredi")}
                      className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                        paymentMethod === "kredi"
                          ? "bg-white text-purple-dark shadow"
                          : "text-gray-text"
                      }`}
                    >
                      <Check className={`w-4 h-4 ${paymentMethod === "kredi" ? "text-purple-dark" : "text-transparent"}`} />
                      {t("registration.creditCard")}
                    </button>
                    <button
                      onClick={() => setPaymentMethod("havale")}
                      className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                        paymentMethod === "havale"
                          ? "bg-white text-purple-dark shadow"
                          : "text-gray-text"
                      }`}
                    >
                      <Check className={`w-4 h-4 ${paymentMethod === "havale" ? "text-purple-dark" : "text-transparent"}`} />
                      {t("registration.bankTransfer")}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Payment Form */}
                  <div>
                    {paymentMethod === "kredi" ? (
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-text mb-2">
                            {t("registration.cardNumber")} <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="kartNumarasi"
                            value={formData.kartNumarasi}
                            onChange={handleCardNumberChange}
                            placeholder="0000 0000 0000 0000"
                            maxLength={23}
                            inputMode="numeric"
                            autoComplete="cc-number"
                            className={`w-full px-4 py-3 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-purple-dark ${
                              formData.kartNumarasi && !validateCardNumber(formData.kartNumarasi).valid ? "border-2 border-red-500" : ""
                            }`}
                          />
                          {formData.kartNumarasi && !validateCardNumber(formData.kartNumarasi).valid && (
                            <p className="text-red-500 text-xs mt-1">{validateCardNumber(formData.kartNumarasi).message}</p>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-text mb-2">
                              {t("registration.cvc")} <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              name="cvc"
                              value={formData.cvc}
                              onChange={handleCVCChange}
                              placeholder="000"
                              maxLength={4}
                              inputMode="numeric"
                              autoComplete="cc-csc"
                              className={`w-full px-4 py-3 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-purple-dark ${
                                formData.cvc && !validateCvc(formData.cvc).valid ? "border-2 border-red-500" : ""
                              }`}
                            />
                            {formData.cvc && !validateCvc(formData.cvc).valid && (
                              <p className="text-red-500 text-xs mt-1">{validateCvc(formData.cvc).message}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-text mb-2">
                              {t("registration.expiryDate")} <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              name="sonKullanma"
                              value={formData.sonKullanma}
                              onChange={handleExpiryChange}
                              placeholder="MM/YY"
                              maxLength={5}
                              inputMode="numeric"
                              autoComplete="cc-exp"
                              className={`w-full px-4 py-3 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-purple-dark ${
                                formData.sonKullanma && !validateExpiry(formData.sonKullanma).valid ? "border-2 border-red-500" : ""
                              }`}
                            />
                            {formData.sonKullanma && !validateExpiry(formData.sonKullanma).valid && (
                              <p className="text-red-500 text-xs mt-1">{validateExpiry(formData.sonKullanma).message}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-3">ÖDEMELER İÇİN HESAP BİLGİLERİ:</h4>
                          <div className="space-y-2 text-sm">
                            <p><strong>BİG MEDYA TEKNOLOJİ A.Ş.</strong></p>
                            <p><strong>GARANTİ BANKASI</strong></p>
                            <p>ALTUNİZADE TİCARİ-341 6293874</p>
                          </div>
                        </div>
                        <div className="bg-gray-100 rounded-lg p-4">
                          <p className="text-lg font-mono text-purple-dark font-semibold">
                            TR03 0006 2000 3410 0006 2938 74
                          </p>
                        </div>
                        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 text-sm">
                          <p className="text-gray-700">
                            <strong>*</strong>Ödemenizi banka havalesi ve kredi kartı ile ödeme yapan katılımcıların imzalı başvuru formunu{" "}
                            <a href="mailto:uez2026@epsevent.com" className="text-blue-600 hover:underline">
                              uez2026@epsevent.com
                            </a>{" "}
                            adresine göndermelidir.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Order Summary */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                      {StepIcons.katilimTipi}
                      <span className="text-gray-text">{t("registration.participationType")}:</span>
                      <span className="text-orange-primary font-semibold ml-auto">
                        {getSelectedPackageData()?.title} {getSelectedPackageData()?.subtitle}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-text">{t("registration.amount")}:</span>
                      <span className="text-2xl font-bold text-purple-dark ml-auto">
                        {formatPriceWithCurrency(getSelectedPackageData()?.price)}
                      </span>
                    </div>
                    <div className="mt-4 p-4 rounded-lg border border-gray-200 bg-white text-left text-sm text-gray-600 space-y-3">
                      <p className="text-gray-700">{t("registration.paymentNote")}</p>
                      <p className="font-semibold text-gray-700 pt-2">{t("registration.contactFor")}</p>
                      <p className="font-medium text-purple-dark">{t("registration.contactCompany")}</p>
                      <p>{t("registration.contactTel")}</p>
                      <p>
                        <a href="mailto:uez2026@epsevent.com" className="text-orange-primary hover:underline">
                          {t("registration.contactEmail")}
                        </a>
                      </p>
                      <p className="break-words">{t("registration.contactAddress")}</p>
                      <p className="font-semibold text-gray-700 pt-2">{t("registration.cancelRefundTitle")}</p>
                      <ul className="list-disc list-inside space-y-1 pl-0">
                        <li>{t("registration.cancelRefund1")}</li>
                        <li>{t("registration.cancelRefund2")}</li>
                        <li>{t("registration.cancelRefund3")}</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Sözleşme / KVKK onayları ve Kaydı Tamamla */}
                <div className="mt-8 pt-8 border-t space-y-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="termsMesafeli"
                      checked={mesafeliVeIadeOnay}
                      onChange={(e) => setMesafeliVeIadeOnay(e.target.checked)}
                      className="mt-1 w-5 h-5 rounded border-gray-300 text-purple-dark focus:ring-purple-dark"
                    />
                    <label htmlFor="termsMesafeli" className="text-sm text-gray-text">
                      {t("registration.termsPrefix")}
                      <a
                        href="/mesafeli-satis-sozlesmesi/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-dark underline hover:text-purple-primary"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {t("registration.distanceSalesLink")}
                      </a>
                      {t("registration.termsAnd")}
                      <a
                        href="/teslimat-ve-iade-sartlari"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-dark underline hover:text-purple-primary"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {t("registration.cancelPolicyLink")}
                      </a>
                      {t("registration.termsSuffix")}
                      <span className="text-red-500">*</span>
                    </label>
                  </div>
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="consentAcikRiza"
                      checked={acikRizaOnay}
                      onChange={(e) => setAcikRizaOnay(e.target.checked)}
                      className="mt-1 w-5 h-5 rounded border-gray-300 text-purple-dark focus:ring-purple-dark"
                    />
                    <label htmlFor="consentAcikRiza" className="text-sm text-gray-text">
                      {t("registration.consentOpenRizaPrefix")}
                      <a
                        href="/acik-riza-metni/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-dark underline hover:text-purple-primary"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {t("registration.consentOpenRizaLink")}
                      </a>
                      {t("registration.consentMandatorySuffix")}
                      <span className="text-red-500">*</span>
                    </label>
                  </div>
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="consentAydinlatma"
                      checked={aydinlatmaMetniOnay}
                      onChange={(e) => setAydinlatmaMetniOnay(e.target.checked)}
                      className="mt-1 w-5 h-5 rounded border-gray-300 text-purple-dark focus:ring-purple-dark"
                    />
                    <label htmlFor="consentAydinlatma" className="text-sm text-gray-text">
                      {t("registration.consentPrivacyPrefix")}
                      <a
                        href="/aydinlatma-metni/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-dark underline hover:text-purple-primary"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {t("registration.consentPrivacyLink")}
                      </a>
                      {t("registration.consentMandatorySuffix")}
                      <span className="text-red-500">*</span>
                    </label>
                  </div>
                  <div className="flex justify-center">
                    <button
                      onClick={nextStep}
                      disabled={!isFormValid()}
                      className="px-8 py-3 rounded-lg bg-purple-dark text-white font-medium hover:bg-purple-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t("registration.goToSummary")}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Özet & Onay */}
            {currentStep === 5 && (
              <div className="bg-white rounded-xl p-8 shadow">
                <h3 className="text-2xl font-semibold text-gray-text text-center mb-8">
                  {t("registration.sectionSummary")}
                </h3>

                <div className="max-w-2xl mx-auto space-y-6">
                  {/* Paket */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-text mb-4">{t("registration.selectedPackage")}</h4>
                    <div className="flex justify-between items-center">
                      <span className="text-orange-primary font-semibold">
                        {getSelectedPackageData()?.title} {getSelectedPackageData()?.subtitle}
                      </span>
                      <span className="text-2xl font-bold text-purple-dark">
                        {formatPriceWithCurrency(getSelectedPackageData()?.price)}
                      </span>
                    </div>
                  </div>

                  {/* Katılımcı Bilgileri - tüm alanlar */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-text mb-4">{t("registration.participantDetails")}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div><span className="text-gray-400">{t("registration.fullNameLabel")}:</span> <span className="text-gray-text">{formData.adSoyad || "-"}</span></div>
                      <div><span className="text-gray-400">{t("registration.companyLabel")}:</span> <span className="text-gray-text">{formData.kurumAdi || "-"}</span></div>
                      <div><span className="text-gray-400">{t("registration.titleLabel")}:</span> <span className="text-gray-text">{formData.unvan || "-"}</span></div>
                      <div><span className="text-gray-400">{t("registration.companyAddressLabel")}:</span> <span className="text-gray-text">{formData.kurumAdresi || "-"}</span></div>
                      <div><span className="text-gray-400">{t("registration.phoneLabel")}:</span> <span className="text-gray-text">{formData.telefon || "-"}</span></div>
                      <div><span className="text-gray-400">{t("registration.emailLabel")}:</span> <span className="text-gray-text">{formData.eposta || "-"}</span></div>
                      <div><span className="text-gray-400">{t("registration.mobileLabel")}:</span> <span className="text-gray-text">{formData.ceptel || "-"}</span></div>
                    </div>
                  </div>

                  {/* Asistan (varsa) */}
                  {(formData.asistanAdSoyad || formData.asistanEposta || formData.asistanTelefon) && (
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h4 className="font-semibold text-gray-text mb-4">{t("registration.assistantDetails")}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div><span className="text-gray-400">{t("registration.fullNameLabel")}:</span> <span className="text-gray-text">{formData.asistanAdSoyad || "-"}</span></div>
                        <div><span className="text-gray-400">{t("registration.emailLabel")}:</span> <span className="text-gray-text">{formData.asistanEposta || "-"}</span></div>
                        <div><span className="text-gray-400">{t("registration.phoneLabel")}:</span> <span className="text-gray-text">{formData.asistanTelefon || "-"}</span></div>
                      </div>
                    </div>
                  )}

                  {/* İkinci Katılımcı (çift kişi varsa) */}
                  {selectedPackage === "cift-kisi" && (
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h4 className="font-semibold text-gray-text mb-4">{t("registration.secondParticipantLabel")}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div><span className="text-gray-400">{t("registration.fullNameLabel")}:</span> <span className="text-gray-text">{formData.adSoyad2 || "-"}</span></div>
                        <div><span className="text-gray-400">{t("registration.companyLabel")}:</span> <span className="text-gray-text">{formData.kurumAdi2 || "-"}</span></div>
                        <div><span className="text-gray-400">{t("registration.titleLabel")}:</span> <span className="text-gray-text">{formData.unvan2 || "-"}</span></div>
                        <div><span className="text-gray-400">{t("registration.companyAddressLabel")}:</span> <span className="text-gray-text">{formData.kurumAdresi2 || "-"}</span></div>
                        <div><span className="text-gray-400">{t("registration.phoneLabel")}:</span> <span className="text-gray-text">{formData.telefon2 || "-"}</span></div>
                        <div><span className="text-gray-400">{t("registration.emailLabel")}:</span> <span className="text-gray-text">{formData.eposta2 || "-"}</span></div>
                        <div><span className="text-gray-400">{t("registration.mobileLabel")}:</span> <span className="text-gray-text">{formData.ceptel2 || "-"}</span></div>
                      </div>
                    </div>
                  )}

                  {/* Fatura Bilgileri - tüm alanlar */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-text mb-4">{t("registration.invoiceDetails")}</h4>
                    <div className="space-y-3 text-sm">
                      <div><span className="text-gray-400">{t("registration.invoiceTypeLabel")}:</span> <span className="text-gray-text">{invoiceType === "firma" ? t("registration.invoiceTypeFirma") : t("registration.invoiceTypeSahis")}</span></div>
                      {invoiceType === "firma" ? (
                        <>
                          <div><span className="text-gray-400">{t("registration.eInvoiceLabel")}:</span> <span className="text-gray-text">{isEFatura ? t("registration.yes") : t("registration.no")}</span></div>
                          <div><span className="text-gray-400">{t("registration.companyTitleLabel")}:</span> <span className="text-gray-text">{formData.firmaUnvani || "-"}</span></div>
                          <div><span className="text-gray-400">{t("registration.eArchiveEmailLabel")}:</span> <span className="text-gray-text">{formData.eArsivEmail || "-"}</span></div>
                          <div><span className="text-gray-400">{t("registration.cityLabel")}:</span> <span className="text-gray-text">{formData.faturaSehir || "-"}</span></div>
                          <div><span className="text-gray-400">{t("registration.districtLabel")}:</span> <span className="text-gray-text">{formData.faturaIlce || "-"}</span></div>
                          <div><span className="text-gray-400">{t("registration.openAddressLabel")}:</span> <span className="text-gray-text">{formData.faturaAdres || "-"}</span></div>
                          <div><span className="text-gray-400">{t("registration.postalCodeLabel")}:</span> <span className="text-gray-text">{formData.faturaPostaKodu || "-"}</span></div>
                          <div><span className="text-gray-400">{t("registration.taxOfficeLabel")}:</span> <span className="text-gray-text">{formData.vergiDairesi || "-"}</span></div>
                          <div><span className="text-gray-400">{t("registration.taxNumberLabel")}:</span> <span className="text-gray-text">{formData.vergiNo || "-"}</span></div>
                        </>
                      ) : (
                        <>
                          <div><span className="text-gray-400">{t("registration.idNumberLabel")}:</span> <span className="text-gray-text">{formData.tcKimlik || "-"}</span></div>
                          <div><span className="text-gray-400">{t("registration.contactPersonLabel")}:</span> <span className="text-gray-text">{formData.ilgiliKisi || "-"}</span></div>
                          <div><span className="text-gray-400">{t("registration.cityLabel")}:</span> <span className="text-gray-text">{formData.sahisFaturaSehir || "-"}</span></div>
                          <div><span className="text-gray-400">{t("registration.districtLabel")}:</span> <span className="text-gray-text">{formData.sahisFaturaIlce || "-"}</span></div>
                          <div><span className="text-gray-400">{t("registration.openAddressLabel")}:</span> <span className="text-gray-text">{formData.sahisFaturaAdres || "-"}</span></div>
                          <div><span className="text-gray-400">{t("registration.postalCodeLabel")}:</span> <span className="text-gray-text">{formData.sahisFaturaPostaKodu || "-"}</span></div>
                          <div><span className="text-gray-400">{t("registration.emailLabel")}:</span> <span className="text-gray-text">{formData.sahisEposta || "-"}</span></div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Ödeme Yöntemi */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-text mb-4">{t("registration.paymentMethodLabel")}</h4>
                    <span className="text-orange-primary font-medium">
                      {paymentMethod === "kredi" ? t("registration.creditCard") : t("registration.bankTransfer")}
                    </span>
                  </div>

                  {/* Hata mesajı */}
                  {submitError && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                      {submitError}
                    </div>
                  )}

                  {/* Kaydı Onayla butonu */}
                  <div className="flex justify-center pt-4">
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="px-8 py-3 rounded-lg bg-purple-dark text-white font-medium hover:bg-purple-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="animate-spin">⏳</span>
                          {t("registration.sending")}
                        </>
                      ) : (
                        t("registration.confirmRegistration")
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-center mt-8">
              <div className="flex gap-4">
                {currentStep > 1 && (
                  <button
                    onClick={prevStep}
                    className="px-8 py-3 rounded-lg border-2 border-purple-dark text-purple-dark font-medium hover:bg-purple-dark hover:text-white transition-colors"
                  >
                    ← {t("registration.prev")}
                  </button>
                )}
                {currentStep < 5 && (
                  <button
                    onClick={nextStep}
                    disabled={!isCurrentStepValid()}
                    className="px-8 py-3 rounded-lg bg-purple-dark text-white font-medium hover:bg-purple-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t("registration.next")} →
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}







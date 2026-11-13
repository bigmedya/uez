import { useTranslation } from "react-i18next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState } from "react";
import { Upload, Loader2, CheckCircle2, XCircle, Check, Building2, Briefcase, Trophy, Users, FileText, Contact, Info } from "lucide-react";
import { STARS_OF_REGIONS_APPLICATION_CLOSED } from "@shared/formFlags";

// Step icons
const StepIcons = {
  sirketBilgileri: <Building2 className="w-6 h-6" />,
  isModeli: <Briefcase className="w-6 h-6" />,
  rekabet: <Trophy className="w-6 h-6" />,
  kurucu: <Users className="w-6 h-6" />,
  iletisim: <Contact className="w-6 h-6" />,
  ozetOnay: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="22,4 12,14.01 9,11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

const steps = [
  { id: 1, key: "step1", icon: "sirketBilgileri" },
  { id: 2, key: "step2", icon: "isModeli" },
  { id: 3, key: "step3", icon: "rekabet" },
  { id: 4, key: "step4", icon: "kurucu" },
  { id: 5, key: "step5", icon: "iletisim" },
  { id: 6, key: "step6", icon: "ozetOnay" },
];

export default function StarsOfRegions() {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    // Şirket bilgileri
    sirketAdi: "",
    kurulusYili: "",
    kisaTanim: "",
    webSitesi: "",
    musteriIhtiyaci: "",
    cozum: "",
    hedefKitle: "",
    isModeli: "",
    rekabetAvantaji: "",
    basarilar: "",
    rakipler: "",
    sermayeTuketmeHizi: "",
    kurucuOzgecmis: "",
    // Formu dolduran kişinin bilgileri
    adSoyad: "",
    telefon: "",
    unvan: "",
    eposta: "",
    firmaAdi: "",
    sirketAdresi: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (submitError) setSubmitError(null);
    if (submitSuccess) setSubmitSuccess(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setUploadedFile(null);
      setUploadError(null);
      return;
    }

    // Dosya boyutu kontrolü (8MB)
    if (file.size > 8 * 1024 * 1024) {
      setUploadError(t("starsOfRegions.fileSizeError"));
      setUploadedFile(null);
      e.target.value = "";
      return;
    }

    // Dosya tipi kontrolü
    const allowedTypes = [
      "application/pdf",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ];
    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    const isValidType =
      allowedTypes.includes(file.type) ||
      fileExtension === "pdf" ||
      fileExtension === "ppt" ||
      fileExtension === "pptx";

    if (!isValidType) {
      setUploadError(t("starsOfRegions.fileTypeError"));
      setUploadedFile(null);
      e.target.value = "";
      return;
    }

    setUploadedFile(file);
    setUploadError(null);
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const nextStep = () => {
    if (currentStep < 6) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        return (
          formData.sirketAdi.trim() !== "" &&
          formData.kurulusYili.trim() !== "" &&
          formData.kisaTanim.trim() !== "" &&
          formData.webSitesi.trim() !== ""
        );
      case 2:
        return (
          formData.musteriIhtiyaci.trim() !== "" &&
          formData.cozum.trim() !== "" &&
          formData.hedefKitle.trim() !== "" &&
          formData.isModeli.trim() !== ""
        );
      case 3:
        return (
          formData.rekabetAvantaji.trim() !== "" &&
          formData.basarilar.trim() !== "" &&
          formData.rakipler.trim() !== "" &&
          formData.sermayeTuketmeHizi.trim() !== ""
        );
      case 4:
        return (
          formData.kurucuOzgecmis.trim() !== "" &&
          uploadedFile !== null
        );
      case 5:
        return (
          formData.adSoyad.trim() !== "" &&
          formData.telefon.trim() !== "" &&
          formData.unvan.trim() !== "" &&
          formData.eposta.trim() !== "" &&
          isValidEmail(formData.eposta) &&
          formData.firmaAdi.trim() !== "" &&
          formData.sirketAdresi.trim() !== ""
        );
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    if (STARS_OF_REGIONS_APPLICATION_CLOSED) return;
    if (!isStepValid(6)) {
      setSubmitError(t("starsOfRegions.requiredFields"));
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      // Önce dosyayı yükle
      let fileUrl = "";
      if (uploadedFile) {
        const formDataFile = new FormData();
        formDataFile.append("file", uploadedFile);
        formDataFile.append("formType", "stars-of-regions");

        const uploadResponse = await fetch("/api/forms/upload", {
          method: "POST",
          body: formDataFile,
        });

        if (!uploadResponse.ok) {
          const uploadError = await uploadResponse.json();
          throw new Error(
            uploadError.error || t("starsOfRegions.uploadError")
          );
        }

        const uploadResult = await uploadResponse.json();
        fileUrl = uploadResult.fileUrl || "";
      }

      // Form verilerini gönder
      const response = await fetch("/api/forms/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          formType: "stars-of-regions",
          formName: t("starsOfRegions.infoFormTitle"),
          data: {
            ...formData,
            yatirimciSunumu: fileUrl,
            yatirimciSunumuDosyaAdi: uploadedFile?.name || "",
          },
        }),
      });

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        console.error("Response parse error:", parseError);
        throw new Error(t("starsOfRegions.invalidResponse"));
      }

      if (!response.ok) {
        console.error("Backend error:", result);
        throw new Error(result.error || t("starsOfRegions.submitError"));
      }

      console.log("Form submitted successfully:", result);

      // Formu sıfırla
      setFormData({
        sirketAdi: "",
        kurulusYili: "",
        kisaTanim: "",
        webSitesi: "",
        musteriIhtiyaci: "",
        cozum: "",
        hedefKitle: "",
        isModeli: "",
        rekabetAvantaji: "",
        basarilar: "",
        rakipler: "",
        sermayeTuketmeHizi: "",
        kurucuOzgecmis: "",
        adSoyad: "",
        telefon: "",
        unvan: "",
        eposta: "",
        firmaAdi: "",
        sirketAdresi: "",
      });
      setUploadedFile(null);
      setUploadError(null);
      const fileInput = document.getElementById(
        "yatirimciSunumu"
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      // Başa dön ve başarı mesajını göster
      setCurrentStep(1);
      setSubmitSuccess(true);

      // Başarı mesajını 5 saniye sonra kaldır
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 5000);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : t("starsOfRegions.submitError")
      );
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
      <main className="py-12 lg:py-16">
        <div className="relative">
          <div
            className={
              STARS_OF_REGIONS_APPLICATION_CLOSED
                ? "pointer-events-none select-none opacity-[0.38]"
                : ""
            }
          >
        <div className="container mx-auto px-4 lg:px-16">
          {/* Title */}
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-bold text-purple-dark mb-2">
              {t("starsOfRegions.pageTitle")}
            </h1>
            <h2 className="text-3xl lg:text-4xl font-light text-orange-primary italic">
              {t("starsOfRegions.formTitle")}
            </h2>
          </div>

          {/* Step Indicator */}
          <div className="flex justify-center mb-12">
            <div className="flex items-center gap-4 lg:gap-8 overflow-x-auto pb-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
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
                      {t("starsOfRegions." + step.key)}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-8 lg:w-16 h-0.5 mx-2 ${
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
          <div className="max-w-4xl mx-auto">
            {/* Success Message - shown on step 1 */}
            {currentStep === 1 && submitSuccess && (
              <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>{t("starsOfRegions.successMessage")}</span>
              </div>
            )}

            {/* Step 1: Şirket Bilgileri */}
            {currentStep === 1 && (
              <div className="bg-white rounded-xl p-8 shadow">
                <h3 className="text-2xl font-semibold text-gray-text text-center mb-8">
                  {t("starsOfRegions.sectionCompany")}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-text mb-2">
                      {t("starsOfRegions.companyName")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="sirketAdi"
                      value={formData.sirketAdi}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-purple-dark"
                      placeholder={t("starsOfRegions.companyNamePh")}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-text mb-2">
                      {t("starsOfRegions.foundingYear")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="kurulusYili"
                      value={formData.kurulusYili}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-purple-dark"
                      placeholder={t("starsOfRegions.foundingYearPh")}
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-text mb-2">
                    {t("starsOfRegions.shortDesc")} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="kisaTanim"
                    value={formData.kisaTanim}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-purple-dark resize-none"
                    placeholder={t("starsOfRegions.shortDescPh")}
                  />
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-text mb-2">
                    {t("starsOfRegions.website")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    name="webSitesi"
                    value={formData.webSitesi}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-purple-dark"
                    placeholder={t("starsOfRegions.websitePhFull")}
                  />
                </div>
              </div>
            )}

            {/* Step 2: İş Modeli */}
            {currentStep === 2 && (
              <div className="bg-white rounded-xl p-8 shadow">
                <h3 className="text-2xl font-semibold text-gray-text text-center mb-8">
                  {t("starsOfRegions.sectionStep2Title")}
                </h3>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-text mb-2">
                      {t("starsOfRegions.customerNeed")} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="musteriIhtiyaci"
                      value={formData.musteriIhtiyaci}
                      onChange={handleInputChange}
                      required
                      rows={4}
                      className="w-full px-4 py-3 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-purple-dark resize-none"
                      placeholder={t("starsOfRegions.customerNeedPh")}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-text mb-2">
                      {t("starsOfRegions.solutionLabel")} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="cozum"
                      value={formData.cozum}
                      onChange={handleInputChange}
                      required
                      rows={4}
                      className="w-full px-4 py-3 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-purple-dark resize-none"
                      placeholder={t("starsOfRegions.solutionPh")}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-text mb-2">
                      {t("starsOfRegions.targetAudience")} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="hedefKitle"
                      value={formData.hedefKitle}
                      onChange={handleInputChange}
                      required
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-purple-dark resize-none"
                      placeholder={t("starsOfRegions.targetAudiencePh")}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-text mb-2">
                      {t("starsOfRegions.businessModel")} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="isModeli"
                      value={formData.isModeli}
                      onChange={handleInputChange}
                      required
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-purple-dark resize-none"
                      placeholder={t("starsOfRegions.businessModelPh")}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Rekabet & Başarılar */}
            {currentStep === 3 && (
              <div className="bg-white rounded-xl p-8 shadow">
                <h3 className="text-2xl font-semibold text-gray-text text-center mb-8">
                  {t("starsOfRegions.sectionStep3Title")}
                </h3>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-text mb-2">
                      {t("starsOfRegions.competitiveAdvantage")} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="rekabetAvantaji"
                      value={formData.rekabetAvantaji}
                      onChange={handleInputChange}
                      required
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-purple-dark resize-none"
                      placeholder={t("starsOfRegions.competitiveAdvantagePh")}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-text mb-2">
                      {t("starsOfRegions.achievementsLabelLong")} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="basarilar"
                      value={formData.basarilar}
                      onChange={handleInputChange}
                      required
                      rows={4}
                      className="w-full px-4 py-3 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-purple-dark resize-none"
                      placeholder={t("starsOfRegions.achievementsPhLong")}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-text mb-2">
                      {t("starsOfRegions.competitorsLabelLong")} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="rakipler"
                      value={formData.rakipler}
                      onChange={handleInputChange}
                      required
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-purple-dark resize-none"
                      placeholder={t("starsOfRegions.competitorsPhLong")}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-text mb-2">
                      {t("starsOfRegions.burnRateLabelLong")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="sermayeTuketmeHizi"
                      value={formData.sermayeTuketmeHizi}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-purple-dark"
                      placeholder={t("starsOfRegions.burnRatePhLong")}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Kurucu & Dosya */}
            {currentStep === 4 && (
              <div className="bg-white rounded-xl p-8 shadow">
                <h3 className="text-2xl font-semibold text-gray-text text-center mb-8">
                  {t("starsOfRegions.sectionStep4Title")}
                </h3>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-text mb-2">
                      {t("starsOfRegions.founderBioLabelLong")} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="kurucuOzgecmis"
                      value={formData.kurucuOzgecmis}
                      onChange={handleInputChange}
                      required
                      rows={5}
                      className="w-full px-4 py-3 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-purple-dark resize-none"
                      placeholder={t("starsOfRegions.founderBioPhLong")}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-text mb-2">
                      {t("starsOfRegions.investorDeckLabel")} <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-2">
                      <label
                        htmlFor="yatirimciSunumu"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-10 h-10 mb-3 text-gray-400" />
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">{t("starsOfRegions.fileClickHint")}</span>{" "}
                            {t("starsOfRegions.fileDragHint")}
                          </p>
                          <p className="text-xs text-gray-500">
                            {t("starsOfRegions.fileMaxHint")}
                          </p>
                        </div>
                        <input
                          id="yatirimciSunumu"
                          type="file"
                          className="hidden"
                          accept=".pdf,.ppt,.pptx,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                          onChange={handleFileChange}
                        />
                      </label>
                      {uploadedFile && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                          <span className="text-sm text-green-700">
                            {uploadedFile.name}
                          </span>
                        </div>
                      )}
                      {uploadError && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                          {uploadError}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: İletişim Bilgileri */}
            {currentStep === 5 && (
              <div className="bg-white rounded-xl p-8 shadow">
                <h3 className="text-2xl font-semibold text-gray-text text-center mb-8">
                  {t("starsOfRegions.sectionStep5Title")}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-text mb-2">
                      {t("starsOfRegions.fullName")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="adSoyad"
                      value={formData.adSoyad}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-purple-dark"
                      placeholder={t("starsOfRegions.fullNamePh")}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-text mb-2">
                      {t("starsOfRegions.phone")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="telefon"
                      value={formData.telefon}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-purple-dark"
                      placeholder={t("starsOfRegions.phonePh")}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-text mb-2">
                      {t("starsOfRegions.titleLabel")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="unvan"
                      value={formData.unvan}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-purple-dark"
                      placeholder={t("starsOfRegions.titlePh")}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-text mb-2">
                      {t("starsOfRegions.email")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="eposta"
                      value={formData.eposta}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-4 py-3 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-purple-dark ${
                        formData.eposta &&
                        !isValidEmail(formData.eposta)
                          ? "border-2 border-red-500"
                          : ""
                      }`}
                      placeholder={t("starsOfRegions.emailPh")}
                    />
                    {formData.eposta && !isValidEmail(formData.eposta) && (
                      <p className="text-red-500 text-xs mt-1">
                        {t("starsOfRegions.validEmailError")}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-text mb-2">
                      {t("starsOfRegions.firmName")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="firmaAdi"
                      value={formData.firmaAdi}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-purple-dark"
                      placeholder={t("starsOfRegions.firmNamePh")}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-text mb-2">
                      {t("starsOfRegions.companyAddress")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="sirketAdresi"
                      value={formData.sirketAdresi}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-purple-dark"
                      placeholder={t("starsOfRegions.companyAddressPh")}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 6: Özet & Onay */}
            {currentStep === 6 && (
              <div className="bg-white rounded-xl p-8 shadow">
                <h3 className="text-2xl font-semibold text-gray-text text-center mb-8">
                  {t("starsOfRegions.sectionStep6Title")}
                </h3>

                <div className="max-w-2xl mx-auto space-y-6">
                  {/* Şirket Özeti */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-text mb-4">{t("starsOfRegions.sectionCompany")}</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-400">{t("starsOfRegions.companyNameLabel")}:</span>
                        <span className="ml-2 text-gray-text">{formData.sirketAdi || "-"}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">{t("starsOfRegions.foundingYearLabel")}:</span>
                        <span className="ml-2 text-gray-text">{formData.kurulusYili || "-"}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">{t("starsOfRegions.websiteLabel")}:</span>
                        <span className="ml-2 text-gray-text">{formData.webSitesi || "-"}</span>
                      </div>
                    </div>
                  </div>

                  {/* İletişim Özeti */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-text mb-4">{t("starsOfRegions.contactInfo")}</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-400">{t("starsOfRegions.fullNameLabel")}:</span>
                        <span className="ml-2 text-gray-text">{formData.adSoyad || "-"}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">{t("starsOfRegions.emailLabel")}:</span>
                        <span className="ml-2 text-gray-text">{formData.eposta || "-"}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">{t("starsOfRegions.phoneLabel")}:</span>
                        <span className="ml-2 text-gray-text">{formData.telefon || "-"}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">{t("starsOfRegions.firmNameLabel")}:</span>
                        <span className="ml-2 text-gray-text">{formData.firmaAdi || "-"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Dosya Özeti */}
                  {uploadedFile && (
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h4 className="font-semibold text-gray-text mb-4">{t("starsOfRegions.investorDeckSummary")}</h4>
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-text">{uploadedFile.name}</span>
                      </div>
                    </div>
                  )}

                  {/* Error Message */}
                  {submitError && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                      {submitError}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-center mt-8">
              <div className="flex gap-4">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    disabled={STARS_OF_REGIONS_APPLICATION_CLOSED}
                    className="px-8 py-3 rounded-lg border-2 border-purple-dark text-purple-dark font-medium hover:bg-purple-dark hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ← {t("starsOfRegions.prev")}
                  </button>
                )}
                <button
                  type="button"
                  onClick={currentStep === 6 ? handleSubmit : nextStep}
                  disabled={
                    STARS_OF_REGIONS_APPLICATION_CLOSED ||
                    !isStepValid(currentStep) ||
                    isSubmitting
                  }
                  className="px-8 py-3 rounded-lg bg-purple-dark text-white font-medium hover:bg-purple-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t("starsOfRegions.sending")}
                    </>
                  ) : currentStep === 6 ? (
                    t("starsOfRegions.submitComplete")
                  ) : (
                    t("starsOfRegions.continueBtn") + " →"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
          </div>
          {STARS_OF_REGIONS_APPLICATION_CLOSED && (
            <div
              className="absolute inset-0 z-50 flex items-center justify-center p-4 sm:p-8 pointer-events-auto"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="sor-closed-title"
              aria-describedby="sor-closed-desc"
            >
              <div className="relative w-full max-w-2xl rounded-2xl border border-purple-100 bg-white px-5 py-9 sm:px-10 sm:py-11 shadow-[0_20px_50px_-12px_rgba(88,28,135,0.18)]">
                <h2
                  id="sor-closed-title"
                  className="flex flex-nowrap items-center justify-center gap-2 sm:gap-2.5 whitespace-nowrap text-center text-[clamp(0.9375rem,3.2vw,1.5rem)] font-bold leading-none text-purple-dark"
                >
                  <span
                    className="inline-flex h-9 w-9 shrink-0 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-purple-50 text-purple-primary ring-1 ring-purple-100"
                    aria-hidden
                  >
                    <Info className="h-[18px] w-[18px] sm:h-5 sm:w-5 stroke-[2.25]" />
                  </span>
                  <span>{t("starsOfRegions.applicationClosedTitle")}</span>
                </h2>
                <p
                  id="sor-closed-desc"
                  className="mt-3 text-center text-[15px] sm:text-base text-gray-text leading-snug sm:leading-relaxed"
                >
                  {t("starsOfRegions.applicationClosedMessage")}
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

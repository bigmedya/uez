import { useState, useEffect } from "react";
import { X, Save, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { TURKEY_CITIES } from "@/data/turkey-cities-districts";
import { usePackages } from "@/hooks/usePackages";
import {
  formatPhone,
  formatTCKimlik,
  formatVergiNo,
  formatPostaKodu,
  validatePhone,
  validatePostaKodu,
  validateEmail,
} from "@/utils/registrationFormatters";

/** Çift kişi paketi bu slug ile eşleşir */
const PACKAGE_CIFT_KISI_ID = "cift-kisi";

/** Slug okunaklı etiket: gunubirlik-paket-2 → "Gunubirlik paket 2" (aynı başlıklı paketleri ayırt etmek için) */
function packageSlugLabel(packageId: string): string {
  const parts = packageId.split("-").filter(Boolean);
  if (parts.length === 0) return packageId;
  const s = parts.join(" ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Kayıt listesinde tam başlık: API başlığı + slug etiketi (karışmasın) */
function buildAdminPackageRecordTitle(packageId: string, title: string, subtitle: string | undefined): string {
  const slugPart = packageSlugLabel(packageId);
  const t = title.trim();
  const sub = subtitle?.trim();
  if (t && sub) return `${t} — ${sub} · ${slugPart}`;
  if (t) return `${t} · ${slugPart}`;
  return slugPart;
}

interface AdminCreateRegistrationProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AdminCreateRegistration({
  isOpen,
  onClose,
  onSuccess,
}: AdminCreateRegistrationProps) {
  const { packages, isLoading: loadingPackages } = usePackages({ activeOnly: true });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  /** Liste / Excel ile uyumlu; paket tanımındaki fiyat kullanılmaz */
  const [packagePriceManual, setPackagePriceManual] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"havale" | "mailorder">("havale");
  /** Liste ve rozetlerle uyumlu: success = onaylandı, pending = beklemede */
  const [paymentStatusChoice, setPaymentStatusChoice] = useState<"success" | "pending">("pending");
  const [invoiceType, setInvoiceType] = useState<"firma" | "sahis">("firma");
  const [isEFatura, setIsEFatura] = useState(false);

  const labelClass = "mb-0.5 block text-xs font-medium text-gray-600";
  const fieldClass =
    "w-full rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-purple-primary focus:outline-none focus:ring-1 focus:ring-purple-primary";

  const [formData, setFormData] = useState({
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

  const emptyForm = () => ({
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

  useEffect(() => {
    if (!isOpen) {
      setFormData(emptyForm());
      setSelectedPackage(null);
      setPackagePriceManual("");
      setPaymentMethod("havale");
      setPaymentStatusChoice("pending");
      setInvoiceType("firma");
      setIsEFatura(false);
      setSubmitError(null);
    }
  }, [isOpen]);

  /** Paket çift kişi değilse 2. katılımcı alanlarını temizle */
  useEffect(() => {
    if (selectedPackage !== PACKAGE_CIFT_KISI_ID) {
      setFormData((prev) => ({
        ...prev,
        adSoyad2: "",
        kurumAdi2: "",
        unvan2: "",
        kurumAdresi2: "",
        telefon2: "",
        eposta2: "",
        ceptel2: "",
      }));
    }
  }, [selectedPackage]);

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

  const faturaDistricts = TURKEY_CITIES.find((c) => c.name === formData.faturaSehir)?.districts ?? [];
  const sahisDistricts = TURKEY_CITIES.find((c) => c.name === formData.sahisFaturaSehir)?.districts ?? [];

  const selectedPackageData = packages?.find((p) => p.packageId === selectedPackage);
  const showSecondParticipant = selectedPackage === PACKAGE_CIFT_KISI_ID;

  const validateForm = (): string | null => {
    if (!selectedPackage) return "Paket seçimi yapılmalıdır.";
    if (!packagePriceManual.trim()) return "Paket fiyatı girilmelidir.";
    if (!formData.adSoyad.trim()) return "Ad Soyad zorunludur.";

    if (formData.telefon.trim() && !validatePhone(formData.telefon).valid) {
      return validatePhone(formData.telefon).message;
    }
    if (formData.ceptel.trim() && !validatePhone(formData.ceptel).valid) {
      return validatePhone(formData.ceptel).message;
    }
    if (formData.eposta.trim() && !validateEmail(formData.eposta).valid) {
      return validateEmail(formData.eposta).message;
    }

    if (formData.asistanEposta.trim() && !validateEmail(formData.asistanEposta).valid) {
      return validateEmail(formData.asistanEposta).message;
    }
    if (formData.asistanTelefon.trim() && !validatePhone(formData.asistanTelefon).valid) {
      return validatePhone(formData.asistanTelefon).message;
    }

    if (showSecondParticipant) {
      if (formData.eposta2.trim() && !validateEmail(formData.eposta2).valid) {
        return validateEmail(formData.eposta2).message;
      }
      if (formData.telefon2.trim() && !validatePhone(formData.telefon2).valid) {
        return validatePhone(formData.telefon2).message;
      }
      if (formData.ceptel2.trim() && !validatePhone(formData.ceptel2).valid) {
        return validatePhone(formData.ceptel2).message;
      }
    }

    if (formData.faturaPostaKodu.trim() && !validatePostaKodu(formData.faturaPostaKodu).valid) {
      return validatePostaKodu(formData.faturaPostaKodu).message;
    }
    if (formData.sahisFaturaPostaKodu.trim() && !validatePostaKodu(formData.sahisFaturaPostaKodu).valid) {
      return validatePostaKodu(formData.sahisFaturaPostaKodu).message;
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const base = { ...formData };
      if (!showSecondParticipant) {
        base.adSoyad2 = "";
        base.kurumAdi2 = "";
        base.unvan2 = "";
        base.kurumAdresi2 = "";
        base.telefon2 = "";
        base.eposta2 = "";
        base.ceptel2 = "";
      }

      const submitData = {
        ...base,
        packageId: selectedPackage,
        packageTitle: selectedPackage
          ? buildAdminPackageRecordTitle(
              selectedPackage,
              selectedPackageData?.title ?? "",
              selectedPackageData?.subtitle
            )
          : "",
        packageSubtitle: selectedPackageData?.subtitle || "",
        packagePrice: packagePriceManual.trim(),
        paymentMethod,
        paymentStatus: paymentStatusChoice,
        invoiceType,
        isEFatura,
      };

      const response = await fetch("/api/forms/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          formType: "kayit",
          formName: "Admin Kayıt",
          data: submitData,
        }),
      });

      if (!response.ok) {
        throw new Error("Kayıt oluşturulurken bir hata oluştu.");
      }

      onSuccess();
      onClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Bir hata oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
      <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-lg bg-white shadow-lg xl:max-w-7xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h2 className="text-base font-semibold text-gray-800">Yeni Sipariş Oluştur</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-5 p-4">
            {submitError && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{submitError}</div>
            )}

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-800">Paket seçimi</h3>

              {loadingPackages ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-purple-primary" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  {packages?.map((pkg) => (
                    <button
                      type="button"
                      key={pkg.id}
                      className={cn(
                        "cursor-pointer rounded-lg border p-2 text-left transition-all",
                        selectedPackage === pkg.packageId
                          ? "border-purple-primary bg-purple-50 ring-1 ring-purple-primary"
                          : "border-gray-200 hover:border-purple-200"
                      )}
                      onClick={() => setSelectedPackage(pkg.packageId)}
                    >
                      <p className="text-xs font-semibold leading-snug text-gray-900 sm:text-sm break-words">{pkg.title}</p>
                      {pkg.subtitle ? (
                        <p className="mt-0.5 text-[10px] leading-snug text-gray-600 sm:text-xs break-words">{pkg.subtitle}</p>
                      ) : null}
                      <p className="mt-0.5 text-[10px] leading-tight text-gray-500 sm:text-[11px] break-words">
                        {packageSlugLabel(pkg.packageId)}
                      </p>
                      {pkg.features?.length ? (
                        <ul className="mt-0.5 space-y-0.5 border-t border-gray-100 pt-0.5">
                          {pkg.features.slice(0, 2).map((f, i) => (
                            <li key={i} className="flex gap-0.5 text-[10px] leading-snug text-gray-600">
                              <Check className="mt-0.5 h-2.5 w-2.5 shrink-0 text-orange-primary" />
                              <span className="line-clamp-2">{f}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </button>
                  ))}
                </div>
              )}

              <div className="max-w-md">
                <label className={labelClass}>Paket fiyatı *</label>
                <input
                  type="text"
                  name="packagePriceManual"
                  value={packagePriceManual}
                  onChange={(e) => setPackagePriceManual(e.target.value)}
                  placeholder="örn. 75.000 TL"
                  className={fieldClass}
                  autoComplete="off"
                />
                <p className="mt-1 text-[11px] text-gray-500">Tutarı elle girin; kayıt listesinde bu değer kullanılır.</p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-800">Ödeme yöntemi</h3>
                <div className="grid grid-cols-2 gap-2">
                  {(["havale", "mailorder"] as const).map((method) => (
                    <button
                      type="button"
                      key={method}
                      className={cn(
                        "rounded-md border py-1.5 text-center text-sm font-medium transition-all",
                        paymentMethod === method
                          ? "border-purple-primary bg-purple-50 text-purple-dark"
                          : "border-gray-200 text-gray-700 hover:border-purple-200"
                      )}
                      onClick={() => setPaymentMethod(method)}
                    >
                      {method === "havale" ? "Havale" : "Mail order"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-800">Durum</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className={cn(
                      "rounded-md border py-1.5 text-center text-sm font-medium transition-all",
                      paymentStatusChoice === "pending"
                        ? "border-amber-500 bg-amber-50 text-amber-900"
                        : "border-gray-200 text-gray-700 hover:border-amber-200"
                    )}
                    onClick={() => setPaymentStatusChoice("pending")}
                  >
                    Beklemede
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "rounded-md border py-1.5 text-center text-sm font-medium transition-all",
                      paymentStatusChoice === "success"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                        : "border-gray-200 text-gray-700 hover:border-emerald-200"
                    )}
                    onClick={() => setPaymentStatusChoice("success")}
                  >
                    Onaylandı
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-800">Katılımcı bilgileri</h3>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className={labelClass}>Ad Soyad *</label>
                  <input
                    type="text"
                    name="adSoyad"
                    value={formData.adSoyad}
                    onChange={handleInputChange}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Kurum adı</label>
                  <input
                    type="text"
                    name="kurumAdi"
                    value={formData.kurumAdi}
                    onChange={handleInputChange}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Ünvan</label>
                  <input type="text" name="unvan" value={formData.unvan} onChange={handleInputChange} className={fieldClass} />
                </div>
                <div>
                  <label className={labelClass}>Telefon</label>
                  <input
                    type="text"
                    name="telefon"
                    value={formData.telefon}
                    onChange={handlePhoneChange("telefon")}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>E-posta</label>
                  <input
                    type="email"
                    name="eposta"
                    value={formData.eposta}
                    onChange={handleInputChange}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Cep telefonu</label>
                  <input
                    type="text"
                    name="ceptel"
                    value={formData.ceptel}
                    onChange={handlePhoneChange("ceptel")}
                    className={fieldClass}
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className={labelClass}>Kurum adresi</label>
                  <input
                    type="text"
                    name="kurumAdresi"
                    value={formData.kurumAdresi}
                    onChange={handleInputChange}
                    className={fieldClass}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2 border-t border-gray-100 pt-3">
              <h4 className="text-xs font-semibold text-gray-700">Asistan bilgileri (isteğe bağlı)</h4>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className={labelClass}>Ad soyad</label>
                  <input
                    type="text"
                    name="asistanAdSoyad"
                    value={formData.asistanAdSoyad}
                    onChange={handleInputChange}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>E-posta</label>
                  <input
                    type="email"
                    name="asistanEposta"
                    value={formData.asistanEposta}
                    onChange={handleInputChange}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Telefon</label>
                  <input
                    type="text"
                    name="asistanTelefon"
                    value={formData.asistanTelefon}
                    onChange={handlePhoneChange("asistanTelefon")}
                    className={fieldClass}
                  />
                </div>
              </div>
            </div>

            {showSecondParticipant ? (
              <div className="space-y-2 border-t border-gray-100 pt-3">
                <h4 className="text-xs font-semibold text-gray-700">İkinci katılımcı (çift kişi paketi — isteğe bağlı)</h4>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className={labelClass}>Ad soyad</label>
                    <input type="text" name="adSoyad2" value={formData.adSoyad2} onChange={handleInputChange} className={fieldClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Kurum adı</label>
                    <input type="text" name="kurumAdi2" value={formData.kurumAdi2} onChange={handleInputChange} className={fieldClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Ünvan</label>
                    <input type="text" name="unvan2" value={formData.unvan2} onChange={handleInputChange} className={fieldClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Telefon</label>
                    <input
                      type="text"
                      name="telefon2"
                      value={formData.telefon2}
                      onChange={handlePhoneChange("telefon2")}
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>E-posta</label>
                    <input type="email" name="eposta2" value={formData.eposta2} onChange={handleInputChange} className={fieldClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Cep telefonu</label>
                    <input
                      type="text"
                      name="ceptel2"
                      value={formData.ceptel2}
                      onChange={handlePhoneChange("ceptel2")}
                      className={fieldClass}
                    />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className={labelClass}>Kurum adresi</label>
                    <input
                      type="text"
                      name="kurumAdresi2"
                      value={formData.kurumAdresi2}
                      onChange={handleInputChange}
                      className={fieldClass}
                    />
                  </div>
                </div>
              </div>
            ) : null}

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-800">Fatura bilgileri (isteğe bağlı)</h3>

              <div className="flex flex-wrap gap-3 text-sm">
                <label className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    name="invoiceType"
                    value="firma"
                    checked={invoiceType === "firma"}
                    onChange={(e) => setInvoiceType(e.target.value as "firma" | "sahis")}
                    className="text-purple-primary"
                  />
                  Firma
                </label>
                <label className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    name="invoiceType"
                    value="sahis"
                    checked={invoiceType === "sahis"}
                    onChange={(e) => setInvoiceType(e.target.value as "firma" | "sahis")}
                    className="text-purple-primary"
                  />
                  Şahıs
                </label>
                <label className="flex items-center gap-1.5">
                  <input type="checkbox" checked={isEFatura} onChange={(e) => setIsEFatura(e.target.checked)} className="rounded" />
                  E-Fatura
                </label>
              </div>

              {invoiceType === "firma" ? (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className={labelClass}>Firma ünvanı</label>
                    <input type="text" name="firmaUnvani" value={formData.firmaUnvani} onChange={handleInputChange} className={fieldClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Vergi dairesi</label>
                    <input type="text" name="vergiDairesi" value={formData.vergiDairesi} onChange={handleInputChange} className={fieldClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Vergi no</label>
                    <input type="text" name="vergiNo" value={formData.vergiNo} onChange={handleVergiNoChange} className={fieldClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Fatura şehri</label>
                    <select name="faturaSehir" value={formData.faturaSehir} onChange={handleSelectChange} className={fieldClass}>
                      <option value="">Şehir</option>
                      {TURKEY_CITIES.map((city) => (
                        <option key={city.name} value={city.name}>
                          {city.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Fatura ilçesi</label>
                    <select
                      name="faturaIlce"
                      value={formData.faturaIlce}
                      onChange={handleInputChange}
                      className={fieldClass}
                      disabled={!formData.faturaSehir}
                    >
                      <option value="">İlçe</option>
                      {faturaDistricts.map((district) => (
                        <option key={district} value={district}>
                          {district}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Posta kodu</label>
                    <input
                      type="text"
                      name="faturaPostaKodu"
                      value={formData.faturaPostaKodu}
                      onChange={handlePostaKoduChange("faturaPostaKodu")}
                      className={fieldClass}
                    />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className={labelClass}>Fatura adresi</label>
                    <input type="text" name="faturaAdres" value={formData.faturaAdres} onChange={handleInputChange} className={fieldClass} />
                  </div>
                  {isEFatura ? (
                    <div>
                      <label className={labelClass}>e-Arşiv e-posta</label>
                      <input type="email" name="eArsivEmail" value={formData.eArsivEmail} onChange={handleInputChange} className={fieldClass} />
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className={labelClass}>TC kimlik</label>
                    <input type="text" name="tcKimlik" value={formData.tcKimlik} onChange={handleTCKimlikChange} className={fieldClass} />
                  </div>
                  <div>
                    <label className={labelClass}>İlgili kişi</label>
                    <input type="text" name="ilgiliKisi" value={formData.ilgiliKisi} onChange={handleInputChange} className={fieldClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Şehir</label>
                    <select
                      name="sahisFaturaSehir"
                      value={formData.sahisFaturaSehir}
                      onChange={handleSelectChange}
                      className={fieldClass}
                    >
                      <option value="">Şehir</option>
                      {TURKEY_CITIES.map((city) => (
                        <option key={city.name} value={city.name}>
                          {city.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>İlçe</label>
                    <select
                      name="sahisFaturaIlce"
                      value={formData.sahisFaturaIlce}
                      onChange={handleInputChange}
                      className={fieldClass}
                      disabled={!formData.sahisFaturaSehir}
                    >
                      <option value="">İlçe</option>
                      {sahisDistricts.map((district) => (
                        <option key={district} value={district}>
                          {district}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Posta kodu</label>
                    <input
                      type="text"
                      name="sahisFaturaPostaKodu"
                      value={formData.sahisFaturaPostaKodu}
                      onChange={handlePostaKoduChange("sahisFaturaPostaKodu")}
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Şahıs e-posta</label>
                    <input type="email" name="sahisEposta" value={formData.sahisEposta} onChange={handleInputChange} className={fieldClass} />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className={labelClass}>Adres</label>
                    <input
                      type="text"
                      name="sahisFaturaAdres"
                      value={formData.sahisFaturaAdres}
                      onChange={handleInputChange}
                      className={fieldClass}
                    />
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>

        <div className="flex flex-col gap-2 border-t border-gray-200 bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 text-xs text-gray-600">
            {selectedPackage && selectedPackageData ? (
              <>
                Paket:{" "}
                <span className="font-medium text-gray-800">
                  {buildAdminPackageRecordTitle(selectedPackage, selectedPackageData.title, selectedPackageData.subtitle)}
                </span>
                {packagePriceManual.trim() ? (
                  <>
                    <span className="text-gray-400"> · </span>
                    <span className="font-medium text-gray-800">{packagePriceManual.trim()}</span>
                  </>
                ) : null}
              </>
            ) : (
              "Paket seçin"
            )}
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-white"
              disabled={isSubmitting}
            >
              İptal
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-md bg-purple-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Kaydediliyor
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  Kaydet
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

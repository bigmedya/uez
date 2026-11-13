import { useTranslation } from "react-i18next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState } from "react";
import { MapPin, Phone, Mail, Clock, Megaphone, Send, Loader2 } from "lucide-react";
import { useContact } from "@/hooks/useContact";

export default function Contact() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith("en") ? "en" : "tr";
  const { data, isLoading } = useContact(locale);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formStartTime] = useState(Date.now()); // Form başlangıç zamanı (spam koruması için)
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear errors when user types
    if (submitError) setSubmitError(null);
    if (submitSuccess) setSubmitSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const response = await fetch("/api/contact/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          website: "", // Honeypot alanı (boş kalmalı)
          formStartTime: formStartTime.toString(), // Form başlangıç zamanı
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t("contact.errorMessage"));
      }

      setSubmitSuccess(true);
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
      
      // Clear success message after 5 seconds
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : t("contact.errorMessage"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "location": return MapPin;
      case "phone": return Phone;
      case "email": return Mail;
      case "clock": return Clock;
      case "press": return Megaphone;
      default: return MapPin;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-purple-dark">
        <Loader2 className="w-12 h-12 animate-spin text-white" />
      </div>
    );
  }

  const hero = data?.hero;
  const infoSection = data?.infoSection;
  const contactCards = data?.contactCards?.sort((a, b) => a.order - b.order) || [];
  const formSection = data?.formSection;
  const mapSection = data?.mapSection;

  return (
    <div className="min-h-screen">
      {/* Header with purple background */}
      <div className="relative bg-purple-dark">
        <Header />
      </div>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-purple-dark via-purple-primary to-purple-dark py-20 lg:py-28">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="container mx-auto px-8 lg:px-16 text-center relative z-10">
          <h1 className="text-5xl lg:text-7xl font-bold text-white mb-4">
            {hero?.title || t("contact.titleFallback")}
          </h1>
          {hero?.subtitle && (
            <p className="text-xl lg:text-2xl text-purple-accent max-w-3xl mx-auto">
              {hero.subtitle}
            </p>
          )}
        </div>
      </section>

      {/* Main Content */}
      <main className="bg-white py-16 lg:py-24">
        <div className="container mx-auto px-8 lg:px-16">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 max-w-6xl mx-auto">
            
            {/* Contact Info */}
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl lg:text-4xl font-semibold text-purple-dark mb-6">
                  {infoSection?.title || t("contact.infoTitle")}
                </h2>
                {infoSection?.description && (
                  <p className="text-gray-text text-lg leading-relaxed mb-8">
                    {infoSection.description}
                  </p>
                )}
              </div>

              {/* Contact Cards */}
              <div className="space-y-6">
                {contactCards
                  .filter((card) => card.icon !== "phone")
                  .map((card) => {
                    const Icon = getIcon(card.icon);
                    const bgColor = card.color === "purple" ? "bg-purple-primary" : "bg-orange-primary";
                    
                    return (
                      <div key={card.id} className="flex items-start gap-4 p-6 bg-gray-light rounded-xl hover:shadow-md transition-shadow">
                        <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-purple-dark text-lg mb-1">{card.title}</h3>
                          {card.lines.map((line, idx) => (
                            <p key={idx} className="text-gray-text">{line}</p>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-gray-light p-8 lg:p-10 rounded-2xl">
              <h2 className="text-2xl lg:text-3xl font-semibold text-purple-dark mb-6">
                {formSection?.title || t("contact.formTitle")}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-5 relative">
                <div>
                  <label className="block text-sm font-medium text-purple-dark mb-2">
                    {t("contact.nameLabel")}
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-border rounded-xl focus:ring-2 focus:ring-purple-primary focus:border-transparent transition-all bg-white"
                    placeholder={t("contact.namePlaceholder")}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-purple-dark mb-2">
                      {t("contact.emailLabel")}
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-border rounded-xl focus:ring-2 focus:ring-purple-primary focus:border-transparent transition-all bg-white"
                      placeholder={t("contact.emailPlaceholder")}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-purple-dark mb-2">
                      {t("contact.phoneLabel")}
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-border rounded-xl focus:ring-2 focus:ring-purple-primary focus:border-transparent transition-all bg-white"
                      placeholder={t("contact.phonePlaceholder")}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-purple-dark mb-2">
                    {t("contact.subjectLabel")}
                  </label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-border rounded-xl focus:ring-2 focus:ring-purple-primary focus:border-transparent transition-all bg-white"
                  >
                    <option value="">{t("contact.subjectPlaceholder")}</option>
                    {formSection?.subjects?.map((subject) => (
                      <option key={subject.value} value={subject.value}>
                        {subject.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-purple-dark mb-2">
                    {t("contact.messageLabel")}
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    minLength={10}
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-border rounded-xl focus:ring-2 focus:ring-purple-primary focus:border-transparent transition-all bg-white resize-none"
                    placeholder={t("contact.messagePlaceholder")}
                  />
                </div>

                {/* Honeypot alanı - (görünmez) */}
                <div style={{ position: "absolute", left: "-9999px", opacity: 0, pointerEvents: "none" }}>
                  <label htmlFor="website">{t("contact.honeypotLabel")}</label>
                  <input
                    type="text"
                    id="website"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    onChange={() => {}} // Botlar yakalanacak
                  />
                </div>

                {submitError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                    {submitError}
                  </div>
                )}

                {submitSuccess && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
                    {data?.formSection?.successMessage || t("contact.successMessage")}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-orange-primary text-white text-lg font-semibold rounded-xl hover:bg-orange-accent transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t("contact.sending")}
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      {formSection?.buttonText || t("contact.sendButton")}
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Map Section */}
      {mapSection && (
        <section className="bg-gray-light py-16">
          <div className="container mx-auto px-8 lg:px-16">
            <h2 className="text-3xl lg:text-4xl font-semibold text-purple-dark text-center mb-8">
              {mapSection.title || t("contact.mapTitle")}
            </h2>
            <div className="max-w-6xl mx-auto">
              <div className="relative rounded-2xl overflow-hidden shadow-xl">
                {mapSection.embedUrl ? (
                  <div className="relative w-full h-[300px] lg:h-[450px]">
                    <iframe
                      src={mapSection.embedUrl}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="w-full h-full"
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-purple-dark/90 via-purple-dark/50 to-transparent">
                      <h3 className="text-2xl font-bold mb-2 text-white">{mapSection.venueName}</h3>
                      <p className="text-lg text-white">{mapSection.venueDetails}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <img
                      src={mapSection.image}
                      alt={mapSection.venueName}
                      className="w-full h-[300px] lg:h-[450px] object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-purple-dark/80 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                      <h3 className="text-2xl font-bold mb-2">{mapSection.venueName}</h3>
                      <p className="text-lg text-white">{mapSection.venueDetails}</p>
                    </div>
                    <a
                      href="https://maps.app.goo.gl/3rr66eqWefvQfnbW6"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute top-4 right-4 px-4 py-2 bg-white/90 hover:bg-white text-purple-dark rounded-lg font-semibold transition-colors shadow-lg"
                    >
                      {t("contact.openMap")}
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}

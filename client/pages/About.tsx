import { useTranslation } from "react-i18next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAbout } from "@/hooks/useAbout";
import { Loader2 } from "lucide-react";

export default function About() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith("en") ? "en" : "tr";
  const { data, isLoading } = useAbout(locale);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-purple-dark">
        <Loader2 className="w-12 h-12 animate-spin text-white" />
      </div>
    );
  }

  const hero = data?.hero;
  const sections = data?.sections?.sort((a, b) => a.order - b.order) || [];

  return (
    <div className="min-h-screen">
      {/* Header with purple background */}
      <div className="relative bg-purple-dark">
        <Header />
      </div>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-purple-dark via-purple-primary to-purple-dark py-12 lg:py-28">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="container mx-auto px-4 lg:px-16 text-center relative z-10">
          <h1 className="text-4xl lg:text-7xl font-bold text-white mb-3 lg:mb-4">
            {hero?.title || t("about.titleFallback")}
          </h1>
          {hero?.subtitle && (
            <p className="text-lg lg:text-2xl text-purple-accent max-w-3xl mx-auto">
              {hero.subtitle}
            </p>
          )}
        </div>
      </section>

      {/* Main content */}
      <main className="bg-white py-6 lg:py-16">
        <div className="container mx-auto px-4 lg:px-16">
          <div className="max-w-6xl mx-auto">
            {sections.map((section) => {
              // Text Section
              if (section.type === "text") {
                return (
                  <p key={section.id} className="text-gray-text text-base lg:text-lg leading-relaxed mb-4 lg:mb-6">
                    {section.content}
                  </p>
                );
              }

              // Image + Text Section
              if (section.type === "image-text") {
                return (
                  <div key={section.id} className="grid lg:grid-cols-2 gap-4 lg:gap-16 mb-6 lg:mb-8 items-stretch">
                    {/* Image */}
                    <div className="relative flex items-center justify-center h-full min-h-[300px] lg:min-h-[800px]">
                      <img
                        src={section.image}
                        alt={section.imageAlt || ""}
                        className="w-full h-full object-contain rounded-lg"
                        style={{ transform: 'scale(1.3)', objectFit: 'contain' }}
                      />
                    </div>

                    {/* Text content */}
                    <div className="flex flex-col justify-center space-y-2 lg:space-y-3 h-full py-2 lg:py-4">
                      {section.paragraphs?.map((p, idx) => (
                        <p key={idx} className="text-gray-text text-base lg:text-lg leading-relaxed">
                          {p}
                        </p>
                      ))}
                    </div>
                  </div>
                );
              }

              // Text Block Section
              if (section.type === "text-block") {
                return (
                  <div key={section.id} className="mb-6 lg:mb-8">
                    {section.paragraphs?.map((p, idx) => (
                      <p key={idx} className="text-gray-text text-base lg:text-lg leading-relaxed mb-3 lg:mb-4 last:mb-0">
                        {p}
                      </p>
                    ))}
                  </div>
                );
              }

              // Image Section
              if (section.type === "image") {
                return (
                  <div key={section.id} className="mb-6 lg:mb-8">
                    <div className="relative flex items-center justify-center">
                      <img
                        src={section.image}
                        alt={section.imageAlt || ""}
                        className="max-w-full h-auto rounded-lg"
                      />
                    </div>
                  </div>
                );
              }

              return null;
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

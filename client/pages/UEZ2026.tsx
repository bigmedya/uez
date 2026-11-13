import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useUez2026, Topic } from "@/hooks/useUez2026";
import type { Uez2026Locale } from "@/hooks/useUez2026";

export default function UEZ2026() {
  const { t, i18n } = useTranslation();
  const locale: Uez2026Locale = i18n.language?.startsWith("en") ? "en" : "tr";
  const { data, topics, isLoading } = useUez2026(true, locale);
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null);
  const topicRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({});

  // Set first topic as active when data loads
  useEffect(() => {
    if (topics.length > 0 && !activeTopic) {
      setActiveTopic(topics[0]);
    }
  }, [topics, activeTopic]);

  // Scroll to active topic button when it changes (mobile only)
  useEffect(() => {
    if (activeTopic) {
      // Only scroll on mobile devices (screen width < 1024px)
      const isMobile = window.innerWidth < 1024;
      if (isMobile) {
        const buttonElement = topicRefs.current[activeTopic.id];
        if (buttonElement) {
          // Small delay to ensure content is rendered
          setTimeout(() => {
            buttonElement.scrollIntoView({
              behavior: "smooth",
              block: "start",
              inline: "nearest",
            });
          }, 100);
        }
      }
    }
  }, [activeTopic]);

  const hero = data?.hero || { title: "UEZ 2026", subtitle: "", location: "" };
  const intro = data?.intro || { paragraphs: [] };
  const topicsSection = data?.topicsSection || { titleLine1: "", titleLine2: "" };

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
            {hero.title}
          </h1>
          <p className="text-xl lg:text-2xl text-purple-accent max-w-4xl mx-auto italic">
            {hero.subtitle}
          </p>
          <p className="text-sm lg:text-base text-white/90 font-semibold tracking-wide mt-3 max-w-4xl mx-auto">
            {t("uez2026Page.heroTagline")}
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="bg-white py-16 lg:py-24">
        <div className="container mx-auto px-8 lg:px-16">
          {/* Açıklama metni - tam genişlik, ortalanmış */}
          <div className="space-y-6 text-gray-text text-base lg:text-lg leading-relaxed text-center max-w-4xl mx-auto">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-4 border-purple-accent border-t-purple-primary rounded-full animate-spin" />
                </div>
              ) : (
                intro.paragraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))
              )}
          </div>
        </div>
      </section>

      {/* Topics Section */}
      <section className="bg-gray-light py-16 lg:py-24">
        <div className="container mx-auto px-8 lg:px-16">
          {/* Section Title */}
          <h2 className="text-3xl lg:text-5xl font-bold text-orange-primary mb-2">
            {topicsSection.titleLine1}
          </h2>
          <h2 className="text-3xl lg:text-5xl font-bold text-gray-text mb-12">
            {topicsSection.titleLine2}
          </h2>

          {/* Loading state */}
          {isLoading && (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-purple-accent border-t-orange-primary rounded-full animate-spin" />
            </div>
          )}

          {/* Interactive content */}
          {!isLoading && topics.length > 0 && activeTopic && (
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
              {/* Left - Topic list */}
              <div className="space-y-3">
                {topics.map((topic) => (
                  <div key={topic.id}>
                    <button
                      ref={(el) => {
                        topicRefs.current[topic.id] = el;
                      }}
                      onClick={() => setActiveTopic(topic)}
                      className={`w-full text-left flex items-center gap-3 py-2 transition-all ${
                        activeTopic.id === topic.id
                          ? "text-gray-text font-semibold"
                          : "text-orange-primary hover:text-orange-accent"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          activeTopic.id === topic.id
                            ? "bg-purple-dark"
                            : "bg-orange-primary"
                        }`}
                      />
                      <span className={`text-base lg:text-lg ${
                        activeTopic.id === topic.id ? "underline" : ""
                      }`}>
                        {topic.title}
                      </span>
                      {activeTopic.id === topic.id && (
                        <span className="flex-1 border-b border-dashed border-gray-400 ml-2" />
                      )}
                    </button>
                    
                    {/* Mobile: Topic content appears below the clicked topic */}
                    {activeTopic.id === topic.id && (
                      <div className="lg:hidden mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <p className="text-gray-text text-base leading-relaxed">
                          {activeTopic.description}
                        </p>
                        {activeTopic.image && (
                          <div className="relative rounded-lg overflow-hidden shadow-lg">
                            <img
                              src={activeTopic.image}
                              alt={activeTopic.title}
                              className="w-full h-[300px] object-cover"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop - Topic content (right side) */}
              <div className="hidden lg:block space-y-6">
                <p className="text-gray-text text-base lg:text-lg leading-relaxed">
                  {activeTopic.description}
                </p>
                {activeTopic.image && (
                  <div className="relative rounded-lg overflow-hidden shadow-lg">
                    <img
                      src={activeTopic.image}
                      alt={activeTopic.title}
                      className="w-full h-[350px] object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}

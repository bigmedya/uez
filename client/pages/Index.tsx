import Header from '@/components/Header';
import Hero from '@/components/Hero';
import InfoBanner from '@/components/InfoBanner';
import Speakers from '@/components/Speakers';
import Program from '@/components/Program';
import Sponsors from '@/components/Sponsors';
import FAQ from '@/components/FAQ';
import Footer from '@/components/Footer';

export default function Index() {
  return (
    <div className="min-h-screen">
      {/* Hero section with header */}
      <div className="relative bg-purple-dark">
        <Header />
        <Hero />
      </div>

      {/* Info banners */}
      <InfoBanner />

      {/* Speakers section */}
      <Speakers />

      {/* Program section */}
      <Program />

      {/* Sponsors section */}
      <Sponsors />

      {/* FAQ section */}
      <FAQ />

      {/* Footer */}
      <Footer />
    </div>
  );
}

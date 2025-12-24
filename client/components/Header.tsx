import { Link } from "react-router-dom";
import { useState } from "react";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="relative z-50 w-full">
      <div className="container mx-auto px-4 lg:px-16">
        <div className="flex items-center justify-between h-[120px] lg:h-[148px]">
          {/* Logo */}
          <div className="flex items-center gap-4 lg:gap-36">
            <Link to="/" className="flex items-center">
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/bc1aefcc49920778079094c811fbb255fd0b276e?width=295"
                alt="UEZ Logo"
                className="h-20 lg:h-[125px] w-auto"
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden xl:flex items-center gap-8 2xl:gap-14">
              <Link
                to="/"
                className="text-white text-base 2xl:text-lg font-medium hover:text-orange-primary transition-colors whitespace-nowrap"
              >
                UEZ 2026
              </Link>
              <Link
                to="/"
                className="text-white text-base 2xl:text-lg font-medium hover:text-orange-primary transition-colors whitespace-nowrap"
              >
                Program
              </Link>
              <Link
                to="/"
                className="text-white text-base 2xl:text-lg font-medium hover:text-orange-primary transition-colors whitespace-nowrap"
              >
                Hakkımızda
              </Link>
              <Link
                to="/"
                className="text-white text-base 2xl:text-lg font-medium hover:text-orange-primary transition-colors whitespace-nowrap"
              >
                Stars of Regions
              </Link>
              <Link
                to="/"
                className="text-white text-base 2xl:text-lg font-medium hover:text-orange-primary transition-colors whitespace-nowrap"
              >
                Arşiv
              </Link>
              <Link
                to="/"
                className="text-white text-base 2xl:text-lg font-medium hover:text-orange-primary transition-colors whitespace-nowrap"
              >
                Bize Ulaşın
              </Link>
            </nav>
          </div>

          {/* Right side - Buttons and Language */}
          <div className="flex items-center gap-4 lg:gap-12">
            {/* Auth buttons - Desktop */}
            <div className="hidden lg:flex items-center gap-4">
              <button className="px-4 lg:px-6 py-2 lg:py-3 rounded-full border border-purple-accent bg-purple-border text-white text-base lg:text-lg hover:bg-purple-accent transition-colors whitespace-nowrap">
                Giriş Yap
              </button>
              <button className="px-4 lg:px-6 py-2 lg:py-3 rounded-full border border-gold bg-purple-dark text-gold text-base lg:text-lg hover:bg-gold hover:text-purple-dark transition-colors whitespace-nowrap">
                Kayıt Ol
              </button>
            </div>

            {/* Language selector */}
            <div className="hidden md:flex items-center gap-3">
              <span className="text-white text-base lg:text-lg">EN</span>
              <div className="relative w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-[#030303] overflow-hidden flex items-center justify-center">
                <img
                  src="https://api.builder.io/api/v1/image/assets/TEMP/e03c447f4a54a62030d5d882d2e902e8e2d74d50?width=139"
                  alt="Turkish Flag"
                  className="w-[69px] h-auto absolute"
                />
              </div>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden text-white p-2"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="xl:hidden absolute top-full left-0 right-0 bg-purple-dark border-t border-purple-accent shadow-lg">
            <nav className="flex flex-col p-4 space-y-4">
              <Link
                to="/"
                className="text-white text-lg font-medium hover:text-orange-primary transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                UEZ 2026
              </Link>
              <Link
                to="/"
                className="text-white text-lg font-medium hover:text-orange-primary transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Program
              </Link>
              <Link
                to="/"
                className="text-white text-lg font-medium hover:text-orange-primary transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Hakkımızda
              </Link>
              <Link
                to="/"
                className="text-white text-lg font-medium hover:text-orange-primary transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Stars of Regions
              </Link>
              <Link
                to="/"
                className="text-white text-lg font-medium hover:text-orange-primary transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Arşiv
              </Link>
              <Link
                to="/"
                className="text-white text-lg font-medium hover:text-orange-primary transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Bize Ulaşın
              </Link>

              {/* Mobile auth buttons */}
              <div className="lg:hidden flex flex-col gap-3 pt-4 border-t border-purple-accent">
                <button className="w-full px-6 py-3 rounded-full border border-purple-accent bg-purple-border text-white text-lg hover:bg-purple-accent transition-colors">
                  Giriş Yap
                </button>
                <button className="w-full px-6 py-3 rounded-full border border-gold bg-purple-dark text-gold text-lg hover:bg-gold hover:text-purple-dark transition-colors">
                  Kayıt Ol
                </button>
              </div>

              {/* Mobile language selector */}
              <div className="md:hidden flex items-center justify-center gap-3 pt-4 border-t border-purple-accent">
                <span className="text-white text-lg">EN</span>
                <div className="relative w-10 h-10 rounded-full bg-[#030303] overflow-hidden flex items-center justify-center">
                  <img
                    src="https://api.builder.io/api/v1/image/assets/TEMP/e03c447f4a54a62030d5d882d2e902e8e2d74d50?width=139"
                    alt="Turkish Flag"
                    className="w-[69px] h-auto absolute"
                  />
                </div>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

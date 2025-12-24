import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="relative z-50 w-full">
      <div className="container mx-auto px-8 lg:px-16">
        <div className="flex items-center justify-between h-[148px]">
          {/* Logo */}
          <div className="flex items-center gap-6 lg:gap-36">
            <Link to="/" className="flex items-center">
              <img 
                src="https://api.builder.io/api/v1/image/assets/TEMP/bc1aefcc49920778079094c811fbb255fd0b276e?width=295" 
                alt="UEZ Logo" 
                className="h-[125px] w-auto"
              />
            </Link>

            {/* Navigation */}
            <nav className="hidden lg:flex items-center gap-14">
              <Link to="/" className="text-white text-lg font-medium hover:text-orange-primary transition-colors">
                UEZ 2026
              </Link>
              <Link to="/" className="text-white text-lg font-medium hover:text-orange-primary transition-colors">
                Program
              </Link>
              <Link to="/" className="text-white text-lg font-medium hover:text-orange-primary transition-colors">
                Hakkımızda
              </Link>
              <Link to="/" className="text-white text-lg font-medium hover:text-orange-primary transition-colors">
                Stars of Regions
              </Link>
              <Link to="/" className="text-white text-lg font-medium hover:text-orange-primary transition-colors">
                Arşiv
              </Link>
              <Link to="/" className="text-white text-lg font-medium hover:text-orange-primary transition-colors">
                Bize Ulaşın
              </Link>
            </nav>
          </div>

          {/* Right side - Buttons and Language */}
          <div className="flex items-center gap-12">
            {/* Auth buttons */}
            <div className="hidden md:flex items-center gap-6">
              <button className="px-6 py-3 rounded-full border border-purple-accent bg-purple-border text-white text-lg hover:bg-purple-accent transition-colors">
                Giriş Yap
              </button>
              <button className="px-6 py-3 rounded-full border border-gold bg-purple-dark text-gold text-lg hover:bg-gold hover:text-purple-dark transition-colors">
                Kayıt Ol
              </button>
            </div>

            {/* Language selector */}
            <div className="hidden md:flex items-center gap-3">
              <span className="text-white text-lg">EN</span>
              <div className="relative w-10 h-10 rounded-full bg-[#030303] overflow-hidden flex items-center justify-center">
                <img 
                  src="https://api.builder.io/api/v1/image/assets/TEMP/e03c447f4a54a62030d5d882d2e902e8e2d74d50?width=139" 
                  alt="Turkish Flag" 
                  className="w-[69px] h-auto absolute"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

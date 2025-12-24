const sponsorCategories = [
  {
    title: 'ANA SPONSORLAR',
    sponsors: [
      { image: 'https://api.builder.io/api/v1/image/assets/TEMP/83a412f306557bd8d515ffd3d353766e4b59883d?width=1216', alt: 'Ana Sponsor 1' }
    ]
  },
  {
    title: 'GOLD SPONSORLAR',
    sponsors: [
      { image: 'https://api.builder.io/api/v1/image/assets/TEMP/8e042df63060cf99a072a3a8760ada776a118160?width=582', alt: 'Gold Sponsor 1' },
      { image: 'https://api.builder.io/api/v1/image/assets/TEMP/207e98227bc21a748795a41ad1033fb5353751ee?width=498', alt: 'Gold Sponsor 2' },
      { image: 'https://api.builder.io/api/v1/image/assets/TEMP/442117650f4a85ac686f239845bcb89b9561d0cf?width=422', alt: 'Gold Sponsor 3' }
    ]
  },
  {
    title: 'ARAÇ SPONSORLAR',
    sponsors: [
      { image: 'https://api.builder.io/api/v1/image/assets/TEMP/14f6deda53cc6a6fad416a6e20b097bbd71c7341?width=490', alt: 'Araç Sponsor 1' },
      { image: 'https://api.builder.io/api/v1/image/assets/TEMP/8dd3aa7510861456df11d7d6214686f436103791?width=422', alt: 'Araç Sponsor 2' },
      { image: 'https://api.builder.io/api/v1/image/assets/TEMP/d879cdeb36a6f0d5e88cb84d4f5a8a0f6e2625f5?width=468', alt: 'Araç Sponsor 3' },
      { image: 'https://api.builder.io/api/v1/image/assets/TEMP/92a1de7d0461ecc9b6c0ea50c84bbfdbf570c23f?width=362', alt: 'Araç Sponsor 4' }
    ]
  },
  {
    title: 'OTURUM SPONSORLARI',
    sponsors: [
      { image: 'https://api.builder.io/api/v1/image/assets/TEMP/544589df3b51270c242ccbc1c8e1667efb342752?width=486', alt: 'Oturum Sponsor 1' },
      { image: 'https://api.builder.io/api/v1/image/assets/TEMP/650de757a6a1234655d613d80195ddd795a27506?width=320', alt: 'Oturum Sponsor 2' },
      { image: 'https://api.builder.io/api/v1/image/assets/TEMP/165c1d0c8f6b15b0135776183b5ea22832f067f0?width=388', alt: 'Oturum Sponsor 3' },
      { image: 'https://api.builder.io/api/v1/image/assets/TEMP/be87c85a4b87e77d0f4338f6beeb751914de94d9?width=336', alt: 'Oturum Sponsor 4' }
    ]
  },
  {
    title: 'DESTEK SPONSORLARI',
    sponsors: [
      { image: 'https://api.builder.io/api/v1/image/assets/TEMP/a3d553cc3ba4d8918532abef6a4f35f9ef70f8fa?width=422', alt: 'Destek Sponsor 1' },
      { image: 'https://api.builder.io/api/v1/image/assets/TEMP/476b9715569918b6c2f99fb70d0aacfd2d6574c9?width=246', alt: 'Destek Sponsor 2' },
      { image: 'https://api.builder.io/api/v1/image/assets/TEMP/11253dadce8651cad3818bb361d15563d97258aa?width=384', alt: 'Destek Sponsor 3' },
      { image: 'https://api.builder.io/api/v1/image/assets/TEMP/4f7061786c48060b820e2f6c2518be6aeb6ff417?width=362', alt: 'Destek Sponsor 4' },
      { image: 'https://api.builder.io/api/v1/image/assets/TEMP/2a0dc98ab0522c03607ad57486980158b3b7ccfa?width=338', alt: 'Destek Sponsor 5' },
      { image: 'https://api.builder.io/api/v1/image/assets/TEMP/fedbdd048b451656f463c4dbf8c301a119333947?width=374', alt: 'Destek Sponsor 6' },
      { image: 'https://api.builder.io/api/v1/image/assets/TEMP/35ea50dc0c284844f8d40d559fd78325106c86f3?width=362', alt: 'Destek Sponsor 7' },
      { image: 'https://api.builder.io/api/v1/image/assets/TEMP/0c79b0804bd7b5788ce52502283d028afe3ed18a?width=354', alt: 'Destek Sponsor 8' }
    ]
  }
];

export default function Sponsors() {
  return (
    <section className="relative bg-purple-dark py-16 lg:py-24 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-96 -top-96 w-[1371px] h-[800px] opacity-40 rotate-[-35deg]">
          <img 
            src="https://api.builder.io/api/v1/image/assets/TEMP/bef7c8bdc20787cdad5d66092704a0ae17a07d5e?width=2741" 
            alt="" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute right-0 -top-4 w-[944px] h-[1780px] opacity-50">
          <img 
            src="https://api.builder.io/api/v1/image/assets/TEMP/4b698fc1479f31bcf0a42cd4436232086fb0be30?width=2555" 
            alt="" 
            className="w-full h-full object-cover rotate-[102deg]"
          />
        </div>
        <img 
          src="https://api.builder.io/api/v1/image/assets/TEMP/72610048eb38506a0cb1dabed457b2c286976189?width=2349" 
          alt="" 
          className="absolute -left-64 -top-4 w-[1175px] h-auto"
        />
        <img 
          src="https://api.builder.io/api/v1/image/assets/TEMP/fee440525db8a2a9c9f36332f491042b7c458e48?width=1848" 
          alt="" 
          className="absolute right-0 top-[400px] w-[924px] h-auto opacity-60"
        />
      </div>

      <div className="container mx-auto px-8 lg:px-16 relative z-10">
        {/* Section badge */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center px-6 py-3 rounded-xl bg-orange-primary">
            <span className="text-purple-dark text-3xl lg:text-4xl font-normal">STARS OF REGION</span>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-5xl lg:text-7xl font-semibold text-white text-center mb-16">
          SPONSORLAR
        </h2>

        {/* Sponsor categories */}
        <div className="space-y-16">
          {sponsorCategories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="space-y-8">
              {/* Category divider */}
              <div className="border-t border-purple-accent pt-8">
                <h3 className="text-4xl lg:text-5xl font-semibold text-purple-primary text-center mb-8">
                  {category.title}
                </h3>
              </div>

              {/* Sponsors grid */}
              <div className={`grid gap-8 ${
                category.sponsors.length === 1 
                  ? 'grid-cols-1 justify-items-center' 
                  : category.sponsors.length <= 3
                    ? 'grid-cols-1 md:grid-cols-3'
                    : 'grid-cols-2 md:grid-cols-4'
              }`}>
                {category.sponsors.map((sponsor, sponsorIndex) => (
                  <div 
                    key={sponsorIndex}
                    className="flex items-center justify-center p-6 bg-purple-dark/50 rounded-lg hover:bg-purple-dark/70 transition-colors"
                  >
                    <img 
                      src={sponsor.image} 
                      alt={sponsor.alt}
                      className="max-w-full h-auto max-h-24 object-contain"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Become sponsor button */}
        <div className="flex justify-center mt-16">
          <button className="flex items-center gap-3 px-8 py-4 rounded-xl border border-purple-accent bg-gradient-secondary text-white text-3xl hover:scale-105 transition-transform">
            Sponsor Ol
            <svg width="27" height="27" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16.1553 6.63892L22.9509 13.4346L16.1553 20.2302" stroke="white" strokeWidth="1.67932" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3.91797 13.4346H22.76" stroke="white" strokeWidth="1.67932" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}

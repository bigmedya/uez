const speakers = [
  {
    id: 1,
    name: 'François Hollande',
    title: 'Fransa Eski Cumhurbaşkanı',
    image: 'https://api.builder.io/api/v1/image/assets/TEMP/6f9dc6136c36c2ca690a661cfdfcff4dee974339?width=711'
  },
  {
    id: 2,
    name: 'Enrico Letta',
    title: 'İtalya Eski Başbaşkanı',
    image: 'https://api.builder.io/api/v1/image/assets/TEMP/a58f36f636c5e11f01da0fff873518be68536905?width=509'
  },
  {
    id: 3,
    name: 'Fredric Reinfelt',
    title: 'İsveç Eski Başbaşkanı',
    image: 'https://api.builder.io/api/v1/image/assets/TEMP/4ae6562977f8ce05f2048a9782aa451e058eff56?width=505'
  },
  {
    id: 4,
    name: 'François Hollande',
    title: 'Fransa Eski Cumhurbaşkanı',
    image: 'https://api.builder.io/api/v1/image/assets/TEMP/44e0546db53f0f983b5e0f3ee62c5792ea879ee3?width=509'
  },
  {
    id: 5,
    name: 'Enrico Letta',
    title: 'İtalya Eski Başbaşkanı',
    image: 'https://api.builder.io/api/v1/image/assets/TEMP/2bcb27a3a70c11f8ebc77647240b53859c8c9ae6?width=508'
  },
  {
    id: 6,
    name: 'Enrico Letta',
    title: 'İtalya Eski Başbaşkanı',
    image: 'https://api.builder.io/api/v1/image/assets/TEMP/fc60f74c728272e05f50de3448f096ad6da07604?width=508'
  },
  {
    id: 7,
    name: 'François Hollande',
    title: 'Fransa Eski Cumhurbaşkanı',
    image: 'https://api.builder.io/api/v1/image/assets/TEMP/19c74d4d74175907b69155654b2552a9f1b41eba?width=554'
  },
  {
    id: 8,
    name: 'Enrico Letta',
    title: 'İtalya Eski Başbaşkanı',
    image: 'https://api.builder.io/api/v1/image/assets/TEMP/91915cc170d26c69462965bee4e1b4054154a3e1?width=535'
  },
  {
    id: 9,
    name: 'Enrico Letta',
    title: 'İtalya Eski Başbaşkanı',
    image: 'https://api.builder.io/api/v1/image/assets/TEMP/e8e4734dd78ee24f067e730e57a222dea5cbb9d9?width=506'
  },
  {
    id: 10,
    name: 'François Hollande',
    title: 'Fransa Eski Cumhurbaşkanı',
    image: 'https://api.builder.io/api/v1/image/assets/TEMP/9ca0ee1e4345dfae4a48816d7bd9cdfaf35ee3f7?width=540'
  },
  {
    id: 11,
    name: 'Enrico Letta',
    title: 'İtalya Eski Başbaşkanı',
    image: 'https://api.builder.io/api/v1/image/assets/TEMP/4de349d59deda618759889104f3a0cf743571d87?width=506'
  },
  {
    id: 12,
    name: 'Enrico Letta',
    title: 'İtalya Eski Başbaşkanı',
    image: 'https://api.builder.io/api/v1/image/assets/TEMP/b87decd8da68a05f7bc106b78ffd6faa9e4f7b29?width=570'
  }
];

export default function Speakers() {
  return (
    <section className="relative bg-white py-16 lg:py-24 overflow-hidden">
      {/* Background decoration */}
      <img 
        src="https://api.builder.io/api/v1/image/assets/TEMP/69b54a07d12ee51bd042591fe1b9ab9ab70a2325?width=1848" 
        alt="" 
        className="absolute right-0 top-32 w-[924px] h-auto opacity-60 pointer-events-none"
      />

      <div className="container mx-auto px-8 lg:px-16 relative z-10">
        {/* Section badge */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center px-6 py-3 rounded-xl bg-orange-primary">
            <span className="text-purple-dark text-3xl lg:text-4xl font-normal">İş Dünyasının Büyük Buluşması</span>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-5xl lg:text-7xl font-semibold text-purple-dark text-center mb-16 leading-tight">
          Zirvenin
          <br />
          Konuşmacı Profilleri
        </h2>

        {/* Speakers grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 lg:gap-12 mb-12">
          {speakers.map((speaker) => (
            <div key={speaker.id} className="flex flex-col items-center group">
              {/* Speaker image */}
              <div className="relative mb-4">
                <div className="w-64 h-64 rounded-full overflow-hidden bg-gray-200">
                  <img 
                    src={speaker.image} 
                    alt={speaker.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
              </div>

              {/* Speaker info */}
              <div className="w-full max-w-sm">
                {/* Name badge */}
                <div className="flex justify-start mb-2">
                  <div className="px-4 py-3 rounded-tl-xl bg-gradient-purple">
                    <h3 className="text-white text-2xl font-semibold">{speaker.name}</h3>
                  </div>
                </div>

                {/* Title badge */}
                <div className="flex justify-start">
                  <div className="px-4 py-3 rounded-br-xl bg-gradient-orange">
                    <p className="text-white text-xl font-medium">{speaker.title}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View all button */}
        <div className="flex justify-center">
          <button className="flex items-center gap-3 px-8 py-4 rounded-xl border border-purple-accent bg-gradient-secondary text-white text-3xl hover:scale-105 transition-transform">
            Tümünü Gör
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

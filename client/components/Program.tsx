const programDays = [
  { id: 1, label: "25 Mart 2025", active: true },
  { id: 2, label: "26 Mart 2025", active: false },
  { id: 3, label: "27 Mart 2025", active: false },
];

const programItems = [
  {
    time: "09:00",
    title: "AÇILIŞ KONUŞMALARI",
    moderator: "Sedef Seçkin Büyük",
    moderatorTitle: "Capital & Ekonomist Dergileri Yayın Direktörü",
    speakers: [
      {
        name: "Dr. M. Emre Çamlıbel",
        title: "RePie Yatırım Holding Yönetim Kurulu Başkanı",
      },
      { name: "Dr. Erman Ilıcak", title: "Rönesans Holding Onursal Başkanı" },
      { name: "Mehmet Şimşek", title: "T.C. Hazine ve Maliye Bakanı" },
    ],
  },
  {
    time: "09:15",
    title: "YARINA HAZIRLIK: YENİ YATIRIMLAR ve FIRSATLAR",
    moderator: "İbrahim Halil Öztop",
    moderatorTitle:
      "Türkiye Kakınma ve Yatırım Bankası Genel Müdür ve Yönetim Kurulu Üyesi",
    speakers: [
      {
        name: "Elisabetta Falcetti",
        title: "EBDR Türkiye ve Kafkasya Bölge Direktörü",
      },
      {
        name: "Elisabetta Falcetti",
        title: "EBDR Türkiye ve Kafkasya Bölge Direktörü",
      },
      {
        name: "Elisabetta Falcetti",
        title: "EBDR Türkiye ve Kafkasya Bölge Direktörü",
      },
    ],
  },
  {
    time: "10:00",
    title: "GLOBAL EKONOMİ 5.0: POLİTİK, EKONOMİK VE SOSYAL DÖNÜŞÜM",
    moderator: "İbrahim Halil Öztop",
    moderatorTitle:
      "Türkiye Kakınma ve Yatırım Bankası Genel Müdür ve Yönetim Kurulu Üyesi",
    speakers: [
      {
        name: "Elisabetta Falcetti",
        title: "EBDR Türkiye ve Kafkasya Bölge Direktörü",
      },
      {
        name: "Elisabetta Falcetti",
        title: "EBDR Türkiye ve Kafkasya Bölge Direktörü",
      },
      {
        name: "Elisabetta Falcetti",
        title: "EBDR Türkiye ve Kafkasya Bölge Direktörü",
      },
      {
        name: "Elisabetta Falcetti",
        title: "EBDR Türkiye ve Kafkasya Bölge Direktörü",
      },
    ],
  },
];

export default function Program() {
  return (
    <section className="relative bg-gray-light py-16 lg:py-24">
      <div className="container mx-auto px-8 lg:px-16">
        {/* Title */}
        <h2 className="text-5xl lg:text-7xl font-semibold text-purple-dark text-center mb-12">
          Program
        </h2>

        {/* Day tabs */}
        <div className="flex flex-wrap justify-center gap-6 mb-12">
          {programDays.map((day) => (
            <button
              key={day.id}
              className={`px-8 py-4 rounded-xl text-2xl font-medium transition-colors ${
                day.active
                  ? "bg-gradient-to-r from-orange-accent via-salmon to-coral text-white"
                  : "bg-purple-primary text-white hover:bg-purple-accent"
              }`}
            >
              {day.label}
            </button>
          ))}
        </div>

        {/* Program schedule */}
        <div className="max-w-6xl mx-auto space-y-6">
          {programItems.map((item, index) => (
            <div
              key={index}
              className={`rounded-xl p-8 ${
                index % 2 === 0 ? "bg-gray-medium" : "bg-gray-dark"
              }`}
            >
              {/* Time */}
              <div className="flex items-start gap-8 mb-6">
                <div className="relative">
                  <span className="text-3xl font-semibold text-black">
                    {item.time}
                  </span>
                  <div className="absolute -left-24 top-2 w-4 h-4 rounded-full bg-purple-primary"></div>
                </div>

                <div className="flex-1">
                  {/* Session title */}
                  <div className="inline-flex items-center px-6 py-3 rounded-xl bg-purple-primary mb-6">
                    <h3 className="text-white text-2xl font-semibold">
                      {item.title}
                    </h3>
                  </div>

                  {/* Moderator */}
                  <div className="mb-6">
                    <div className="inline-flex items-center px-4 py-2 rounded-lg bg-orange-accent mb-3">
                      <span className="text-black text-lg">MODERATÖR</span>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-full bg-gray-dark overflow-hidden flex-shrink-0">
                        <img
                          src="https://api.builder.io/api/v1/image/assets/TEMP/4ff7427285b5367f55f53c612ee31204c64515df?width=248"
                          alt={item.moderator}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-xl font-bold text-black">
                          {item.moderator}
                        </p>
                        <p className="text-lg text-gray-text">
                          {item.moderatorTitle}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Speakers */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {item.speakers.map((speaker, speakerIndex) => (
                      <div
                        key={speakerIndex}
                        className="flex items-start gap-3"
                      >
                        <div className="w-16 h-16 rounded-full bg-gray-dark overflow-hidden flex-shrink-0">
                          <img
                            src="https://api.builder.io/api/v1/image/assets/TEMP/3d8c9bc3728ff23150a6419967a8eb9af1533371?width=248"
                            alt={speaker.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-lg font-bold text-black">
                            {speaker.name}
                          </p>
                          <p className="text-base text-gray-text">
                            {speaker.title}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Download button */}
        <div className="flex justify-end mt-8">
          <button className="flex items-center gap-3 px-6 py-3 rounded-xl border border-purple-dark bg-gray-medium text-purple-dark hover:bg-gray-dark transition-colors">
            <svg
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12.6943 0.5H26.793L38.5 12.207V34.793C38.4998 37.3646 36.2642 39.4999 33.4404 39.5H12.5703C9.73516 39.5 7.50023 37.364 7.5 34.793V5.20703C7.50013 2.64972 9.84436 0.500142 12.6943 0.5Z"
                fill="white"
                stroke="#1F0034"
              />
              <path
                d="M27.0257 8.16V0L39 12H31.0171C27.4248 12 26.8593 9.44 27.0257 8.16Z"
                fill="#1F0034"
              />
              <rect x="1" y="19" width="26" height="15" rx="3" fill="#D92D20" />
              <text fill="white" fontSize="9" fontWeight="bold" x="5" y="29.7">
                PDF
              </text>
            </svg>
            <span className="text-xl">Programı PDF olarak indir</span>
          </button>
        </div>
      </div>
    </section>
  );
}

import { useEffect, useState } from "react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function Hero() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 32,
    hours: 17,
    minutes: 45,
    seconds: 32,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return {
            ...prev,
            days: prev.days - 1,
            hours: 23,
            minutes: 59,
            seconds: 59,
          };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const CountdownCircle = ({
    value,
    label,
  }: {
    value: number;
    label: string;
  }) => (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32 md:w-40 md:h-40">
        {/* Background circle */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-primary to-purple-dark opacity-40" />

        {/* Border circle */}
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r="45%"
            fill="none"
            stroke="#F37A71"
            strokeWidth="3"
            strokeOpacity="0.2"
            className="circle-progress"
          />
          <circle
            cx="50%"
            cy="50%"
            r="45%"
            fill="none"
            stroke="#F37A71"
            strokeWidth="3"
            strokeDasharray="283"
            strokeDashoffset="70"
            strokeLinecap="round"
            className="animate-pulse"
          />
        </svg>

        {/* Number */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-5xl md:text-6xl font-bold text-white">
            {value}
          </span>
        </div>
      </div>

      {/* Label */}
      <span className="mt-4 text-2xl md:text-3xl text-white font-poppins">
        {label}
      </span>
    </div>
  );

  return (
    <section className="relative min-h-screen bg-purple-dark overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Top left gradient blob */}
        <div className="absolute -left-64 -top-32 w-[727px] h-[424px] opacity-40">
          <img
            src="https://api.builder.io/api/v1/image/assets/TEMP/eb20ef79f60ca8c7647630ed0e9f594cb7ebde63?width=1453"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>

        {/* Top right gradient blob */}
        <div className="absolute right-0 -top-64 w-[763px] h-[1440px] opacity-50">
          <img
            src="https://api.builder.io/api/v1/image/assets/TEMP/aa4a1b45f7e0049cfaadb743fc2fc930a6a563bf?width=2067"
            alt=""
            className="w-full h-full object-cover rotate-[102deg]"
          />
        </div>

        {/* Additional gradient overlays */}
        <img
          src="https://api.builder.io/api/v1/image/assets/TEMP/29342f82376d762ef6a1e22617f50f96e067c01d?width=1848"
          alt=""
          className="absolute right-0 -top-32 w-[924px] h-auto opacity-60"
        />
        <img
          src="https://api.builder.io/api/v1/image/assets/TEMP/1c3763c01e00374b737eb38296ce9ca64cbb2c07?width=2349"
          alt=""
          className="absolute -left-64 top-4 w-[1175px] h-auto opacity-40"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-8 lg:px-16 pt-8 pb-16">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center min-h-[calc(100vh-148px)]">
          {/* Left content */}
          <div className="space-y-8">
            <h1 className="text-6xl lg:text-8xl font-bold text-orange-primary leading-tight">
              BÜYÜK
              <br />
              DÖNÜŞÜM:
            </h1>

            <p className="text-4xl lg:text-5xl text-white italic leading-tight">
              Dayanıklı ve sürdürülebilir bir küresel sisteme geçişin pusulası
            </p>

            <button className="flex items-center gap-3 px-8 py-4 rounded-xl border border-coral-pink bg-gradient-primary text-white text-3xl hover:scale-105 transition-transform">
              Keşfet
              <svg
                width="27"
                height="27"
                viewBox="0 0 27 27"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M16.1553 6.63892L22.9509 13.4346L16.1553 20.2302"
                  stroke="white"
                  strokeWidth="1.67932"
                  strokeMiterlimit="10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M3.91797 13.4346H22.76"
                  stroke="white"
                  strokeWidth="1.67932"
                  strokeMiterlimit="10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          {/* Right content - Video and Countdown */}
          <div className="space-y-8">
            {/* Video placeholder */}
            <div className="relative rounded-[40px] border border-purple-accent overflow-hidden shadow-[0_4px_130px_0_rgba(44,0,73,1)] bg-gray-500 aspect-video">
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/72290d79abf52f87a2347354794d9ee246900632?width=1925"
                alt="Summit Video"
                className="w-full h-full object-cover"
              />

              {/* Play button */}
              <button className="absolute inset-0 flex items-center justify-center group">
                <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg
                    width="90"
                    height="90"
                    viewBox="0 0 90 90"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M44.6698 82.1003C65.2802 82.1003 81.9881 65.3923 81.9881 44.782C81.9881 24.1716 65.2802 7.46368 44.6698 7.46368C24.0595 7.46368 7.35156 24.1716 7.35156 44.782C7.35156 65.3923 24.0595 82.1003 44.6698 82.1003Z"
                      stroke="white"
                      strokeWidth="1.67932"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M32.6162 45.6402V39.4081C32.6162 31.6459 38.102 28.4738 44.8193 32.3549L50.2304 35.4897L55.6416 38.6244C62.3589 42.5055 62.3589 48.8496 55.6416 52.7307L50.2304 55.8655L44.8193 59.0002C38.102 62.8813 32.6162 59.7092 32.6162 51.947V45.6402Z"
                      stroke="white"
                      strokeWidth="1.67932"
                      strokeMiterlimit="10"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </button>
            </div>

            {/* Countdown Timer */}
            <div className="rounded-xl border border-purple-medium bg-[#26023F] p-8 md:p-12 relative overflow-hidden">
              {/* Background gradient */}
              <div className="absolute inset-0 opacity-30">
                <img
                  src="https://api.builder.io/api/v1/image/assets/TEMP/381e8b17c5fa919c50c30c74e9e5fdb4a9f04259?width=2456"
                  alt=""
                  className="w-full h-full object-cover rotate-[-38deg]"
                />
              </div>

              {/* Countdown circles */}
              <div className="relative grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
                <CountdownCircle value={timeLeft.days} label="GÜN" />
                <CountdownCircle value={timeLeft.hours} label="SAAT" />
                <CountdownCircle value={timeLeft.minutes} label="DAKİKA" />
                <CountdownCircle value={timeLeft.seconds} label="SANİYE" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

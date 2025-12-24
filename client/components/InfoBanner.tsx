export default function InfoBanner() {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-8 lg:px-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Banner 1 */}
          <div className="rounded-xl overflow-hidden">
            <img 
              src="https://api.builder.io/api/v1/image/assets/TEMP/4c32e5301eee0338228f70dbd27de1b21fb0b991?width=873" 
              alt="Info Banner 1" 
              className="w-full h-auto"
            />
          </div>

          {/* Banner 2 */}
          <div className="rounded-xl overflow-hidden">
            <img 
              src="https://api.builder.io/api/v1/image/assets/TEMP/4574e87f526222810931ccccdcf0883eb19f9bc8?width=873" 
              alt="Info Banner 2" 
              className="w-full h-auto"
            />
          </div>

          {/* Banner 3 */}
          <div className="rounded-xl overflow-hidden">
            <img 
              src="https://api.builder.io/api/v1/image/assets/TEMP/8aa51d8c32c02aecc0d038e6125ec46c6ccb8b62?width=873" 
              alt="Info Banner 3" 
              className="w-full h-auto"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

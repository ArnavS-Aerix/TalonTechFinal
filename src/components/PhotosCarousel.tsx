import { Camera } from 'lucide-react';

export default function PhotosCarousel() {
  return (
    <section className="py-20 md:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-brand-gold mb-3">
            Build Season Progress
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-brand-navy tracking-tight">
            Our Journey So Far
          </h2>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="relative aspect-video bg-gradient-to-br from-brand-navy to-brand-navy-light rounded-2xl overflow-hidden flex flex-col items-center justify-center gap-6 shadow-lg">
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(196,163,90,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(196,163,90,0.4) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }}
            />
            <div className="relative z-10 flex flex-col items-center gap-5 text-center px-8">
              <div className="w-20 h-20 rounded-full bg-brand-gold/20 border-2 border-brand-gold/40 flex items-center justify-center">
                <Camera className="text-brand-gold" size={36} />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-white mb-2">Photos Coming Soon</p>
                <p className="text-sm text-white/60 leading-relaxed max-w-md">
                  Progress will be posted when we begin our season.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

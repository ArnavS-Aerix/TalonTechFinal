import { useEffect, useState } from 'react';
import { Camera, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Photo = {
  id: string;
  photo_path: string;
  caption: string | null;
};

export default function PhotosCarousel() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('site_photos')
        .select('id, photo_path, caption')
        .order('sort_order', { ascending: true });
      setPhotos((data ?? []) as Photo[]);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <section className="py-20 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
          <div className="w-8 h-8 border-3 border-brand-gold/30 border-t-brand-gold rounded-full animate-spin" />
        </div>
      </section>
    );
  }

  if (photos.length === 0) {
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

  const next = () => setCurrent((c) => (c + 1) % photos.length);
  const prev = () => setCurrent((c) => (c - 1 + photos.length) % photos.length);
  const photoUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/progress-photos`;

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

        <div className="max-w-4xl mx-auto relative">
          <div className="relative rounded-2xl overflow-hidden shadow-xl bg-brand-navy">
            <div className="aspect-video">
              <img
                src={`${photoUrl}/${photos[current].photo_path}`}
                alt={photos[current].caption ?? 'Talon Tech progress photo'}
                className="w-full h-full object-cover"
              />
            </div>
            {photos[current].caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-brand-navy/90 to-transparent p-6">
                <p className="text-white text-sm md:text-base font-medium">{photos[current].caption}</p>
              </div>
            )}
            {photos.length > 1 && (
              <>
                <button
                  onClick={prev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 flex items-center justify-center transition-colors"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="text-white" size={24} />
                </button>
                <button
                  onClick={next}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 flex items-center justify-center transition-colors"
                  aria-label="Next photo"
                >
                  <ChevronRight className="text-white" size={24} />
                </button>
              </>
            )}
          </div>

          {photos.length > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {photos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-2 rounded-full transition-all ${i === current ? 'w-8 bg-brand-gold' : 'w-2 bg-gray-300 hover:bg-gray-400'}`}
                  aria-label={`Go to photo ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

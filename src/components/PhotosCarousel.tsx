import { useEffect, useState } from 'react';
import { Camera, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Photo = {
  id: string;
  photo_path: string;
  caption: string | null;
  sort_order: number;
};

export default function PhotosCarousel() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('site_photos')
        .select('id, photo_path, caption, sort_order')
        .order('sort_order', { ascending: true });
      setPhotos((data ?? []) as Photo[]);
      setLoaded(true);
    })();
  }, []);

  if (!loaded) {
    return (
      <section className="py-20 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-brand-gold mb-3">Build Season Progress</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-brand-navy tracking-tight">Our Journey So Far</h2>
          </div>
          <div className="flex items-center justify-center py-16">
            <Camera className="text-gray-300 animate-pulse" size={32} />
          </div>
        </div>
      </section>
    );
  }

  if (photos.length === 0) {
    return (
      <section className="py-20 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-brand-gold mb-3">Build Season Progress</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-brand-navy tracking-tight">Our Journey So Far</h2>
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

  const prev = () => setCurrent(c => (c - 1 + photos.length) % photos.length);
  const next = () => setCurrent(c => (c + 1) % photos.length);

  return (
    <section className="py-20 md:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-brand-gold mb-3">Build Season Progress</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-brand-navy tracking-tight">Our Journey So Far</h2>
        </div>

        <div className="relative max-w-4xl mx-auto">
          <div className="overflow-hidden rounded-2xl shadow-xl">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${current * 100}%)` }}
            >
              {photos.map((p) => (
                <div key={p.id} className="min-w-full">
                  <div className="relative aspect-video bg-brand-navy">
                    <img
                      src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/progress-photos/${p.photo_path}`}
                      alt={p.caption ?? 'Team photo'}
                      className="w-full h-full object-cover"
                    />
                    {p.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                        <p className="text-white text-sm font-medium">{p.caption}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {photos.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white/90 backdrop-blur border border-gray-200 rounded-full shadow-md flex items-center justify-center text-brand-navy hover:bg-brand-gold hover:text-white transition-all duration-200 z-10"
                aria-label="Previous photo"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={next}
                className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white/90 backdrop-blur border border-gray-200 rounded-full shadow-md flex items-center justify-center text-brand-navy hover:bg-brand-gold hover:text-white transition-all duration-200 z-10"
                aria-label="Next photo"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
        </div>

        {photos.length > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-2 rounded-full transition-all duration-300 ${i === current ? 'w-6 bg-brand-gold' : 'w-2 bg-gray-300 hover:bg-brand-gold/50'}`}
                aria-label={`Go to photo ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

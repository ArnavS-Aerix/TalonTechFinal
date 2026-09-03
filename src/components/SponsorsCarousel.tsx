import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Sponsor = {
  id: string;
  name: string;
  logo_path: string | null;
  website: string | null;
  sort_order: number;
};

const PLACEHOLDER_COUNT = 3;

export default function SponsorsCarousel() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('sponsors')
        .select('id, name, logo_path, website, sort_order')
        .eq('placement', 'carousel')
        .order('sort_order', { ascending: true });
      setSponsors((data ?? []) as Sponsor[]);
      setLoaded(true);
    })();
  }, []);

  const slideCount = Math.max(sponsors.length, PLACEHOLDER_COUNT);

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setCurrent(c => (c + 1) % slideCount), 3500);
  };

  useEffect(() => {
    if (!loaded) return;
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, slideCount]);

  const prev = () => { setCurrent(c => (c - 1 + slideCount) % slideCount); resetTimer(); };
  const next = () => { setCurrent(c => (c + 1) % slideCount); resetTimer(); };

  return (
    <section className="py-20 md:py-24 bg-white overflow-hidden">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-brand-gold mb-3">Our Sponsors</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-brand-navy tracking-tight">
            Supporting Talon Tech
          </h2>
          <p className="mt-3 text-gray-500 max-w-xl mx-auto">
            {sponsors.length > 0
              ? 'We are grateful to the organizations that make our work possible.'
              : 'These spots are waiting for organizations who believe in the next generation of engineers.'}
          </p>
        </div>

        <div className="relative w-full">
          {/* Track */}
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${current * 100}%)` }}
            >
              {sponsors.length > 0 ? (
                sponsors.map((s) => {
                  const slide = (
                    <div className="flex flex-col items-center justify-center gap-4 py-16 px-8">
                      {s.logo_path ? (
                        <img
                          src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/sponsor-logos/${s.logo_path}`}
                          alt={s.name}
                          className="max-h-32 max-w-md object-contain"
                        />
                      ) : (
                        <p className="text-3xl md:text-4xl font-extrabold text-brand-navy tracking-tight">{s.name}</p>
                      )}
                      {s.website && (
                        <span className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-brand-gold transition-colors">
                          {s.name} <ExternalLink size={12} />
                        </span>
                      )}
                    </div>
                  );
                  return (
                    <div key={s.id} className="min-w-full px-2">
                      {s.website ? (
                        <a href={s.website} target="_blank" rel="noopener noreferrer" className="block">
                          {slide}
                        </a>
                      ) : (
                        slide
                      )}
                    </div>
                  );
                })
              ) : (
                Array.from({ length: PLACEHOLDER_COUNT }).map((_, i) => (
                  <div key={i} className="min-w-full px-2">
                    <div className="flex flex-col items-center justify-center gap-4 py-16 px-8">
                      <p className="text-2xl md:text-3xl font-extrabold text-brand-navy/20 tracking-tight">
                        You Can Be Here
                      </p>
                      <p className="text-sm text-gray-400 max-w-md text-center">
                        Sponsor Talon Tech and showcase your brand to the robotics community.
                      </p>
                      <Link
                        to="/sponsor"
                        className="mt-2 inline-flex items-center gap-2 bg-brand-navy text-white text-sm font-semibold px-6 py-2.5 rounded-full hover:bg-brand-navy-light transition-colors duration-200"
                      >
                        Become a Sponsor
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Controls */}
          <button
            onClick={prev}
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center text-brand-navy hover:bg-brand-gold hover:text-white hover:border-brand-gold transition-all duration-200 z-10"
            aria-label="Previous"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={next}
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center text-brand-navy hover:bg-brand-gold hover:text-white hover:border-brand-gold transition-all duration-200 z-10"
            aria-label="Next"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: slideCount }).map((_, i) => (
            <button
              key={i}
              onClick={() => { setCurrent(i); resetTimer(); }}
              className={`h-2 rounded-full transition-all duration-300 ${i === current ? 'w-6 bg-brand-gold' : 'w-2 bg-gray-300 hover:bg-brand-gold/50'}`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

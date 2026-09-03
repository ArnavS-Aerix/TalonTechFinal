import { useEffect, useState } from 'react';
import { Building2, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Sponsor = {
  id: string;
  name: string;
  logo_path: string | null;
  website: string | null;
  sort_order: number;
};

export default function SponsorLogos() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('sponsors')
        .select('id, name, logo_path, website, sort_order')
        .eq('placement', 'hero')
        .order('sort_order', { ascending: true });
      setSponsors((data ?? []) as Sponsor[]);
      setLoaded(true);
    })();
  }, []);

  if (!loaded || sponsors.length === 0) return null;

  return (
    <section className="py-16 md:py-20 bg-gradient-to-b from-gray-50 to-white border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-brand-gold mb-2">
            Presented By
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-brand-navy tracking-tight">
            Our Partners
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 md:gap-8">
          {sponsors.map((s) => {
            const hasLogo = !!s.logo_path;

            const content = hasLogo ? (
              <div className="flex flex-col items-center justify-center gap-3 p-4 h-32 hover:opacity-80 transition-opacity duration-300">
                <img
                  src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/sponsor-logos/${s.logo_path}`}
                  alt={s.name}
                  className="max-h-200 max-w-full object-contain"
                />
                {s.website && (
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    {s.name} <ExternalLink size={10} />
                  </span>
                )}
                {!s.website && (
                  <p className="text-sm font-semibold text-gray-600 text-center">{s.name}</p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 bg-white rounded-xl border border-gray-100 p-6 h-32 hover:border-brand-gold hover:shadow-md transition-all duration-300 group">
                <div className="w-14 h-14 rounded-lg bg-brand-navy/5 flex items-center justify-center">
                  <Building2 className="text-brand-navy/30" size={24} />
                </div>
                <p className="text-sm font-semibold text-gray-600 group-hover:text-brand-navy transition-colors text-center">
                  {s.name}
                </p>
              </div>
            );

            return s.website ? (
              <a
                key={s.id}
                href={s.website}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                {content}
              </a>
            ) : (
              <div key={s.id}>{content}</div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

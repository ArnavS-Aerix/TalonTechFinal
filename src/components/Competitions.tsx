import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, MapPin, Calendar, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Competition = {
  id: string;
  name: string;
  date: string;
  venue: string;
  city: string | null;
  state: string | null;
  status: string;
};

export default function Competitions() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('competitions')
        .select('id, name, date, venue, city, state, status')
        .order('date', { ascending: true });
      setCompetitions((data ?? []) as Competition[]);
      setLoading(false);
    })();
  }, []);

  const upcoming = competitions.filter((c) => c.status === 'upcoming');
  const past = competitions.filter((c) => c.status === 'completed');

  return (
    <section className="py-20 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-brand-gold mb-3">
            Competition Schedule
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-brand-navy tracking-tight">
            Upcoming & Past Events
          </h2>
          <p className="text-gray-500 mt-3 max-w-2xl mx-auto">
            Follow our season — click any event for full details, venue info, and results.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-3 border-brand-gold/30 border-t-brand-gold rounded-full animate-spin" />
          </div>
        ) : competitions.length === 0 ? (
          <div className="text-center py-12">
            <Trophy size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No competitions scheduled yet. Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-8">
            {upcoming.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-brand-navy mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full" /> Upcoming
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcoming.map((c) => (
                    <CompetitionCard key={c.id} competition={c} />
                  ))}
                </div>
              </div>
            )}
            {past.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-brand-navy mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-gray-400 rounded-full" /> Past Events
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {past.map((c) => (
                    <CompetitionCard key={c.id} competition={c} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function CompetitionCard({ competition: c }: { competition: Competition }) {
  const dateObj = new Date(c.date + 'T00:00:00');
  const day = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
  const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
  const dayNum = dateObj.getDate();
  const year = dateObj.getFullYear();
  const locationStr = [c.city, c.state].filter(Boolean).join(', ');

  return (
    <Link
      to={`/competition/${c.id}`}
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-brand-gold/40 transition-all overflow-hidden"
    >
      <div className="flex">
        <div className="shrink-0 w-20 bg-brand-navy text-white flex flex-col items-center justify-center py-5">
          <span className="text-xs font-semibold uppercase text-brand-gold">{month}</span>
          <span className="text-3xl font-extrabold leading-none">{dayNum}</span>
          <span className="text-xs text-white/50 mt-1">{year}</span>
        </div>
        <div className="flex-1 p-5 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-bold text-brand-navy text-sm leading-snug group-hover:text-brand-gold transition-colors">
              {c.name}
            </h4>
            <ChevronRight size={16} className="text-gray-300 group-hover:text-brand-gold group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
          </div>
          <div className="mt-3 space-y-1.5 text-xs text-gray-500">
            <p className="flex items-center gap-1.5">
              <MapPin size={12} className="text-brand-gold shrink-0" />
              <span className="truncate">{c.venue}{locationStr ? ` · ${locationStr}` : ''}</span>
            </p>
            <p className="flex items-center gap-1.5">
              <Calendar size={12} className="text-brand-gold shrink-0" />
              <span>{day}, {month} {dayNum}, {year}</span>
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

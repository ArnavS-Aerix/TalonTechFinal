import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, Trophy, MapPin, Calendar, Clock, CheckCircle2, XCircle,
  Navigation, Edit, Save, Loader2, X,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type Competition = {
  id: string;
  name: string;
  date: string;
  venue: string;
  address: string | null;
  city: string | null;
  state: string | null;
  description: string | null;
  status: string;
  results: string | null;
};

const ADMIN_PW = 'TalonTech@2026!!';

export default function CompetitionDetail() {
  const { id } = useParams<{ id: string }>();
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);
  const [pw, setPw] = useState('');
  const [pwOk, setPwOk] = useState(false);
  const [editForm, setEditForm] = useState<Competition | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const { data } = await supabase
        .from('competitions')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (data) setCompetition(data as Competition);
      setLoading(false);
    })();
  }, [id]);

  const handlePwSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw === ADMIN_PW) {
      setPwOk(true);
      setEditForm(competition ? { ...competition } : null);
    } else {
      alert('Incorrect password.');
    }
  };

  const handleSave = async () => {
    if (!editForm) return;
    setSaving(true);
    const { error } = await supabase
      .from('competitions')
      .update({
        name: editForm.name,
        date: editForm.date,
        venue: editForm.venue,
        address: editForm.address,
        city: editForm.city,
        state: editForm.state,
        description: editForm.description,
        status: editForm.status,
        results: editForm.results,
        updated_at: new Date().toISOString(),
      })
      .eq('id', editForm.id);
    setSaving(false);
    if (error) { alert('Failed: ' + error.message); return; }
    setCompetition({ ...editForm });
    setShowAdmin(false);
    setPwOk(false);
    setPw('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-gold" size={32} />
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 pb-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <Trophy size={48} className="text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-brand-navy mb-2">Competition Not Found</h1>
          <Link to="/" className="text-brand-gold hover:underline">Back to Home</Link>
        </div>
      </div>
    );
  }

  const dateObj = new Date(competition.date + 'T00:00:00');
  const dateStr = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const locationStr = [competition.city, competition.state].filter(Boolean).join(', ');
  const mapsQuery = encodeURIComponent([competition.venue, competition.address, locationStr].filter(Boolean).join(', '));

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="flex items-center gap-2 text-gray-500 hover:text-brand-navy font-medium mb-6 transition-colors">
          <ArrowLeft size={20} /> Back to Home
        </Link>

        {!showAdmin && (
          <button
            onClick={() => setShowAdmin(true)}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-brand-navy mb-4 transition-colors"
          >
            <Edit size={12} /> Admin
          </button>
        )}

        {showAdmin && !pwOk && (
          <form onSubmit={handlePwSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 flex items-center gap-3">
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Admin password"
              className="flex-1 px-4 py-2 rounded-lg border border-gray-200 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 outline-none text-sm"
              autoFocus
            />
            <button type="submit" className="btn-primary text-sm">Unlock</button>
            <button type="button" onClick={() => { setShowAdmin(false); setPw(''); }} className="p-2 text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </form>
        )}

        {pwOk && editForm ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-brand-navy flex items-center gap-2"><Edit size={18} className="text-brand-gold" /> Edit Competition</h2>
              <button onClick={() => { setShowAdmin(false); setPwOk(false); setPw(''); }} className="p-2 text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Name</label>
              <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 outline-none text-sm" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date</label>
                <input type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
                <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 outline-none text-sm">
                  <option value="upcoming">Upcoming</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Venue</label>
              <input type="text" value={editForm.venue} onChange={(e) => setEditForm({ ...editForm, venue: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 outline-none text-sm" />
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Address</label>
                <input type="text" value={editForm.address ?? ''} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">City</label>
                <input type="text" value={editForm.city ?? ''} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">State</label>
                <input type="text" value={editForm.state ?? ''} onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 outline-none text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
              <textarea rows={4} value={editForm.description ?? ''} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 outline-none text-sm resize-y" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Results</label>
              <textarea rows={3} value={editForm.results ?? ''} onChange={(e) => setEditForm({ ...editForm, results: e.target.value })}
                placeholder="Tournament results, rankings, awards..."
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 outline-none text-sm resize-y" />
            </div>
            <button onClick={handleSave} disabled={saving} className="btn-primary text-sm disabled:opacity-60">
              {saving ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : <><Save size={16} /> Save Changes</>}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-brand-navy p-6 md:p-8">
                <div className="flex items-center gap-2 mb-3">
                  {competition.status === 'completed' && <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-500/20 text-green-300"><CheckCircle2 size={12} /> Completed</span>}
                  {competition.status === 'upcoming' && <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-gold/20 text-brand-gold"><Clock size={12} /> Upcoming</span>}
                  {competition.status === 'cancelled' && <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/20 text-red-300"><XCircle size={12} /> Cancelled</span>}
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">{competition.name}</h1>
              </div>
              <div className="p-6 md:p-8 space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar size={20} className="text-brand-gold shrink-0 mt-0.5" />
                  <div><p className="font-semibold text-brand-navy text-sm">Date</p><p className="text-gray-600 text-sm">{dateStr}</p></div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin size={20} className="text-brand-gold shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-semibold text-brand-navy text-sm">Venue</p>
                    <p className="text-gray-600 text-sm">{competition.venue}</p>
                    {competition.address && <p className="text-gray-500 text-xs mt-0.5">{competition.address}</p>}
                    {locationStr && <p className="text-gray-500 text-xs">{locationStr}</p>}
                    <a href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-brand-gold hover:underline mt-1.5">
                      <Navigation size={12} /> Open in Google Maps
                    </a>
                  </div>
                </div>
                {competition.description && (
                  <div className="pt-4 border-t border-gray-100">
                    <p className="font-semibold text-brand-navy text-sm mb-2">About This Event</p>
                    <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{competition.description}</p>
                  </div>
                )}
                {competition.results && (
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy size={16} className="text-brand-gold" />
                      <p className="font-semibold text-brand-navy text-sm">Results</p>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{competition.results}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

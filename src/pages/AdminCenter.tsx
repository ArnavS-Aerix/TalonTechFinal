import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  Building2, Upload, Trash2, Plus, Loader2, Image as ImageIcon, Palette, Settings,
  Handshake, Heart, Clock, User, Mail, Phone, Globe, ExternalLink, Save,
  CheckCircle, Camera, DollarSign, ArrowLeft,
} from 'lucide-react';
import { Link } from 'react-router-dom';

type Sponsor = {
  id: string; name: string; logo_path: string | null; website: string | null;
  sort_order: number; placement: string; comments: string | null; created_at: string;
};

type Sponsorship = {
  id: string; company_name: string; contact_name: string; email: string;
  phone: string | null; tier: string; amount: number; message: string | null;
  website: string | null; created_at: string;
};

type Donation = {
  id: string; name: string; email: string; phone: string | null;
  amount: number; message: string | null; is_anonymous: boolean; created_at: string;
};

type SitePhoto = {
  id: string; photo_path: string; caption: string | null; sort_order: number; created_at: string;
};

type SiteSettings = {
  hero_bg_type: string; hero_bg_color: string; hero_bg_image_path: string | null;
};

type Tab = 'sponsors' | 'photos' | 'hero' | 'sponsorships' | 'donations';

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function tierColor(tier: string) {
  switch (tier) {
    case 'Bronze': return 'bg-amber-100 text-amber-800';
    case 'Silver': return 'bg-slate-100 text-slate-700';
    case 'Gold': return 'bg-yellow-100 text-yellow-800';
    case 'Platinum': return 'bg-brand-navy/10 text-brand-navy';
    default: return 'bg-gray-100 text-gray-700';
  }
}

export default function AdminCenter() {
  const [activeTab, setActiveTab] = useState<Tab>('sponsors');

  // Sponsors
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loadingSponsors, setLoadingSponsors] = useState(true);
  const [sponsorForm, setSponsorForm] = useState({ name: '', website: '', placement: 'carousel' as 'hero' | 'carousel', comments: '' });
  const [sponsorLogoFile, setSponsorLogoFile] = useState<File | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [savingSponsor, setSavingSponsor] = useState(false);

  // Photos
  const [photos, setPhotos] = useState<SitePhoto[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoCaption, setPhotoCaption] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Hero settings
  const [heroSettings, setHeroSettings] = useState<SiteSettings>({ hero_bg_type: 'color', hero_bg_color: '#0a1628', hero_bg_image_path: null });
  const [loadingHero, setLoadingHero] = useState(true);
  const [heroImageFile, setHeroImageFile] = useState<File | null>(null);
  const [savingHero, setSavingHero] = useState(false);

  // Sponsorships
  const [sponsorships, setSponsorships] = useState<Sponsorship[]>([]);
  const [loadingSponsorships, setLoadingSponsorships] = useState(true);

  // Donations
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loadingDonations, setLoadingDonations] = useState(true);

  const loadSponsors = useCallback(async () => {
    setLoadingSponsors(true);
    const { data } = await supabase.from('sponsors').select('*').order('created_at', { ascending: false });
    setSponsors((data ?? []) as Sponsor[]);
    setLoadingSponsors(false);
  }, []);

  const loadPhotos = useCallback(async () => {
    setLoadingPhotos(true);
    const { data } = await supabase.from('site_photos').select('*').order('sort_order', { ascending: true });
    setPhotos((data ?? []) as SitePhoto[]);
    setLoadingPhotos(false);
  }, []);

  const loadHeroSettings = useCallback(async () => {
    setLoadingHero(true);
    const { data } = await supabase.from('site_settings').select('hero_bg_type, hero_bg_color, hero_bg_image_path').eq('id', 1).maybeSingle();
    if (data) setHeroSettings(data as SiteSettings);
    setLoadingHero(false);
  }, []);

  const loadSponsorships = useCallback(async () => {
    setLoadingSponsorships(true);
    const { data } = await supabase.from('sponsorships').select('*').order('created_at', { ascending: false });
    setSponsorships((data ?? []) as Sponsorship[]);
    setLoadingSponsorships(false);
  }, []);

  const loadDonations = useCallback(async () => {
    setLoadingDonations(true);
    const { data } = await supabase.from('donations').select('*').order('created_at', { ascending: false });
    setDonations((data ?? []) as Donation[]);
    setLoadingDonations(false);
  }, []);

  useEffect(() => { loadSponsors(); }, [loadSponsors]);

  const tabs: { id: Tab; label: string; icon: typeof Building2 }[] = [
    { id: 'sponsors', label: 'Sponsors', icon: Building2 },
    { id: 'photos', label: 'Photos', icon: Camera },
    { id: 'hero', label: 'Hero Background', icon: Palette },
    { id: 'sponsorships', label: 'Sponsorship Forms', icon: Handshake },
    { id: 'donations', label: 'Donation Forms', icon: Heart },
  ];

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    if (tab === 'sponsors' && sponsors.length === 0) loadSponsors();
    if (tab === 'photos' && photos.length === 0) loadPhotos();
    if (tab === 'hero' && heroSettings.hero_bg_color === '#0a1628' && !loadingHero) loadHeroSettings();
    if (tab === 'sponsorships' && sponsorships.length === 0) loadSponsorships();
    if (tab === 'donations' && donations.length === 0) loadDonations();
  };

  // ── Sponsor handlers ──
  const handleAddSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sponsorForm.name.trim()) return;
    setSavingSponsor(true);
    let logoPath: string | null = null;
    if (sponsorLogoFile) {
      setUploadingLogo(true);
      const ext = sponsorLogoFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage.from('sponsor-logos').upload(fileName, sponsorLogoFile);
      setUploadingLogo(false);
      if (upErr) { setSavingSponsor(false); alert('Logo upload failed: ' + upErr.message); return; }
      logoPath = fileName;
    }
    const { error } = await supabase.from('sponsors').insert({
      name: sponsorForm.name.trim(),
      logo_path: logoPath,
      website: sponsorForm.website.trim() || null,
      sort_order: sponsors.length,
      placement: sponsorForm.placement,
      comments: sponsorForm.comments.trim() || null,
    });
    setSavingSponsor(false);
    if (error) { alert('Failed to add sponsor: ' + error.message); return; }
    setSponsorForm({ name: '', website: '', placement: 'carousel', comments: '' });
    setSponsorLogoFile(null);
    loadSponsors();
  };

  const handleDeleteSponsor = async (s: Sponsor) => {
    if (!confirm(`Delete sponsor "${s.name}"?`)) return;
    if (s.logo_path) await supabase.storage.from('sponsor-logos').remove([s.logo_path]);
    await supabase.from('sponsors').delete().eq('id', s.id);
    loadSponsors();
  };

  // ── Photo handlers ──
  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoFile) return;
    setUploadingPhoto(true);
    const ext = photoFile.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: upErr } = await supabase.storage.from('progress-photos').upload(fileName, photoFile);
    if (upErr) { setUploadingPhoto(false); alert('Upload failed: ' + upErr.message); return; }
    const { error } = await supabase.from('site_photos').insert({
      photo_path: fileName,
      caption: photoCaption.trim() || null,
      sort_order: photos.length,
    });
    setUploadingPhoto(false);
    if (error) { alert('Failed to save photo: ' + error.message); return; }
    setPhotoFile(null);
    setPhotoCaption('');
    loadPhotos();
  };

  const handleDeletePhoto = async (p: SitePhoto) => {
    if (!confirm('Delete this photo?')) return;
    await supabase.storage.from('progress-photos').remove([p.photo_path]);
    await supabase.from('site_photos').delete().eq('id', p.id);
    loadPhotos();
  };

  // ── Hero settings handlers ──
  const handleSaveHero = async () => {
    setSavingHero(true);
    let imagePath = heroSettings.hero_bg_image_path;
    if (heroImageFile) {
      const ext = heroImageFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage.from('hero-images').upload(fileName, heroImageFile);
      if (upErr) { setSavingHero(false); alert('Image upload failed: ' + upErr.message); return; }
      if (imagePath) await supabase.storage.from('hero-images').remove([imagePath]);
      imagePath = fileName;
    }
    const { error } = await supabase.from('site_settings').update({
      hero_bg_type: heroSettings.hero_bg_type,
      hero_bg_color: heroSettings.hero_bg_color,
      hero_bg_image_path: heroSettings.hero_bg_type === 'image' ? imagePath : null,
      updated_at: new Date().toISOString(),
    }).eq('id', 1);
    setSavingHero(false);
    if (error) { alert('Failed to save: ' + error.message); return; }
    setHeroImageFile(null);
    alert('Hero background updated!');
  };

  // ── Sponsorship / Donation delete ──
  const handleDeleteSponsorship = async (s: Sponsorship) => {
    if (!confirm(`Delete submission from ${s.company_name}?`)) return;
    await supabase.from('sponsorships').delete().eq('id', s.id);
    loadSponsorships();
  };

  const handleDeleteDonation = async (d: Donation) => {
    if (!confirm(`Delete donation from ${d.is_anonymous ? 'Anonymous' : d.name}?`)) return;
    await supabase.from('donations').delete().eq('id', d.id);
    loadDonations();
  };

  const totalSponsorship = sponsorships.reduce((sum, s) => sum + Number(s.amount), 0);
  const totalDonations = donations.reduce((sum, d) => sum + Number(d.amount), 0);

  const heroSponsors = sponsors.filter((s) => s.placement === 'hero');
  const carouselSponsors = sponsors.filter((s) => s.placement === 'carousel');

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        <Link to="/" className="flex items-center gap-2 text-gray-500 hover:text-brand-navy font-medium mb-6 transition-colors">
          <ArrowLeft size={20} /> Back to Home
        </Link>

        <h1 className="text-3xl md:text-4xl font-extrabold text-brand-navy tracking-tight mb-2">Admin Center</h1>
        <p className="text-gray-500 mb-8">Manage sponsors, photos, hero background, and view submissions.</p>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 pb-4">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => handleTabChange(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === t.id
                    ? 'bg-brand-navy text-white shadow-md'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-brand-gold hover:text-brand-navy'
                }`}
              >
                <Icon size={16} /> {t.label}
              </button>
            );
          })}
        </div>

        {/* ── Sponsors tab ── */}
        {activeTab === 'sponsors' && (
          <>
            <form onSubmit={handleAddSponsor} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8 space-y-5">
              <h2 className="text-xl font-bold text-brand-navy flex items-center gap-2"><Plus size={18} className="text-brand-gold" /> Add Sponsor</h2>
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Sponsor Name *</label>
                  <input type="text" value={sponsorForm.name} onChange={(e) => setSponsorForm({ ...sponsorForm, name: e.target.value })} placeholder="e.g. Acme Corp"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 outline-none transition-all text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Website</label>
                  <input type="url" value={sponsorForm.website} onChange={(e) => setSponsorForm({ ...sponsorForm, website: e.target.value })} placeholder="https://acme.com"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 outline-none transition-all text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Placement</label>
                <select value={sponsorForm.placement} onChange={(e) => setSponsorForm({ ...sponsorForm, placement: e.target.value as 'hero' | 'carousel' })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 outline-none transition-all text-sm">
                  <option value="carousel">Carousel (rotating slides)</option>
                  <option value="hero">Logo Grid (above Team section)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Comments (admin only)</label>
                <textarea rows={2} value={sponsorForm.comments} onChange={(e) => setSponsorForm({ ...sponsorForm, comments: e.target.value })}
                  placeholder="Internal notes — e.g. 'Gold tier, $5000/year, contact John'"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 outline-none transition-all text-sm resize-y" />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Logo Image</label>
                  <label className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-brand-gold transition-colors text-sm text-gray-600">
                    {uploadingLogo ? <><Loader2 size={16} className="animate-spin" /> Uploading…</> : <><Upload size={16} /> {sponsorLogoFile ? sponsorLogoFile.name : 'Choose a logo (PNG, JPG)'}</>}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && setSponsorLogoFile(e.target.files[0])} />
                  </label>
                </div>
                <button type="submit" disabled={savingSponsor} className="btn-primary text-sm disabled:opacity-60 sm:mt-6">
                  {savingSponsor ? <><Loader2 size={16} className="animate-spin" /> Adding…</> : <><Plus size={16} /> Add Sponsor</>}
                </button>
              </div>
            </form>

            {loadingSponsors ? (
              <div className="flex items-center justify-center py-8 text-gray-400"><Loader2 className="animate-spin" size={20} /></div>
            ) : sponsors.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">No sponsors yet. Add one above.</p>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-brand-navy mb-3 flex items-center gap-2"><ImageIcon size={14} className="text-brand-gold" /> Logo Grid (above Team)</h3>
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {heroSponsors.map((s) => (
                      <div key={s.id} className="flex items-start gap-3 bg-gray-50 rounded-lg p-3 border border-gray-100">
                        {s.logo_path ? (
                          <img src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/sponsor-logos/${s.logo_path}`} alt={s.name} className="w-12 h-12 object-contain rounded shrink-0" />
                        ) : (
                          <div className="w-12 h-12 bg-brand-navy/5 rounded flex items-center justify-center shrink-0"><Building2 size={18} className="text-brand-navy/30" /></div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-brand-navy text-sm truncate">{s.name}</p>
                          {s.website && <a href={s.website} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-brand-gold flex items-center gap-1 truncate">{s.website} <ExternalLink size={10} /></a>}
                          {s.comments && <p className="text-xs text-gray-400 mt-1 italic truncate" title={s.comments}>{s.comments}</p>}
                        </div>
                        <button onClick={() => handleDeleteSponsor(s)} className="p-1.5 text-gray-300 hover:text-red-500 transition-colors shrink-0"><Trash2 size={14} /></button>
                      </div>
                    ))}
                    {heroSponsors.length === 0 && <p className="text-gray-400 text-xs col-span-full py-2">None in the logo grid yet.</p>}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-brand-navy mb-3 flex items-center gap-2"><Building2 size={14} className="text-brand-gold" /> Carousel (rotating)</h3>
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {carouselSponsors.map((s) => (
                      <div key={s.id} className="flex items-start gap-3 bg-gray-50 rounded-lg p-3 border border-gray-100">
                        {s.logo_path ? (
                          <img src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/sponsor-logos/${s.logo_path}`} alt={s.name} className="w-12 h-12 object-contain rounded shrink-0" />
                        ) : (
                          <div className="w-12 h-12 bg-brand-navy/5 rounded flex items-center justify-center shrink-0"><Building2 size={18} className="text-brand-navy/30" /></div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-brand-navy text-sm truncate">{s.name}</p>
                          {s.website && <a href={s.website} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-brand-gold flex items-center gap-1 truncate">{s.website} <ExternalLink size={10} /></a>}
                          {s.comments && <p className="text-xs text-gray-400 mt-1 italic truncate" title={s.comments}>{s.comments}</p>}
                        </div>
                        <button onClick={() => handleDeleteSponsor(s)} className="p-1.5 text-gray-300 hover:text-red-500 transition-colors shrink-0"><Trash2 size={14} /></button>
                      </div>
                    ))}
                    {carouselSponsors.length === 0 && <p className="text-gray-400 text-xs col-span-full py-2">None in the carousel yet.</p>}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Photos tab ── */}
        {activeTab === 'photos' && (
          <>
            <form onSubmit={handleAddPhoto} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8 space-y-5">
              <h2 className="text-xl font-bold text-brand-navy flex items-center gap-2"><Camera size={18} className="text-brand-gold" /> Add Photo to Carousel</h2>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Photo</label>
                <label className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-brand-gold transition-colors text-sm text-gray-600">
                  {uploadingPhoto ? <><Loader2 size={16} className="animate-spin" /> Uploading…</> : <><Upload size={16} /> {photoFile ? photoFile.name : 'Choose a photo (PNG, JPG)'}</>}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && setPhotoFile(e.target.files[0])} />
                </label>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Caption (optional)</label>
                <input type="text" value={photoCaption} onChange={(e) => setPhotoCaption(e.target.value)} placeholder="e.g. Building the drivetrain"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 outline-none transition-all text-sm" />
              </div>
              <button type="submit" disabled={uploadingPhoto || !photoFile} className="btn-primary text-sm disabled:opacity-60">
                {uploadingPhoto ? <><Loader2 size={16} className="animate-spin" /> Uploading…</> : <><Plus size={16} /> Add Photo</>}
              </button>
            </form>

            {loadingPhotos ? (
              <div className="flex items-center justify-center py-8 text-gray-400"><Loader2 className="animate-spin" size={20} /></div>
            ) : photos.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">No photos yet. Add one above to populate the carousel.</p>
            ) : (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {photos.map((p) => (
                  <div key={p.id} className="relative group bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                    <div className="aspect-video bg-gray-100">
                      <img src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/progress-photos/${p.photo_path}`} alt={p.caption ?? ''} className="w-full h-full object-cover" />
                    </div>
                    {p.caption && <p className="text-sm text-gray-600 px-3 py-2 truncate">{p.caption}</p>}
                    <button onClick={() => handleDeletePhoto(p)} className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-lg text-gray-400 hover:text-red-500 transition-colors shadow-sm opacity-0 group-hover:opacity-100">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Hero Background tab ── */}
        {activeTab === 'hero' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8 space-y-6">
            <h2 className="text-xl font-bold text-brand-navy flex items-center gap-2"><Palette size={18} className="text-brand-gold" /> Hero Background Settings</h2>
            <p className="text-gray-500 text-sm">Choose a solid color or upload a background image for the hero section at the top of the homepage.</p>

            {loadingHero ? (
              <div className="flex items-center justify-center py-8 text-gray-400"><Loader2 className="animate-spin" size={20} /></div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Background Type</label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setHeroSettings({ ...heroSettings, hero_bg_type: 'color' })}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${heroSettings.hero_bg_type === 'color' ? 'bg-brand-navy text-white' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:border-brand-gold'}`}
                    >
                      <Palette size={16} /> Solid Color
                    </button>
                    <button
                      onClick={() => setHeroSettings({ ...heroSettings, hero_bg_type: 'image' })}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${heroSettings.hero_bg_type === 'image' ? 'bg-brand-navy text-white' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:border-brand-gold'}`}
                    >
                      <ImageIcon size={16} /> Background Image
                    </button>
                  </div>
                </div>

                {heroSettings.hero_bg_type === 'color' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Color</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={heroSettings.hero_bg_color} onChange={(e) => setHeroSettings({ ...heroSettings, hero_bg_color: e.target.value })}
                        className="w-14 h-14 rounded-lg border border-gray-200 cursor-pointer" />
                      <input type="text" value={heroSettings.hero_bg_color} onChange={(e) => setHeroSettings({ ...heroSettings, hero_bg_color: e.target.value })}
                        className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 outline-none transition-all text-sm font-mono" />
                    </div>
                  </div>
                )}

                {heroSettings.hero_bg_type === 'image' && (
                  <div className="space-y-4">
                    {heroSettings.hero_bg_image_path && !heroImageFile && (
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">Current Image</p>
                        <div className="aspect-video max-w-md rounded-xl overflow-hidden border border-gray-200">
                          <img src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/hero-images/${heroSettings.hero_bg_image_path}`} alt="Current hero background" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Upload New Image</label>
                      <label className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-brand-gold transition-colors text-sm text-gray-600">
                        <Upload size={16} /> {heroImageFile ? heroImageFile.name : 'Choose an image (PNG, JPG)'}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && setHeroImageFile(e.target.files[0])} />
                      </label>
                    </div>
                  </div>
                )}

                <button onClick={handleSaveHero} disabled={savingHero} className="btn-primary text-sm disabled:opacity-60">
                  {savingHero ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : <><Save size={16} /> Save Hero Background</>}
                </button>
              </>
            )}
          </div>
        )}

        {/* ── Sponsorships tab ── */}
        {activeTab === 'sponsorships' && (
          <>
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm mb-6 w-fit">
              <Handshake size={18} className="text-brand-gold" />
              <span className="text-sm font-semibold text-brand-navy">{sponsorships.length} submission{sponsorships.length === 1 ? '' : 's'} · ${totalSponsorship.toLocaleString()}</span>
            </div>
            {loadingSponsorships ? (
              <div className="flex items-center justify-center py-16 text-gray-400"><Loader2 className="animate-spin" size={28} /></div>
            ) : sponsorships.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
                <Handshake size={40} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No sponsorship submissions yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sponsorships.map((s) => (
                  <div key={s.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${tierColor(s.tier)}`}>{s.tier}</span>
                          <span className="text-lg font-bold text-brand-navy">${Number(s.amount).toLocaleString()}</span>
                          <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={12} /> {formatDateTime(s.created_at)}</span>
                        </div>
                        <h3 className="font-bold text-brand-navy flex items-center gap-2"><Building2 size={16} className="text-brand-gold" /> {s.company_name}</h3>
                        <div className="grid sm:grid-cols-2 gap-2 mt-3 text-sm text-gray-600">
                          <p className="flex items-center gap-2"><User size={14} className="text-gray-400" /> {s.contact_name}</p>
                          <p className="flex items-center gap-2"><Mail size={14} className="text-gray-400" /> <a href={`mailto:${s.email}`} className="hover:text-brand-navy">{s.email}</a></p>
                          {s.phone && <p className="flex items-center gap-2"><Phone size={14} className="text-gray-400" /> {s.phone}</p>}
                          {s.website && <p className="flex items-center gap-2"><Globe size={14} className="text-gray-400" /> <a href={s.website} target="_blank" rel="noopener noreferrer" className="hover:text-brand-navy flex items-center gap-1">{s.website} <ExternalLink size={10} /></a></p>}
                        </div>
                        {s.message && <p className="text-sm text-gray-500 mt-3 bg-gray-50 rounded-lg p-3">{s.message}</p>}
                      </div>
                      <button onClick={() => handleDeleteSponsorship(s)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors shrink-0"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Donations tab ── */}
        {activeTab === 'donations' && (
          <>
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm mb-6 w-fit">
              <Heart size={18} className="text-brand-gold" />
              <span className="text-sm font-semibold text-brand-navy">{donations.length} donation{donations.length === 1 ? '' : 's'} · ${totalDonations.toLocaleString()}</span>
            </div>
            {loadingDonations ? (
              <div className="flex items-center justify-center py-16 text-gray-400"><Loader2 className="animate-spin" size={28} /></div>
            ) : donations.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
                <Heart size={40} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No donation submissions yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {donations.map((d) => (
                  <div key={d.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className="text-lg font-bold text-brand-navy">${Number(d.amount).toLocaleString()}</span>
                          {d.is_anonymous && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">Anonymous</span>}
                          <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={12} /> {formatDateTime(d.created_at)}</span>
                        </div>
                        <h3 className="font-bold text-brand-navy">{d.is_anonymous ? 'Anonymous Donor' : d.name}</h3>
                        <div className="grid sm:grid-cols-2 gap-2 mt-3 text-sm text-gray-600">
                          <p className="flex items-center gap-2"><Mail size={14} className="text-gray-400" /> <a href={`mailto:${d.email}`} className="hover:text-brand-navy">{d.email}</a></p>
                          {d.phone && <p className="flex items-center gap-2"><Phone size={14} className="text-gray-400" /> {d.phone}</p>}
                        </div>
                        {d.message && <p className="text-sm text-gray-500 mt-3 bg-gray-50 rounded-lg p-3">{d.message}</p>}
                      </div>
                      <button onClick={() => handleDeleteDonation(d)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors shrink-0"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

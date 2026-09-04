import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  Building2, Upload, Trash2, Plus, Loader2, Image as ImageIcon, Palette,
  Handshake, Heart, Clock, User, Mail, Phone, Globe, ExternalLink, Save,
  Camera, ArrowLeft, Lock, KeyRound, Mail as MailIcon, Send, Sparkles,
  FileText, Calendar, ToggleLeft, ToggleRight, Eye, EyeOff,
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
type SiteSettings = {
  hero_bg_type: string; hero_bg_color: string; hero_bg_image_path: string | null;
};
type NewsletterIssue = {
  id: string; subject: string; body_html: string; status: string;
  sent_at: string | null; recipient_count: number | null; created_at: string; source: string | null;
};
type ProgressEntry = {
  id: string; title: string; body: string; category: string; week_of: string; reported: boolean; created_at: string;
};
type NotebookEntry = {
  id: string; title: string; body: string; entry_date: string; reported: boolean; created_at: string;
};
type NewsletterSchedule = {
  auto_send: boolean; day_of_week: number; send_time: string; last_sent_at: string | null;
};

type Tab = 'sponsors' | 'hero' | 'newsletter' | 'content' | 'settings' | 'sponsorships' | 'donations';

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
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const CATEGORIES = ['build', 'competition', 'outreach', 'fundraising', 'other'] as const;

export default function AdminCenter() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [showPw, setShowPw] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'TalonTech@2026!!') {
      setAuthed(true);
      setAuthError('');
    } else {
      setAuthError('Incorrect password.');
    }
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 pb-16 px-4 flex items-center justify-center">
        <div className="max-w-md w-full">
          <Link to="/" className="flex items-center gap-2 text-gray-500 hover:text-brand-navy font-medium mb-6 transition-colors">
            <ArrowLeft size={20} /> Back to Home
          </Link>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <div className="w-14 h-14 bg-brand-navy/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Lock className="text-brand-navy" size={28} />
            </div>
            <h1 className="text-2xl font-extrabold text-brand-navy text-center mb-2">Admin Center</h1>
            <p className="text-gray-500 text-sm text-center mb-6">Enter the admin password to continue.</p>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Admin password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-200 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 outline-none transition-all text-sm"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {authError && <p className="text-red-500 text-sm">{authError}</p>}
              <button type="submit" className="btn-primary w-full">Unlock</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return <AdminDashboard />;
}

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('sponsors');

  // Sponsors
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loadingSponsors, setLoadingSponsors] = useState(true);
  const [sponsorForm, setSponsorForm] = useState({ name: '', website: '', placement: 'carousel' as 'hero' | 'carousel', comments: '' });
  const [sponsorLogoFile, setSponsorLogoFile] = useState<File | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [savingSponsor, setSavingSponsor] = useState(false);

  // Hero settings
  const [heroSettings, setHeroSettings] = useState<SiteSettings>({ hero_bg_type: 'color', hero_bg_color: '#0a1628', hero_bg_image_path: null });
  const [loadingHero, setLoadingHero] = useState(true);
  const [heroImageFile, setHeroImageFile] = useState<File | null>(null);
  const [savingHero, setSavingHero] = useState(false);

  // Newsletter
  const [issues, setIssues] = useState<NewsletterIssue[]>([]);
  const [loadingIssues, setLoadingIssues] = useState(true);
  const [schedule, setSchedule] = useState<NewsletterSchedule | null>(null);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [genResult, setGenResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Content
  const [progressEntries, setProgressEntries] = useState<ProgressEntry[]>([]);
  const [notebookEntries, setNotebookEntries] = useState<NotebookEntry[]>([]);
  const [loadingContent, setLoadingContent] = useState(true);
  const [progressForm, setProgressForm] = useState({ title: '', body: '', category: 'build' as string });
  const [notebookForm, setNotebookForm] = useState({ title: '', body: '', entry_date: new Date().toISOString().slice(0, 10) });
  const [savingProgress, setSavingProgress] = useState(false);
  const [savingNotebook, setSavingNotebook] = useState(false);

  // Settings (API keys)
  const [secretForm, setSecretForm] = useState({ gemini_api_key: '', postmark_server_token: '', from_email: '', site_url: '' });
  const [savingSecret, setSavingSecret] = useState<string | null>(null);
  const [secretStatus, setSecretStatus] = useState<{ name: string; ok: boolean; message: string } | null>(null);

  // Sponsorships & Donations
  const [sponsorships, setSponsorships] = useState<Sponsorship[]>([]);
  const [loadingSponsorships, setLoadingSponsorships] = useState(true);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loadingDonations, setLoadingDonations] = useState(true);

  const ADMIN_PW = 'TalonTech@2026!!';
  const fnBase = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

  const loadSponsors = useCallback(async () => {
    setLoadingSponsors(true);
    const { data } = await supabase.from('sponsors').select('*').order('created_at', { ascending: false });
    setSponsors((data ?? []) as Sponsor[]);
    setLoadingSponsors(false);
  }, []);

  const loadHeroSettings = useCallback(async () => {
    setLoadingHero(true);
    const { data } = await supabase.from('site_settings').select('hero_bg_type, hero_bg_color, hero_bg_image_path').eq('id', 1).maybeSingle();
    if (data) setHeroSettings(data as SiteSettings);
    setLoadingHero(false);
  }, []);

  const loadIssues = useCallback(async () => {
    setLoadingIssues(true);
    const { data } = await supabase.from('newsletter_issues').select('*').order('created_at', { ascending: false });
    setIssues((data ?? []) as NewsletterIssue[]);
    setLoadingIssues(false);
  }, []);

  const loadSchedule = useCallback(async () => {
    const { data } = await supabase.from('newsletter_schedule').select('*').eq('id', 1).maybeSingle();
    if (data) setSchedule(data as NewsletterSchedule);
  }, []);

  const loadContent = useCallback(async () => {
    setLoadingContent(true);
    const [{ data: pe }, { data: ne }] = await Promise.all([
      supabase.from('progress_entries').select('*').order('created_at', { ascending: false }),
      supabase.from('notebook_entries').select('*').order('entry_date', { ascending: false }),
    ]);
    setProgressEntries((pe ?? []) as ProgressEntry[]);
    setNotebookEntries((ne ?? []) as NotebookEntry[]);
    setLoadingContent(false);
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

  useEffect(() => { loadSponsors(); loadHeroSettings(); }, [loadSponsors, loadHeroSettings]);

  const tabs: { id: Tab; label: string; icon: typeof Building2 }[] = [
    { id: 'sponsors', label: 'Sponsors', icon: Building2 },
    { id: 'hero', label: 'Hero Background', icon: Palette },
    { id: 'newsletter', label: 'Newsletter', icon: MailIcon },
    { id: 'content', label: 'Content', icon: FileText },
    { id: 'settings', label: 'API Keys', icon: KeyRound },
    { id: 'sponsorships', label: 'Sponsor Forms', icon: Handshake },
    { id: 'donations', label: 'Donation Forms', icon: Heart },
  ];

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    if (tab === 'newsletter') { loadIssues(); loadSchedule(); }
    if (tab === 'content') loadContent();
    if (tab === 'sponsorships') loadSponsorships();
    if (tab === 'donations') loadDonations();
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
      name: sponsorForm.name.trim(), logo_path: logoPath, website: sponsorForm.website.trim() || null,
      sort_order: sponsors.length, placement: sponsorForm.placement, comments: sponsorForm.comments.trim() || null,
    });
    setSavingSponsor(false);
    if (error) { alert('Failed: ' + error.message); return; }
    setSponsorForm({ name: '', website: '', placement: 'carousel', comments: '' });
    setSponsorLogoFile(null);
    loadSponsors();
  };

  const handleDeleteSponsor = async (s: Sponsor) => {
    if (!confirm(`Delete "${s.name}"?`)) return;
    if (s.logo_path) await supabase.storage.from('sponsor-logos').remove([s.logo_path]);
    await supabase.from('sponsors').delete().eq('id', s.id);
    loadSponsors();
  };

  // ── Hero settings ──
  const handleSaveHero = async () => {
    setSavingHero(true);
    let imagePath = heroSettings.hero_bg_image_path;
    if (heroImageFile) {
      const ext = heroImageFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage.from('hero-images').upload(fileName, heroImageFile);
      if (upErr) { setSavingHero(false); alert('Upload failed: ' + upErr.message); return; }
      if (imagePath) await supabase.storage.from('hero-images').remove([imagePath]);
      imagePath = fileName;
    }
    const { error } = await supabase.from('site_settings').update({
      hero_bg_type: heroSettings.hero_bg_type, hero_bg_color: heroSettings.hero_bg_color,
      hero_bg_image_path: heroSettings.hero_bg_type === 'image' ? imagePath : null, updated_at: new Date().toISOString(),
    }).eq('id', 1);
    setSavingHero(false);
    if (error) { alert('Failed: ' + error.message); return; }
    setHeroImageFile(null);
    alert('Hero background saved!');
  };

  // ── Newsletter handlers ──
  const handleGenerate = async () => {
    setGenerating(true);
    setGenResult(null);
    try {
      const res = await fetch(`${fnBase}/generate-newsletter`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_password: ADMIN_PW }),
      });
      const json = await res.json();
      if (!res.ok) { setGenResult({ ok: false, message: json.error ?? 'Generation failed.' }); }
      else { setGenResult({ ok: true, message: `Generated "${json.subject ?? 'issue'}". ${json.sent ? 'Sent to subscribers.' : 'Saved as draft.'}` }); loadIssues(); }
    } catch (err) { setGenResult({ ok: false, message: String(err) }); }
    setGenerating(false);
  };

  const handleSendIssue = async (issueId: string) => {
    setSending(issueId);
    try {
      const res = await fetch(`${fnBase}/send-newsletter`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issue_id: issueId, admin_password: ADMIN_PW }),
      });
      const json = await res.json();
      if (!res.ok) { alert(json.error ?? 'Send failed.'); }
      else { alert(`Sent to ${json.sent ?? 0} subscribers (${json.failed ?? 0} failed).`); loadIssues(); }
    } catch (err) { alert(String(err)); }
    setSending(null);
  };

  const handleToggleAutoSend = async () => {
    if (!schedule) return;
    const newVal = !schedule.auto_send;
    await supabase.from('newsletter_schedule').update({ auto_send: newVal, updated_at: new Date().toISOString() }).eq('id', 1);
    setSchedule({ ...schedule, auto_send: newVal });
  };

  const handleUpdateSchedule = async (field: 'day_of_week' | 'send_time', value: string | number) => {
    if (!schedule) return;
    const updated = { ...schedule, [field]: value };
    setSchedule(updated);
    await supabase.from('newsletter_schedule').update({ [field]: value, updated_at: new Date().toISOString() }).eq('id', 1);
  };

  // ── Content handlers ──
  const handleAddProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!progressForm.title.trim() || !progressForm.body.trim()) return;
    setSavingProgress(true);
    const { error } = await supabase.from('progress_entries').insert({
      title: progressForm.title.trim(), body: progressForm.body.trim(), category: progressForm.category,
    });
    setSavingProgress(false);
    if (error) { alert('Failed: ' + error.message); return; }
    setProgressForm({ title: '', body: '', category: 'build' });
    loadContent();
  };

  const handleAddNotebook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notebookForm.title.trim() || !notebookForm.body.trim()) return;
    setSavingNotebook(true);
    const { error } = await supabase.from('notebook_entries').insert({
      title: notebookForm.title.trim(), body: notebookForm.body.trim(), entry_date: notebookForm.entry_date,
    });
    setSavingNotebook(false);
    if (error) { alert('Failed: ' + error.message); return; }
    setNotebookForm({ title: '', body: '', entry_date: new Date().toISOString().slice(0, 10) });
    loadContent();
  };

  const handleDeleteProgress = async (id: string) => {
    if (!confirm('Delete this entry?')) return;
    await supabase.from('progress_entries').delete().eq('id', id);
    loadContent();
  };

  const handleDeleteNotebook = async (id: string) => {
    if (!confirm('Delete this entry?')) return;
    await supabase.from('notebook_entries').delete().eq('id', id);
    loadContent();
  };

  // ── Secret handler ──
  const handleSaveSecret = async (name: string) => {
    const value = secretForm[name as keyof typeof secretForm];
    if (!value.trim()) return;
    setSavingSecret(name);
    setSecretStatus(null);
    try {
      const res = await fetch(`${fnBase}/save-secret`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_password: ADMIN_PW, name, value: value.trim() }),
      });
      const json = await res.json();
      if (!res.ok) { setSecretStatus({ name, ok: false, message: json.error ?? 'Failed.' }); }
      else { setSecretStatus({ name, ok: true, message: `${name} saved.` }); }
    } catch (err) { setSecretStatus({ name, ok: false, message: String(err) }); }
    setSavingSecret(null);
  };

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
        <p className="text-gray-500 mb-8">Manage sponsors, hero, newsletter, content, and API keys.</p>

        <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 pb-4">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => handleTabChange(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === t.id ? 'bg-brand-navy text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:border-brand-gold hover:text-brand-navy'}`}>
                <Icon size={16} /> {t.label}
              </button>
            );
          })}
        </div>

        {/* ── Sponsors ── */}
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
                  <option value="hero">Logo Grid (above About section)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Comments (admin only)</label>
                <textarea rows={2} value={sponsorForm.comments} onChange={(e) => setSponsorForm({ ...sponsorForm, comments: e.target.value })}
                  placeholder="Internal notes — e.g. 'Gold tier, $5000/year'"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 outline-none transition-all text-sm resize-y" />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Logo Image</label>
                  <label className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-brand-gold transition-colors text-sm text-gray-600">
                    {uploadingLogo ? <><Loader2 size={16} className="animate-spin" /> Uploading…</> : <><Upload size={16} /> {sponsorLogoFile ? sponsorLogoFile.name : 'Choose a logo'}</>}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && setSponsorLogoFile(e.target.files[0])} />
                  </label>
                </div>
                <button type="submit" disabled={savingSponsor} className="btn-primary text-sm disabled:opacity-60 sm:mt-6">
                  {savingSponsor ? <><Loader2 size={16} className="animate-spin" /> Adding…</> : <><Plus size={16} /> Add Sponsor</>}
                </button>
              </div>
            </form>
            {loadingSponsors ? <div className="flex justify-center py-8 text-gray-400"><Loader2 className="animate-spin" size={20} /></div> : sponsors.length === 0 ? <p className="text-gray-400 text-sm text-center py-6">No sponsors yet.</p> : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-brand-navy mb-3 flex items-center gap-2"><ImageIcon size={14} className="text-brand-gold" /> Logo Grid</h3>
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {heroSponsors.map((s) => (<div key={s.id} className="flex items-start gap-3 bg-gray-50 rounded-lg p-3 border border-gray-100">
                      {s.logo_path ? <img src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/sponsor-logos/${s.logo_path}`} alt={s.name} className="w-12 h-12 object-contain rounded shrink-0" /> : <div className="w-12 h-12 bg-brand-navy/5 rounded flex items-center justify-center shrink-0"><Building2 size={18} className="text-brand-navy/30" /></div>}
                      <div className="min-w-0 flex-1"><p className="font-semibold text-brand-navy text-sm truncate">{s.name}</p>{s.website && <a href={s.website} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-brand-gold flex items-center gap-1 truncate">{s.website} <ExternalLink size={10} /></a>}{s.comments && <p className="text-xs text-gray-400 mt-1 italic truncate" title={s.comments}>{s.comments}</p>}</div>
                      <button onClick={() => handleDeleteSponsor(s)} className="p-1.5 text-gray-300 hover:text-red-500 transition-colors shrink-0"><Trash2 size={14} /></button>
                    </div>))}
                    {heroSponsors.length === 0 && <p className="text-gray-400 text-xs col-span-full py-2">None yet.</p>}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-brand-navy mb-3 flex items-center gap-2"><Building2 size={14} className="text-brand-gold" /> Carousel</h3>
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {carouselSponsors.map((s) => (<div key={s.id} className="flex items-start gap-3 bg-gray-50 rounded-lg p-3 border border-gray-100">
                      {s.logo_path ? <img src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/sponsor-logos/${s.logo_path}`} alt={s.name} className="w-12 h-12 object-contain rounded shrink-0" /> : <div className="w-12 h-12 bg-brand-navy/5 rounded flex items-center justify-center shrink-0"><Building2 size={18} className="text-brand-navy/30" /></div>}
                      <div className="min-w-0 flex-1"><p className="font-semibold text-brand-navy text-sm truncate">{s.name}</p>{s.website && <a href={s.website} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-brand-gold flex items-center gap-1 truncate">{s.website} <ExternalLink size={10} /></a>}{s.comments && <p className="text-xs text-gray-400 mt-1 italic truncate" title={s.comments}>{s.comments}</p>}</div>
                      <button onClick={() => handleDeleteSponsor(s)} className="p-1.5 text-gray-300 hover:text-red-500 transition-colors shrink-0"><Trash2 size={14} /></button>
                    </div>))}
                    {carouselSponsors.length === 0 && <p className="text-gray-400 text-xs col-span-full py-2">None yet.</p>}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Hero ── */}
        {activeTab === 'hero' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8 space-y-6">
            <h2 className="text-xl font-bold text-brand-navy flex items-center gap-2"><Palette size={18} className="text-brand-gold" /> Hero Background</h2>
            <p className="text-gray-500 text-sm">Choose a solid color or upload a background image.</p>
            {loadingHero ? <div className="flex justify-center py-8 text-gray-400"><Loader2 className="animate-spin" size={20} /></div> : (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                  <div className="flex gap-3">
                    <button onClick={() => setHeroSettings({ ...heroSettings, hero_bg_type: 'color' })}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${heroSettings.hero_bg_type === 'color' ? 'bg-brand-navy text-white' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:border-brand-gold'}`}><Palette size={16} /> Color</button>
                    <button onClick={() => setHeroSettings({ ...heroSettings, hero_bg_type: 'image' })}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${heroSettings.hero_bg_type === 'image' ? 'bg-brand-navy text-white' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:border-brand-gold'}`}><ImageIcon size={16} /> Image</button>
                  </div>
                </div>
                {heroSettings.hero_bg_type === 'color' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Color</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={heroSettings.hero_bg_color} onChange={(e) => setHeroSettings({ ...heroSettings, hero_bg_color: e.target.value })} className="w-14 h-14 rounded-lg border border-gray-200 cursor-pointer" />
                      <input type="text" value={heroSettings.hero_bg_color} onChange={(e) => setHeroSettings({ ...heroSettings, hero_bg_color: e.target.value })} className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 outline-none text-sm font-mono" />
                    </div>
                  </div>
                )}
                {heroSettings.hero_bg_type === 'image' && (
                  <div className="space-y-4">
                    {heroSettings.hero_bg_image_path && !heroImageFile && (
                      <div><p className="text-sm font-semibold text-gray-700 mb-2">Current</p>
                        <div className="aspect-video max-w-md rounded-xl overflow-hidden border border-gray-200"><img src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/hero-images/${heroSettings.hero_bg_image_path}`} alt="Hero bg" className="w-full h-full object-cover" /></div>
                      </div>
                    )}
                    <div><label className="block text-sm font-semibold text-gray-700 mb-1">Upload New</label>
                      <label className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-brand-gold transition-colors text-sm text-gray-600">
                        <Upload size={16} /> {heroImageFile ? heroImageFile.name : 'Choose an image'}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && setHeroImageFile(e.target.files[0])} />
                      </label>
                    </div>
                  </div>
                )}
                <button onClick={handleSaveHero} disabled={savingHero} className="btn-primary text-sm disabled:opacity-60">
                  {savingHero ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : <><Save size={16} /> Save</>}
                </button>
              </>
            )}
          </div>
        )}

        {/* ── Newsletter ── */}
        {activeTab === 'newsletter' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-4">
              <h2 className="text-xl font-bold text-brand-navy flex items-center gap-2"><Sparkles size={18} className="text-brand-gold" /> Generate & Send</h2>
              <p className="text-gray-500 text-sm">Generate a newsletter from unreported content using AI, then send it to all subscribers.</p>
              <button onClick={handleGenerate} disabled={generating} className="btn-primary text-sm disabled:opacity-60">
                {generating ? <><Loader2 size={16} className="animate-spin" /> Generating…</> : <><Sparkles size={16} /> Generate Newsletter</>}
              </button>
              {genResult && <p className={`text-sm ${genResult.ok ? 'text-green-600' : 'text-red-500'}`}>{genResult.message}</p>}
            </div>

            {schedule && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-4">
                <h3 className="text-lg font-bold text-brand-navy flex items-center gap-2"><Calendar size={16} className="text-brand-gold" /> Auto-Send Schedule</h3>
                <div className="flex items-center gap-3">
                  <button onClick={handleToggleAutoSend} className="flex items-center gap-2 text-sm font-semibold text-brand-navy">
                    {schedule.auto_send ? <ToggleRight className="text-green-500" size={32} /> : <ToggleLeft className="text-gray-400" size={32} />}
                    {schedule.auto_send ? 'Auto-send ON' : 'Auto-send OFF'}
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-semibold text-gray-700 mb-1">Day</label>
                    <select value={schedule.day_of_week} onChange={(e) => handleUpdateSchedule('day_of_week', Number(e.target.value))} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 outline-none text-sm">
                      {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                    </select>
                  </div>
                  <div><label className="block text-sm font-semibold text-gray-700 mb-1">Time</label>
                    <input type="time" value={schedule.send_time} onChange={(e) => handleUpdateSchedule('send_time', e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 outline-none text-sm" />
                  </div>
                </div>
                {schedule.last_sent_at && <p className="text-xs text-gray-400">Last sent: {formatDateTime(schedule.last_sent_at)}</p>}
              </div>
            )}

            <div>
              <h3 className="text-lg font-bold text-brand-navy mb-4">Issues</h3>
              {loadingIssues ? <div className="flex justify-center py-8 text-gray-400"><Loader2 className="animate-spin" size={20} /></div> : issues.length === 0 ? <p className="text-gray-400 text-sm">No issues yet.</p> : (
                <div className="space-y-3">
                  {issues.map((issue) => (
                    <div key={issue.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${issue.status === 'sent' ? 'bg-green-100 text-green-700' : issue.status === 'sending' ? 'bg-blue-100 text-blue-700' : issue.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>{issue.status}</span>
                            {issue.source && <span className="text-xs text-gray-400">{issue.source}</span>}
                            <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={12} /> {formatDateTime(issue.created_at)}</span>
                          </div>
                          <p className="font-semibold text-brand-navy text-sm">{issue.subject}</p>
                          {issue.recipient_count !== null && <p className="text-xs text-gray-400 mt-1">Sent to {issue.recipient_count} subscribers</p>}
                        </div>
                        {issue.status === 'draft' && (
                          <button onClick={() => handleSendIssue(issue.id)} disabled={sending === issue.id} className="btn-primary text-xs disabled:opacity-60 shrink-0">
                            {sending === issue.id ? <><Loader2 size={14} className="animate-spin" /> Sending…</> : <><Send size={14} /> Send</>}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Content ── */}
        {activeTab === 'content' && (
          <div className="space-y-6">
            <form onSubmit={handleAddProgress} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-4">
              <h2 className="text-lg font-bold text-brand-navy flex items-center gap-2"><Plus size={18} className="text-brand-gold" /> Add Progress Entry</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <input type="text" value={progressForm.title} onChange={(e) => setProgressForm({ ...progressForm, title: e.target.value })} placeholder="Title" className="px-4 py-2.5 rounded-lg border border-gray-200 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 outline-none text-sm" />
                <select value={progressForm.category} onChange={(e) => setProgressForm({ ...progressForm, category: e.target.value })} className="px-4 py-2.5 rounded-lg border border-gray-200 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 outline-none text-sm">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <textarea rows={3} value={progressForm.body} onChange={(e) => setProgressForm({ ...progressForm, body: e.target.value })} placeholder="What did the team do?" className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 outline-none text-sm resize-y" />
              <button type="submit" disabled={savingProgress} className="btn-primary text-sm disabled:opacity-60">{savingProgress ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : <><Plus size={16} /> Add</>}</button>
            </form>

            <form onSubmit={handleAddNotebook} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-4">
              <h2 className="text-lg font-bold text-brand-navy flex items-center gap-2"><Plus size={18} className="text-brand-gold" /> Add Notebook Entry</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <input type="text" value={notebookForm.title} onChange={(e) => setNotebookForm({ ...notebookForm, title: e.target.value })} placeholder="Title" className="px-4 py-2.5 rounded-lg border border-gray-200 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 outline-none text-sm" />
                <input type="date" value={notebookForm.entry_date} onChange={(e) => setNotebookForm({ ...notebookForm, entry_date: e.target.value })} className="px-4 py-2.5 rounded-lg border border-gray-200 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 outline-none text-sm" />
              </div>
              <textarea rows={3} value={notebookForm.body} onChange={(e) => setNotebookForm({ ...notebookForm, body: e.target.value })} placeholder="Engineering notes..." className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 outline-none text-sm resize-y" />
              <button type="submit" disabled={savingNotebook} className="btn-primary text-sm disabled:opacity-60">{savingNotebook ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : <><Plus size={16} /> Add</>}</button>
            </form>

            {loadingContent ? <div className="flex justify-center py-8 text-gray-400"><Loader2 className="animate-spin" size={20} /></div> : (
              <div className="space-y-4">
                {progressEntries.length > 0 && (
                  <div><h3 className="text-sm font-bold text-brand-navy mb-2">Progress Entries ({progressEntries.length})</h3>
                    <div className="space-y-2">{progressEntries.map((p) => (
                      <div key={p.id} className="bg-white rounded-lg border border-gray-100 p-4 flex items-start justify-between gap-3">
                        <div><div className="flex items-center gap-2 mb-1"><span className="text-xs font-semibold text-brand-gold uppercase">{p.category}</span>{p.reported && <span className="text-xs text-green-600">reported</span>}<span className="text-xs text-gray-400">{p.week_of}</span></div><p className="font-semibold text-brand-navy text-sm">{p.title}</p><p className="text-sm text-gray-500 mt-1 line-clamp-2">{p.body}</p></div>
                        <button onClick={() => handleDeleteProgress(p.id)} className="p-1.5 text-gray-300 hover:text-red-500 shrink-0"><Trash2 size={14} /></button>
                      </div>
                    ))}</div>
                  </div>
                )}
                {notebookEntries.length > 0 && (
                  <div><h3 className="text-sm font-bold text-brand-navy mb-2">Notebook Entries ({notebookEntries.length})</h3>
                    <div className="space-y-2">{notebookEntries.map((n) => (
                      <div key={n.id} className="bg-white rounded-lg border border-gray-100 p-4 flex items-start justify-between gap-3">
                        <div><div className="flex items-center gap-2 mb-1">{n.reported && <span className="text-xs text-green-600">reported</span>}<span className="text-xs text-gray-400">{n.entry_date}</span></div><p className="font-semibold text-brand-navy text-sm">{n.title}</p><p className="text-sm text-gray-500 mt-1 line-clamp-2">{n.body}</p></div>
                        <button onClick={() => handleDeleteNotebook(n.id)} className="p-1.5 text-gray-300 hover:text-red-500 shrink-0"><Trash2 size={14} /></button>
                      </div>
                    ))}</div>
                  </div>
                )}
                {progressEntries.length === 0 && notebookEntries.length === 0 && <p className="text-gray-400 text-sm text-center py-4">No content yet.</p>}
              </div>
            )}
          </div>
        )}

        {/* ── API Keys ── */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8 space-y-6">
            <h2 className="text-xl font-bold text-brand-navy flex items-center gap-2"><KeyRound size={18} className="text-brand-gold" /> API Keys & Settings</h2>
            <p className="text-gray-500 text-sm">These secrets are stored securely in the database and used by the edge functions for newsletter generation and email sending.</p>
            {[
              { name: 'gemini_api_key', label: 'Gemini API Key', placeholder: 'AIza...', type: 'password', icon: Sparkles, hint: 'Used by the AI to generate newsletter content.' },
              { name: 'postmark_server_token', label: 'Postmark Server Token', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', type: 'password', icon: Send, hint: 'Used to send emails via Postmark.' },
              { name: 'from_email', label: 'From Email Address', placeholder: 'newsletter@talontech.team', type: 'text', icon: Mail, hint: 'The sender address for newsletter emails.' },
              { name: 'site_url', label: 'Site URL', placeholder: 'https://talontech.bolt.host', type: 'text', icon: Globe, hint: 'Used for unsubscribe links in emails.' },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.name} className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2"><Icon size={14} className="text-brand-gold" /> {s.label}</label>
                  <p className="text-xs text-gray-400">{s.hint}</p>
                  <div className="flex gap-2">
                    <input type={s.type} value={secretForm[s.name as keyof typeof secretForm]} onChange={(e) => setSecretForm({ ...secretForm, [s.name]: e.target.value })} placeholder={s.placeholder}
                      className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 outline-none text-sm" />
                    <button onClick={() => handleSaveSecret(s.name)} disabled={savingSecret === s.name} className="btn-primary text-sm disabled:opacity-60 shrink-0">
                      {savingSecret === s.name ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    </button>
                  </div>
                  {secretStatus?.name === s.name && <p className={`text-xs ${secretStatus.ok ? 'text-green-600' : 'text-red-500'}`}>{secretStatus.message}</p>}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Sponsorships ── */}
        {activeTab === 'sponsorships' && (
          <>
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm mb-6 w-fit">
              <Handshake size={18} className="text-brand-gold" /><span className="text-sm font-semibold text-brand-navy">{sponsorships.length} · ${totalSponsorship.toLocaleString()}</span>
            </div>
            {loadingSponsorships ? <div className="flex justify-center py-16 text-gray-400"><Loader2 className="animate-spin" size={28} /></div> : sponsorships.length === 0 ? <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center"><Handshake size={40} className="text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No submissions yet.</p></div> : (
              <div className="space-y-4">{sponsorships.map((s) => (
                <div key={s.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                  <div className="flex items-start justify-between gap-4"><div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${tierColor(s.tier)}`}>{s.tier}</span><span className="text-lg font-bold text-brand-navy">${Number(s.amount).toLocaleString()}</span><span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={12} /> {formatDateTime(s.created_at)}</span></div>
                    <h3 className="font-bold text-brand-navy flex items-center gap-2"><Building2 size={16} className="text-brand-gold" /> {s.company_name}</h3>
                    <div className="grid sm:grid-cols-2 gap-2 mt-3 text-sm text-gray-600"><p className="flex items-center gap-2"><User size={14} className="text-gray-400" /> {s.contact_name}</p><p className="flex items-center gap-2"><Mail size={14} className="text-gray-400" /> <a href={`mailto:${s.email}`} className="hover:text-brand-navy">{s.email}</a></p>{s.phone && <p className="flex items-center gap-2"><Phone size={14} className="text-gray-400" /> {s.phone}</p>}{s.website && <p className="flex items-center gap-2"><Globe size={14} className="text-gray-400" /> <a href={s.website} target="_blank" rel="noopener noreferrer" className="hover:text-brand-navy flex items-center gap-1">{s.website} <ExternalLink size={10} /></a></p>}</div>
                    {s.message && <p className="text-sm text-gray-500 mt-3 bg-gray-50 rounded-lg p-3">{s.message}</p>}
                  </div><button onClick={() => handleDeleteSponsorship(s)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors shrink-0"><Trash2 size={16} /></button></div>
                </div>
              ))}</div>
            )}
          </>
        )}

        {/* ── Donations ── */}
        {activeTab === 'donations' && (
          <>
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm mb-6 w-fit">
              <Heart size={18} className="text-brand-gold" /><span className="text-sm font-semibold text-brand-navy">{donations.length} · ${totalDonations.toLocaleString()}</span>
            </div>
            {loadingDonations ? <div className="flex justify-center py-16 text-gray-400"><Loader2 className="animate-spin" size={28} /></div> : donations.length === 0 ? <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center"><Heart size={40} className="text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No donations yet.</p></div> : (
              <div className="space-y-4">{donations.map((d) => (
                <div key={d.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                  <div className="flex items-start justify-between gap-4"><div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2"><span className="text-lg font-bold text-brand-navy">${Number(d.amount).toLocaleString()}</span>{d.is_anonymous && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">Anonymous</span>}<span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={12} /> {formatDateTime(d.created_at)}</span></div>
                    <h3 className="font-bold text-brand-navy">{d.is_anonymous ? 'Anonymous Donor' : d.name}</h3>
                    <div className="grid sm:grid-cols-2 gap-2 mt-3 text-sm text-gray-600"><p className="flex items-center gap-2"><Mail size={14} className="text-gray-400" /> <a href={`mailto:${d.email}`} className="hover:text-brand-navy">{d.email}</a></p>{d.phone && <p className="flex items-center gap-2"><Phone size={14} className="text-gray-400" /> {d.phone}</p>}</div>
                    {d.message && <p className="text-sm text-gray-500 mt-3 bg-gray-50 rounded-lg p-3">{d.message}</p>}
                  </div><button onClick={() => handleDeleteDonation(d)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors shrink-0"><Trash2 size={16} /></button></div>
                </div>
              ))}</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

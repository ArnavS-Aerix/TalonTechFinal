import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Send, Loader2, CheckCircle2, MessageSquare, Mail, User } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: 'General Inquiry', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from('contact_messages').insert({
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      subject: form.subject.trim(),
      message: form.message.trim(),
    });
    setSubmitting(false);
    if (error) { alert('Something went wrong. Please try again.'); return; }
    setSent(true);
    setForm({ name: '', email: '', subject: 'General Inquiry', message: '' });
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <Link to="/" className="flex items-center gap-2 text-gray-500 hover:text-brand-navy font-medium mb-6 transition-colors">
          <ArrowLeft size={20} /> Back to Home
        </Link>

        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-brand-navy/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="text-brand-navy" size={28} />
          </div>
          <h1 className="text-3xl font-extrabold text-brand-navy tracking-tight mb-2">Contact Us</h1>
          <p className="text-gray-500">Have a question about sponsoring, donating, or joining the team? Send us a message!</p>
        </div>

        {sent ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="text-green-600" size={32} />
            </div>
            <h2 className="text-xl font-bold text-brand-navy mb-2">Message Sent!</h2>
            <p className="text-gray-500 text-sm mb-6">Thanks for reaching out. We'll get back to you soon.</p>
            <Link to="/" className="btn-primary text-sm">Back to Home</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8 space-y-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2"><User size={14} className="text-brand-gold" /> Name *</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2"><Mail size={14} className="text-brand-gold" /> Email *</label>
                <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 outline-none text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Subject</label>
              <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 outline-none text-sm">
                <option>General Inquiry</option>
                <option>Sponsorship</option>
                <option>Donation</option>
                <option>Joining the Team</option>
                <option>Media / Press</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2"><MessageSquare size={14} className="text-brand-gold" /> Message *</label>
              <textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 outline-none text-sm resize-y" />
            </div>
            <button type="submit" disabled={submitting} className="btn-primary text-sm w-full disabled:opacity-60">
              {submitting ? <><Loader2 size={16} className="animate-spin" /> Sending…</> : <><Send size={16} /> Send Message</>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

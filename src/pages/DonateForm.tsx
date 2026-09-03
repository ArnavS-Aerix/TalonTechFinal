import { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Phone, DollarSign, MessageSquare, Send, CheckCircle, Loader2, ArrowLeft, Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function DonateForm() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    amount: '',
    message: '',
    is_anonymous: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() && !form.is_anonymous) {
      setError('Please enter your name or check "Donate anonymously."');
      return;
    }
    if (!form.email.trim()) {
      setError('Email is required.');
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      setError('Please enter a valid donation amount.');
      return;
    }
    setSubmitting(true);
    setError('');
    const { error: dbError } = await supabase.from('donations').insert({
      name: form.is_anonymous ? 'Anonymous' : form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      amount: Number(form.amount),
      message: form.message.trim() || null,
      is_anonymous: form.is_anonymous,
    });
    setSubmitting(false);
    if (dbError) {
      setError(dbError.message);
      return;
    }
    setDone(true);
  };

  if (done) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-16 px-4">
        <div className="max-w-xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 md:p-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="text-green-600" size={32} />
            </div>
            <h1 className="text-2xl font-extrabold text-brand-navy mb-3">Thank You for Your Support!</h1>
            <p className="text-gray-600 mb-8">
              Your donation of <span className="font-semibold text-brand-navy">${Number(form.amount).toLocaleString()}</span> means the world to our team.
              We'll send a confirmation to <span className="font-semibold">{form.email}</span>.
            </p>
            <Link to="/" className="btn-primary inline-flex items-center gap-2">
              <ArrowLeft size={16} /> Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="flex items-center gap-2 text-gray-500 hover:text-brand-navy font-medium mb-6 transition-colors">
          <ArrowLeft size={20} /> Back to Home
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Heart className="text-brand-gold" size={28} />
            <h1 className="text-3xl md:text-4xl font-extrabold text-brand-navy tracking-tight">Support Talon Tech</h1>
          </div>
          <p className="text-gray-600 mt-2">Your donation directly supports robot parts, competition fees, and travel costs. After submitting, our team will reach out to coordinate your contribution.</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8 space-y-6">
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Jane Doe"
                  disabled={form.is_anonymous}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 outline-none transition-all text-sm disabled:bg-gray-100 disabled:text-gray-400"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email *</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="jane@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 outline-none transition-all text-sm"
                />
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 outline-none transition-all text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Donation Amount *</label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="50"
                  min={1}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 outline-none transition-all text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Message</label>
            <div className="relative">
              <MessageSquare size={16} className="absolute left-3 top-3 text-gray-400" />
              <textarea
                rows={4}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Words of encouragement or a message for the team..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 outline-none transition-all text-sm resize-y"
              />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_anonymous}
              onChange={(e) => setForm({ ...form, is_anonymous: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-brand-gold focus:ring-brand-gold/20"
            />
            <span className="text-sm text-gray-600">Donate anonymously</span>
          </label>

          <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-60">
            {submitting ? <><Loader2 size={16} className="animate-spin" /> Submitting…</> : <><Send size={16} /> Submit Donation</>}
          </button>
        </form>
      </div>
    </div>
  );
}

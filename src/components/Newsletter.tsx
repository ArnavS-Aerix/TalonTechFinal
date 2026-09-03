import { useState } from 'react';
import { Mail, CheckCircle, ArrowRight, Sparkles } from 'lucide-react';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMsg(json?.error ?? 'Something went wrong. Please try again.');
        setStatus('error');
        return;
      }
      setStatus('success');
    } catch {
      setErrorMsg('Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  return (
    <section className="py-20 md:py-24 bg-brand-navy relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(196,163,90,0.8) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 backdrop-blur-sm">

            {status === 'success' ? (
              <div className="flex flex-col items-center text-center gap-5 py-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-brand-gold/20 flex items-center justify-center">
                    <CheckCircle className="text-brand-gold" size={40} strokeWidth={1.75} />
                  </div>
                  <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-brand-gold flex items-center justify-center">
                    <Sparkles className="text-brand-navy" size={13} />
                  </span>
                </div>
                <div>
                  <h3 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                    You're in!
                  </h3>
                  <p className="mt-2 text-white/60 max-w-sm mx-auto text-sm leading-relaxed">
                    Check your inbox to confirm your subscription. Weekly updates from the Talon Tech build floor are coming your way.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-brand-gold text-sm font-semibold">
                  <Mail size={15} />
                  <span>{email}</span>
                </div>
                <div className="w-full max-w-xs h-px bg-white/10" />
                <p className="text-white/30 text-xs">
                  No spam — unsubscribe any time.
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row sm:items-start gap-5 mb-8">
                  <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-brand-gold/20 flex items-center justify-center">
                    <Mail className="text-brand-gold" size={26} />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-brand-gold">
                      Stay in the Loop
                    </span>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mt-1">
                      Talon Tech Newsletter
                    </h2>
                    <p className="mt-2 text-white/55 text-sm leading-relaxed">
                      Weekly build updates, competition recaps, and behind-the-scenes progress — straight to your inbox.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="flex-1 bg-brand-navy-light border border-white/15 text-white placeholder-white/35 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-gold/60 transition-all duration-200"
                    />
                    <button
                      type="submit"
                      disabled={status === 'loading'}
                      className="flex-shrink-0 inline-flex items-center justify-center gap-2 bg-brand-gold text-brand-navy font-bold text-sm px-6 py-3 rounded-xl hover:bg-brand-gold-light active:scale-95 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {status === 'loading' ? (
                        <>
                          <span className="w-4 h-4 border-2 border-brand-navy/30 border-t-brand-navy rounded-full animate-spin" />
                          Subscribing…
                        </>
                      ) : (
                        <>
                          Subscribe
                          <ArrowRight size={15} />
                        </>
                      )}
                    </button>
                  </div>

                  {status === 'error' && (
                    <p className="mt-3 text-red-400 text-xs">{errorMsg}</p>
                  )}

                  <p className="mt-4 text-white/30 text-xs text-center">
                    No spam — unsubscribe any time.
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

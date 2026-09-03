import { Link } from 'react-router-dom';
import { Heart, Building2 } from 'lucide-react';

export default function SupportCall() {
  return (
    <section id="support" className="py-20 md:py-28 bg-brand-navy">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4">
            Support Talon Tech
          </h2>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            Your contribution helps us purchase parts, register for competitions, and travel to events.
            Every dollar brings us closer to our goal.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center flex flex-col">
            <div className="w-16 h-16 bg-brand-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="text-brand-gold" size={28} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Individual Donation</h3>
            <p className="text-white/60 text-sm mb-8 flex-grow">
              Make a one-time donation. Every dollar helps us reach the next competition.
              You can choose to be recognized or remain anonymous.
            </p>
            <Link to="/donate" className="btn-primary w-full gap-2">
              Donate Now
            </Link>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center flex flex-col">
            <div className="w-16 h-16 bg-brand-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Building2 className="text-brand-gold" size={28} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Corporate Sponsorship</h3>
            <p className="text-white/60 text-sm mb-8 flex-grow">
              Partner with us as a sponsor. Choose from Bronze, Silver, Gold, or Platinum tiers with
              public recognition and brand visibility at competitions.
            </p>
            <Link to="/sponsor" className="btn-outline w-full gap-2">
              Become a Sponsor
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

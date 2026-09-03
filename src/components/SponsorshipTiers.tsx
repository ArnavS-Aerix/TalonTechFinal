import { Link } from 'react-router-dom';
import { Check, Star } from 'lucide-react';

export default function SponsorshipTiers() {
  const tiers = [
    {
      name: 'Bronze',
      amount: 250,
      color: 'from-amber-700 to-amber-800',
      borderColor: 'border-amber-700',
      textColor: 'text-amber-700',
      benefits: [
        'Website recognition as a Bronze Tier sponsor (company name)',
        'Social media recognition in the team thank-you post',
        'Recognition in team newsletters throughout the season',
      ],
    },
    {
      name: 'Silver',
      amount: 500,
      color: 'from-slate-400 to-slate-500',
      borderColor: 'border-slate-400',
      textColor: 'text-slate-500',
      benefits: [
        'All Bronze benefits, plus:',
        'Logo placement on the team shirt (sleeve or small back logo)',
        'Logo on the team competition banner',
        'Website recognition as a Silver Tier sponsor with clickable link',
        'Special social media recognition (thank-you post + 3 seasonal posts)',
      ],
    },
    {
      name: 'Gold',
      amount: 1000,
      color: 'from-brand-gold to-brand-gold-dark',
      borderColor: 'border-brand-gold',
      textColor: 'text-brand-gold',
      benefits: [
        'All Silver benefits, plus:',
        'Medium logo on the back of the team shirt',
        'Tournament mention during one competition',
        'Front-page website recognition as a Gold Tier sponsor with clickable link',
        'Premier social media recognition (thank-you post + 10 seasonal posts)',
        'Quarterly team update emails',
      ],
    },
    {
      name: 'Platinum',
      amount: 2000,
      color: 'from-brand-navy to-brand-navy-light',
      borderColor: 'border-brand-navy',
      textColor: 'text-brand-navy',
      benefits: [
        'All Gold benefits, plus:',
        'Large logo on team shirt & competition robot',
        'Prominent competition/pit recognition',
        'Recognition at every tournament',
        'Engineering notebook recognition',
        'Premium website & social media recognition',
        'Dedicated sponsor spotlight',
        'Newsletter recognition & quarterly updates',
        'End-of-season recap',
        'Custom thank-you video & plaque',
    
      ],
    },
  ];

  return (
    <section id="sponsorship" className="py-20 md:py-28 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="section-title mb-4">Sponsorship Tiers</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Partner with Talon Tech and help us reach the VEX V5 state championships.
            Your sponsorship directly funds robot parts, tools, competition fees, and travel.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tiers.map((tier) => (
            <div key={tier.name} className={`card h-full flex flex-col border-t-4 ${tier.borderColor}`}>
              <div className="flex items-center gap-2 mb-4">
                <Star className={tier.textColor} size={20} />
                <span className={`text-sm font-bold uppercase tracking-wider ${tier.textColor}`}>
                  {tier.name}
                </span>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-extrabold text-brand-navy">${tier.amount.toLocaleString()}</span>
              </div>

              {tier.note && (
                <p className="text-xs text-gray-500 italic mb-4">{tier.note}</p>
              )}

              <ul className="space-y-3 mb-8 flex-grow">
                {tier.benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3 text-sm text-gray-600">
                    <Check className={`shrink-0 mt-0.5 ${tier.textColor}`} size={16} />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>

              <Link
                to="/sponsor"
                state={{ tier: tier.name }}
                className={`w-full text-center py-3 rounded-lg font-semibold text-white transition-all duration-200 hover:shadow-lg bg-gradient-to-r ${tier.color}`}
              >
                Choose {tier.name}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

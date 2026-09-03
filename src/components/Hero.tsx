import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Target, TrendingUp, Cpu, Trophy, Users, ChevronDown } from 'lucide-react';

const HOURS = 50;

export default function Hero() {
  const hours = HOURS;
  const [progress, setProgress] = useState(0);
  const goal = 10000;
  const raised = 2700;
  const percentage = Math.round((raised / goal) * 100);

  useEffect(() => {
    const timer = setTimeout(() => setProgress(percentage), 500);
    return () => clearTimeout(timer);
  }, [percentage]);

  return (
    <section className="relative min-h-screen bg-brand-navy flex flex-col overflow-hidden pt-20">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '180px 180px',
        }} />
      </div>
      {/* Glow orbs */}
      <div className="absolute top-20 right-20 w-96 h-96 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-40 left-20 w-96 h-96 bg-brand-orange/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main hero content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 text-center py-16 animate-fade-in">
        <img
          src="/images/image.png"
          alt="Talon Tech Logo"
          className="w-32 h-32 md:w-44 md:h-44 mx-auto mb-8 rounded-2xl shadow-2xl"
        />

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-white tracking-tight mb-4">
          Talon Tech
        </h1>

        <p className="text-xl md:text-2xl text-white/70 font-light mb-2">
          Lakewood Ranch Preparatory Academy
        </p>

        <p className="text-lg md:text-xl text-brand-gold font-semibold mb-12">
          VEX V5 Robotics Competition Team
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link to="/donate" className="btn-primary text-lg px-8 py-4 gap-2">
            Make a Donation
            <ArrowRight size={20} />
          </Link>
          <Link to="/sponsor" className="btn-outline text-lg px-8 py-4 gap-2">
            Become a Sponsor
            <ArrowRight size={20} />
          </Link>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl mx-auto mb-16">
          {[
            { label: 'Team Members', value: '9' },
            { label: 'Competitions', value: '3+' },
            { label: 'Fundraising Goal', value: '$10K' },
            { label: 'Hours Dedicated', value: `${hours}+` },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
              <div className="text-3xl font-extrabold text-brand-gold mb-1">{stat.value}</div>
              <div className="text-white/50 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Fundraising progress */}
        <div className="w-full max-w-2xl mx-auto bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 md:p-8 mb-16">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-white/80">
              <TrendingUp size={18} className="text-brand-gold" />
              <span className="font-semibold">Fundraising Progress</span>
            </div>
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <Target size={16} />
              <span>Goal: ${goal.toLocaleString()}</span>
            </div>
          </div>

          <div className="h-4 bg-white/10 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-gradient-to-r from-brand-gold to-brand-orange rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-white font-bold text-2xl">${raised.toLocaleString()}</span>
            <span className="text-white/60 font-medium">{percentage}% of goal</span>
          </div>
        </div>

        {/* Quick mission cards */}
        <div className="grid md:grid-cols-3 gap-4 w-full max-w-4xl mx-auto">
          {[
            { icon: Cpu, title: 'Engineering Excellence', desc: 'Designing and building competition-ready robots with VEX V5 hardware and custom programming.' },
            { icon: Trophy, title: 'Competitive Spirit', desc: 'Competing at regional and state-level VEX tournaments with strategy, precision, and teamwork.' },
            { icon: Users, title: 'Student-Led Team', desc: 'Every role — from programming to marketing — is owned and driven by our student members.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left">
              <div className="w-10 h-10 bg-brand-gold/20 rounded-xl flex items-center justify-center mb-4">
                <Icon className="text-brand-gold" size={20} />
              </div>
              <h3 className="text-white font-bold mb-2">{title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="relative z-10 flex justify-center pb-8 animate-bounce">
        <ChevronDown className="text-white/30" size={32} />
      </div>
    </section>
  );
}

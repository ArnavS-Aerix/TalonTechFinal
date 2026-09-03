import { Link } from 'react-router-dom';
import { Mail, MapPin, Globe } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-brand-navy border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/images/image.png"
                alt="Talon Tech Logo"
                className="w-10 h-10 rounded-lg object-contain"
              />
              <span className="text-white font-extrabold text-xl">Talon Tech</span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed">
              Talon Tech is Lakewood Ranch Preparatory Academy's VEX V5 Robotics Team. Building robots, developing skills, and competing for excellence.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="#about" className="text-white/60 hover:text-brand-gold text-sm transition-colors">About Us</a></li>
              <li><a href="#sponsorship" className="text-white/60 hover:text-brand-gold text-sm transition-colors">Sponsorship Tiers</a></li>
              <li><a href="#team" className="text-white/60 hover:text-brand-gold text-sm transition-colors">Meet the Team</a></li>
              <li><Link to="/donate" className="text-white/60 hover:text-brand-gold text-sm transition-colors">Donate</Link></li>
              <li><Link to="/sponsor" className="text-white/60 hover:text-brand-gold text-sm transition-colors">Sponsor</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-white/60 text-sm">
                <MapPin size={16} className="text-brand-gold shrink-0" />
                Lakewood Ranch Preparatory Academy, 5570 White Eagle Blvd, Bradenton, FL
              </li>
              <li className="flex items-center gap-3 text-white/60 text-sm">
                <Mail size={16} className="text-brand-gold shrink-0" />
                <a href="mailto:talontechlrpa@lrp.edu" className="hover:text-brand-gold transition-colors">talontech@lakewoodranchprep.org</a>
              </li>
              <li className="flex items-center gap-3 text-white/60 text-sm">
                <Globe size={16} className="text-brand-gold shrink-0" />
                <span>lakewoodranchprep.org</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 text-center">
          <p className="text-white/40 text-sm">
            &copy; {new Date().getFullYear()} Talon Tech. Lakewood Ranch Preparatory Academy. All rights reserved.
          </p>
          <div className="mt-3 flex items-center justify-center gap-4 text-xs">
            <Link to="/admin" className="text-white/25 hover:text-brand-gold/70 transition-colors">
              Admin Center
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

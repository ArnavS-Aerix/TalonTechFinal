import { School, Hash, CalendarDays, Mail, Wallet, MapPin } from 'lucide-react';

const mentors = [
  { name: 'Jessica Adams', email: 'jadams@lakewoodranchprep.org' },
  { name: 'John Chetwynd', email: 'john.chetwynd@lakewoodranchprep.org' },
];

const fundUsage = [
  { label: 'Robot Parts & VEX V5 Hardware', pct: 40, color: '#c4a35a' },
  { label: 'Competition Registration Fees', pct: 25, color: '#1e3a5f' },
  { label: 'Travel & Lodging', pct: 20, color: '#e8853d' },
  { label: 'Tools & Field Setup', pct: 10, color: '#6b8e23' },
  { label: 'Team Apparel & Outreach', pct: 5, color: '#a8554a' },
];

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

function PieChart() {
  const cx = 100;
  const cy = 100;
  const r = 80;
  let currentAngle = 0;

  return (
    <div className="flex flex-col lg:flex-row items-center gap-8">
      <svg viewBox="0 0 200 200" className="w-48 h-48 lg:w-56 lg:h-56 shrink-0">
        {fundUsage.map((item) => {
          const startAngle = currentAngle;
          const sweep = (item.pct / 100) * 360;
          const endAngle = currentAngle + sweep;
          currentAngle = endAngle;
          return (
            <path
              key={item.label}
              d={arcPath(cx, cy, r, startAngle, endAngle)}
              fill={item.color}
              stroke="white"
              strokeWidth="2"
            />
          );
        })}
        <circle cx={cx} cy={cy} r="36" fill="white" />
        <text x={cx} y={cy - 4} textAnchor="middle" className="text-xl font-extrabold fill-brand-navy">
          100%
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" className="text-[9px] fill-gray-400 uppercase tracking-wider">
          Allocated
        </text>
      </svg>

      <div className="space-y-3 w-full">
        {fundUsage.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <span
              className="w-4 h-4 rounded shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-white/80 text-sm flex-grow">{item.label}</span>
            <span className="text-brand-gold text-sm font-bold">{item.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Credibility() {
  return (
    <section id="credibility" className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-brand-gold mb-3">
            Who We Are
          </span>
          <h2 className="section-title mb-4">About Talon Tech</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We're a student-led robotics team competing in the VEX V5 Robotics Competition,
            representing Lakewood Ranch Preparatory Academy in Bradenton, Florida.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {/* School affiliation */}
          <div className="card h-full">
            <div className="w-12 h-12 bg-brand-navy/5 rounded-xl flex items-center justify-center mb-4">
              <School className="text-brand-navy" size={24} />
            </div>
            <h3 className="text-lg font-bold text-brand-navy mb-2">School Affiliation</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Lakewood Ranch Preparatory Academy
            </p>
            <p className="text-gray-500 text-sm mt-1">
              5570 White Eagle Blvd, Bradenton, FL 34211
            </p>
          </div>

          {/* Team number */}
          <div className="card h-full">
            <div className="w-12 h-12 bg-brand-navy/5 rounded-xl flex items-center justify-center mb-4">
              <Hash className="text-brand-navy" size={24} />
            </div>
            <h3 className="text-lg font-bold text-brand-navy mb-2">Team Number</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              VEX V5 Team <span className="font-bold text-brand-navy">34613S</span>
            </p>
            <p className="text-gray-500 text-sm mt-1">
              Registered with the Robotics Education &amp; Competition (REC) Foundation.
            </p>
          </div>

          {/* Mentor contact */}
          <div className="card h-full">
            <div className="w-12 h-12 bg-brand-navy/5 rounded-xl flex items-center justify-center mb-4">
              <Mail className="text-brand-navy" size={24} />
            </div>
            <h3 className="text-lg font-bold text-brand-navy mb-2">Mentors &amp; Coaches</h3>
            <div className="space-y-2">
              {mentors.map((m) => (
                <div key={m.email}>
                  <p className="text-gray-600 text-sm font-medium">{m.name}</p>
                  <a
                    href={`mailto:${m.email}`}
                    className="text-brand-gold text-xs hover:underline"
                  >
                    {m.email}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Competition schedule */}
        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-8 md:p-10 mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-brand-gold/20 rounded-xl flex items-center justify-center">
              <CalendarDays className="text-brand-gold" size={20} />
            </div>
            <h3 className="text-xl font-bold text-brand-navy">Competition Schedule</h3>
          </div>
          <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-5">
            <MapPin className="text-gray-400 shrink-0" size={18} />
            <p className="text-gray-500 text-sm">
              Competition dates and locations will be released soon. Check back for updates as the
              season approaches.
            </p>
          </div>
        </div>

        {/* Fund usage breakdown */}
        <div className="bg-brand-navy rounded-2xl p-8 md:p-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-brand-gold/20 rounded-xl flex items-center justify-center">
              <Wallet className="text-brand-gold" size={20} />
            </div>
            <h3 className="text-xl font-bold text-white">How Your Support Is Used</h3>
          </div>
          <p className="text-white/60 text-sm mb-8 max-w-2xl">
            Every dollar goes directly to building and competing. Here's the breakdown of how
            we allocate sponsorship and donation funds across the season.
          </p>
          <PieChart />
        </div>
      </div>
    </section>
  );
}

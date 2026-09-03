export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-navy to-brand-navy-light text-white">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <h1 className="text-5xl font-bold mb-6">Welcome to Talon Tech</h1>
        <p className="text-xl mb-8 text-gray-300">VEX V5 Robotics Team</p>
        <div className="flex gap-4">
          <a href="/sponsor" className="bg-brand-gold text-brand-navy px-6 py-3 rounded-lg font-semibold hover:bg-brand-gold-light">Become a Sponsor</a>
          <a href="/donate" className="border-2 border-brand-gold text-brand-gold px-6 py-3 rounded-lg font-semibold hover:bg-brand-gold hover:text-brand-navy">Donate</a>
        </div>
      </div>
    </main>
  );
}
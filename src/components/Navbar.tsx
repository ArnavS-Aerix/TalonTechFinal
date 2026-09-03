export default function Navbar() {
  return (
    <nav className="bg-brand-navy text-white p-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold">Talon Tech</h1>
        <ul className="flex gap-6">
          <li><a href="/" className="hover:text-brand-gold">Home</a></li>
          <li><a href="/sponsor" className="hover:text-brand-gold">Sponsor</a></li>
          <li><a href="/donate" className="hover:text-brand-gold">Donate</a></li>
        </ul>
      </div>
    </nav>
  );
}
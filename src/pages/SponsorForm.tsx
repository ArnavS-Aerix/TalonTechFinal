export default function SponsorForm() {
  return (
    <div className="min-h-screen bg-gray-50 py-20">
      <div className="max-w-2xl mx-auto px-6">
        <h1 className="text-4xl font-bold mb-6 text-brand-navy">Sponsor Talon Tech</h1>
        <form className="bg-white p-8 rounded-lg shadow-lg space-y-4">
          <div>
            <label className="block text-brand-navy font-semibold mb-2">Company Name</label>
            <input type="text" placeholder="Company Name" className="w-full border border-gray-300 p-3 rounded" />
          </div>
          <div>
            <label className="block text-brand-navy font-semibold mb-2">Email</label>
            <input type="email" placeholder="Email" className="w-full border border-gray-300 p-3 rounded" />
          </div>
          <div>
            <label className="block text-brand-navy font-semibold mb-2">Message</label>
            <textarea placeholder="Tell us about your company" className="w-full border border-gray-300 p-3 rounded h-32"></textarea>
          </div>
          <button type="submit" className="w-full bg-brand-gold text-brand-navy p-3 rounded font-semibold hover:bg-brand-gold-light">Submit</button>
        </form>
      </div>
    </div>
  );
}
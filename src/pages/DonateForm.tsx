export default function DonateForm() {
  return (
    <div className="min-h-screen bg-gray-50 py-20">
      <div className="max-w-2xl mx-auto px-6">
        <h1 className="text-4xl font-bold mb-6 text-brand-navy">Support Us</h1>
        <p className="text-gray-700 mb-6">Your donation helps us compete and build amazing robots!</p>
        <form className="bg-white p-8 rounded-lg shadow-lg space-y-4">
          <div>
            <label className="block text-brand-navy font-semibold mb-2">Full Name</label>
            <input type="text" placeholder="Full Name" className="w-full border border-gray-300 p-3 rounded" />
          </div>
          <div>
            <label className="block text-brand-navy font-semibold mb-2">Email</label>
            <input type="email" placeholder="Email" className="w-full border border-gray-300 p-3 rounded" />
          </div>
          <div>
            <label className="block text-brand-navy font-semibold mb-2">Donation Amount</label>
            <input type="number" placeholder="Donation Amount ($)" className="w-full border border-gray-300 p-3 rounded" />
          </div>
          <button type="submit" className="w-full bg-brand-gold text-brand-navy p-3 rounded font-semibold hover:bg-brand-gold-light">Donate</button>
        </form>
      </div>
    </div>
  );
}
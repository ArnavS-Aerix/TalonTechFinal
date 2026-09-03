export default function Unsubscribe() {
  return (
    <div className="min-h-screen bg-gray-50 py-20">
      <div className="max-w-2xl mx-auto px-6">
        <h1 className="text-4xl font-bold mb-6 text-brand-navy">Unsubscribe</h1>
        <p className="text-gray-700 mb-6">Enter your email to unsubscribe from our mailing list.</p>
        <form className="bg-white p-8 rounded-lg shadow-lg space-y-4">
          <div>
            <label className="block text-brand-navy font-semibold mb-2">Email Address</label>
            <input type="email" placeholder="Email Address" className="w-full border border-gray-300 p-3 rounded" />
          </div>
          <button type="submit" className="w-full bg-brand-gold text-brand-navy p-3 rounded font-semibold hover:bg-brand-gold-light">Unsubscribe</button>
        </form>
      </div>
    </div>
  );
}
import { requireSession } from '@/lib/auth';

export default async function MonetizationPage() {
  await requireSession('/monetization');

  return (
    <div className="min-h-screen bg-gray-900">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Monetization Dashboard</h1>
        <div className="bg-gray-800 rounded-lg p-8">
          <h2 className="text-xl font-semibold mb-4">Revenue Overview</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-green-900/30 p-4 rounded">
              <h3 className="font-semibold">Game Pass Sales</h3>
              <p className="text-2xl font-bold">$0.00</p>
            </div>
            <div className="bg-blue-900/30 p-4 rounded">
              <h3 className="font-semibold">Premium Payouts</h3>
              <p className="text-2xl font-bold">$0.00</p>
            </div>
            <div className="bg-purple-900/30 p-4 rounded">
              <h3 className="font-semibold">In-Game Purchases</h3>
              <p className="text-2xl font-bold">$0.00</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

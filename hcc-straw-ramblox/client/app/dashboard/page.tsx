import { requireSession } from '@/lib/auth';

export default async function DashboardPage() {
  await requireSession('/dashboard');

  return (
    <div className="min-h-screen bg-gray-900">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Game Dashboard</h1>
        <div className="bg-gray-800 rounded-lg p-8">
          <h2 className="text-xl font-semibold mb-4">Your Games</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-gray-700 p-4 rounded">
              <h3 className="font-semibold mb-2">Game Stats</h3>
              <p className="text-gray-400">Total players, active users, retention</p>
            </div>
            <div className="bg-gray-700 p-4 rounded">
              <h3 className="font-semibold mb-2">Revenue</h3>
              <p className="text-gray-400">In-game purchases, premium payouts</p>
            </div>
            <div className="bg-gray-700 p-4 rounded">
              <h3 className="font-semibold mb-2">Recent Activity</h3>
              <p className="text-gray-400">Player engagement, events</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

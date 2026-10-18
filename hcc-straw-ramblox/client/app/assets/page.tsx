import { requireSession } from '@/lib/auth';

export default async function AssetsPage() {
  await requireSession('/assets');

  return (
    <div className="min-h-screen bg-gray-900">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Asset Library</h1>
        <div className="bg-gray-800 rounded-lg p-8">
          <p className="text-gray-400">
            Browse and manage 3D models, textures, sounds, and animations
          </p>
        </div>
      </main>
    </div>
  );
}

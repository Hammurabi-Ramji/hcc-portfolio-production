import { requireSession } from '@/lib/auth';

export default async function EditorPage() {
  await requireSession('/editor');

  return (
    <div className="min-h-screen bg-gray-900">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Game Editor</h1>
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <p className="text-gray-400">
            Game editor interface - Coming soon
          </p>
        </div>
      </main>
    </div>
  );
}

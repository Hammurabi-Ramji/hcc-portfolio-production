import type { Metadata } from "next";
export const metadata: Metadata = { title: "Ramblox - Home", description: "Roblox game development platform" };
export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900">
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Ramblox</h1>
        <p className="text-xl text-gray-300 mb-8">Build, publish, and monetize Roblox games</p>
        <a href="/editor" className="px-8 py-4 bg-purple-600 rounded-lg inline-block">Start Building</a>
      </section>
    </div>
  );
}

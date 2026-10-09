"use client";

import { useState } from "react";
import { generateAsset, type AssetGenerationRequest } from "../../server/ai-assets";

export default function AssetLibrary() {
  const [req, setReq] = useState<AssetGenerationRequest>({
    type: 'model',
    prompt: '',
    style: 'realistic',
    quality: 'medium'
  });
  const [gen, setGen] = useState(false);

  const handle = async () => {
    if (!req.prompt) return;
    setGen(true);
    const res = await generateAsset(req);
    setGen(false);
    if (res.success) console.log('Generated:', res.asset);
  };

  return (
    <div className="flex h-screen bg-gray-900">
      <aside className="w-64 bg-gray-800 p-4 border-r">
        <h2 className="text-lg font-bold text-purple-400 mb-4">AI Generator</h2>
        <div className="space-y-4">
          <select value={req.type} onChange={e => setReq({ ...req, type: e.target.value as AssetGenerationRequest['type'] })} className="w-full bg-gray-700 rounded p-2">
            <option value="model">3D Model</option>
            <option value="texture">Texture</option>
            <option value="material">Material</option>
          </select>
          <select value={req.style} onChange={e => setReq({ ...req, style: e.target.value })} className="w-full bg-gray-700 rounded p-2">
            <option value="realistic">Realistic</option>
            <option value="cartoon">Cartoon</option>
          </select>
          <textarea value={req.prompt} onChange={e => setReq({ ...req, prompt: e.target.value })} placeholder="Describe..." className="w-full bg-gray-700 rounded p-2" rows={4} />
          <button onClick={handle} disabled={gen || !req.prompt} className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 p-2 rounded">{gen ? '...' : 'Generate'}</button>
        </div>
      </aside>
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-4">Assets</h1>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-800 rounded p-6 text-center"><div className="text-4xl mb-2">📦</div><p className="text-gray-400">Models</p></div>
          <div className="bg-gray-800 rounded p-6 text-center"><div className="text-4xl mb-2">🎨</div><p className="text-gray-400">Textures</p></div>
          <div className="bg-gray-800 rounded p-6 text-center"><div className="text-4xl mb-2">🎭</div><p className="text-gray-400">Materials</p></div>
        </div>
      </main>
    </div>
  );
}

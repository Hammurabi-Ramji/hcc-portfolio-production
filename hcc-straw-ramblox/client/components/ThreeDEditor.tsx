"use client";

import { useState } from "react";

const tools = [
  { id: "translate", label: "Move" },
  { id: "rotate", label: "Rotate" },
  { id: "scale", label: "Scale" }
] as const;

type TransformMode = (typeof tools)[number]["id"];

export default function ThreeDEditor() {
  const [mode, setMode] = useState<TransformMode>("translate");

  return (
    <div className="flex h-screen bg-gray-900">
      <aside className="w-16 bg-gray-800 flex flex-col items-center py-4">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setMode(tool.id)}
            className={`mb-2 rounded px-2 py-2 text-xs ${mode === tool.id ? "bg-purple-600 text-white" : "hover:bg-gray-700"}`}
          >
            {tool.label}
          </button>
        ))}
      </aside>
      <main className="flex-1 p-6">
        <div className="flex h-full flex-col rounded-xl border border-gray-800 bg-black/40">
          <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3 text-sm text-gray-300">
            <span>Viewport</span>
            <span>Transform mode: {mode}</span>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center text-gray-400">
              <div className="mb-4 text-6xl">🧱</div>
              <p className="text-lg font-medium text-gray-200">3D workspace scaffold ready</p>
              <p className="mt-2 text-sm">Use the toolbar to switch between transform modes while the interactive scene is finalized.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

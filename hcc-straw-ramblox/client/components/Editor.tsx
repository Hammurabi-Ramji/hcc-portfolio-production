export default function Editor() {
  return (
    <div className="flex h-screen bg-gray-900">
      {/* Toolbar */}
      <aside className="w-16 bg-gray-800 flex flex-col items-center py-4 gap-4">
        <button className="p-2 hover:bg-gray-700 rounded" title="Select">
          ⬚
        </button>
        <button className="p-2 hover:bg-gray-700 rounded" title="Place">
          📦
        </button>
        <button className="p-2 hover:bg-gray-700 rounded" title="Script">
          {'</>'}
        </button>
        <button className="p-2 hover:bg-gray-700 rounded" title="Camera">
          📷
        </button>
      </aside>

      {/* Properties Panel */}
      <aside className="w-64 bg-gray-800 p-4">
        <h2 className="text-sm font-semibold mb-4 uppercase text-gray-400">Properties</h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400">Name</label>
            <input
              type="text"
              className="w-full bg-gray-700 rounded px-2 py-1 text-sm"
              placeholder="Object name"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400">Position</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="X"
                className="w-16 bg-gray-700 rounded px-2 py-1 text-sm"
              />
              <input
                type="number"
                placeholder="Y"
                className="w-16 bg-gray-700 rounded px-2 py-1 text-sm"
              />
              <input
                type="number"
                placeholder="Z"
                className="w-16 bg-gray-700 rounded px-2 py-1 text-sm"
              />
            </div>
          </div>
        </div>
      </aside>

      {/* 3D Viewport */}
      <main className="flex-1 bg-black relative">
        <div className="absolute top-4 left-4 bg-gray-800 rounded p-2 text-sm text-white">
          <p>Camera: Perspective</p>
          <p>FPS: 60</p>
        </div>
        <div className="absolute bottom-4 left-4 bg-gray-800 rounded p-2 text-sm">
          <p>Place: Unnamed</p>
          <p>Players: 1</p>
        </div>
      </main>

      {/* Explorer Panel */}
      <aside className="w-64 bg-gray-800 p-4">
        <h2 className="text-sm font-semibold mb-4 uppercase text-gray-400">Explorer</h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-300">
            <span>📁</span>
            <span>ReplicatedStorage</span>
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <span>📁</span>
            <span>ServerScriptService</span>
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <span>📁</span>
            <span>StarterPack</span>
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <span>📁</span>
            <span>Workspace</span>
          </div>
        </div>
      </aside>
    </div>
  );
}

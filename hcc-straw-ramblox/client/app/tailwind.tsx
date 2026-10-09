export default function TailwindConfig() {
  return (
    <div className="container mx-auto px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-purple-400 mb-4">
          Tailwind CSS + Ramblox
        </h1>
        <p className="text-gray-400">
          This page confirms Tailwind CSS is working properly
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
        <div className="bg-gray-800 p-6 rounded-lg hover:shadow-lg transition-shadow">
          <h3 className="text-xl font-semibold mb-2">Purple Gradient</h3>
          <div className="h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded"></div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg hover:shadow-lg transition-shadow">
          <h3 className="text-xl font-semibold mb-2">Hover Effects</h3>
          <button className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-white">
            Hover Me
          </button>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg hover:shadow-lg transition-shadow">
          <h3 className="text-xl font-semibold mb-2">Responsive Grid</h3>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-purple-500 h-12 rounded"></div>
            <div className="bg-pink-500 h-12 rounded"></div>
            <div className="bg-purple-500 h-12 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

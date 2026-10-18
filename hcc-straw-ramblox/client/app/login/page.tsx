export const metadata = { title: "Ramblox - Login" };
export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-lg w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center">Sign In</h1>
        <form className="space-y-4">
          <input type="email" placeholder="Email" className="w-full bg-gray-700 rounded px-3 py-2" />
          <input type="password" placeholder="Password" className="w-full bg-gray-700 rounded px-3 py-2" />
          <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded">Sign In</button>
        </form>
      </div>
    </div>
  );
}

export const metadata = { title: "Ramblox - Assets", description: "AI asset library" };
export default function AssetsLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-gray-900">{children}</div>;
}

export const metadata = { title: "Ramblox - 3D Editor", description: "Visual game editor" };
export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-gray-900">{children}</div>;
}

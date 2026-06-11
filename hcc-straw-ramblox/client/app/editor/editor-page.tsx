import ThreeDEditor from "@/components/ThreeDEditor";
import { requireSession } from '@/lib/auth';

export default async function EditorPage() {
  await requireSession('/editor');
  return <ThreeDEditor />;
}

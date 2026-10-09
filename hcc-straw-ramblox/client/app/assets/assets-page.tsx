import AssetLibrary from "@/components/AssetLibrary";
import { requireSession } from '@/lib/auth';

export default async function AssetsPage() {
  await requireSession('/assets');
  return <AssetLibrary />;
}

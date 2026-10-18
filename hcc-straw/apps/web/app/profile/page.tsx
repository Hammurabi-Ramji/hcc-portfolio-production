import { redirect } from 'next/navigation';

/**
 * Canonical profile destination is `/settings` (profile editor lives there).
 * `/profile` remains advertised and middleware-protected; this route only forwards.
 */
export default function ProfilePage() {
  redirect('/settings');
}

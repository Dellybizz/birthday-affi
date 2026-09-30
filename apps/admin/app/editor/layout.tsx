import { requireAdmin } from '../../lib/auth';
export default async function EditorLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return children;
}

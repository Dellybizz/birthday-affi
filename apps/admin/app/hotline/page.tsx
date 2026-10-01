import Link from 'next/link';
import {requireAdmin} from '../../lib/auth';
import {HotlineLinks} from './links';
export default async function HotlineSettings(){await requireAdmin();return <main className="mx-auto max-w-2xl space-y-6 p-6"><Link href="/settings">← Settings</Link><h1 className="text-2xl">Private Hotline links</h1><HotlineLinks/><p>Your receiver page must remain open for browser calls. Android background ringing will be available after the receiver APK and push service are configured.</p></main>}

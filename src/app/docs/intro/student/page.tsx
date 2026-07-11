import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { introNav } from '@/lib/docs/navigation';

export default function StudentIntroPage() {
  return (
    <DocsShell title="Student Portal & App" subtitle="Optional web view; primary experience is mobile." nav={introNav} variant="intro">
      <p>Students mainly use the mobile app for chat and academics. The web student portal shows fees, attendance, results, timetable, and canteen.</p>
      <p><Link href="/docs/intro/student/mobile-app">Mobile app guide</Link></p>
    </DocsShell>
  );
}

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'User Guide',
  robots: { index: false, follow: false },
};

export default function IntroDocsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

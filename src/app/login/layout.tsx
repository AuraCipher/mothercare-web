import type { Metadata } from 'next';
import config from '@/config';

export const metadata: Metadata = {
  title: 'Sign In',
  description: `Sign in to the ${config.appName} portal — CEO, admin, teacher, and student access.`,
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}

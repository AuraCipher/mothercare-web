import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import config from '@/config';
import logger from '@/lib/logger';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: config.appName,
    template: `%s | ${config.appName}`,
  },
  description: 'School broadcasting & communication platform — built for privacy, role-based access, and seamless parent-teacher connection.',
  icons: {
    icon: '/favicon.ico',
  },
};

// Log startup in dev
if (config.isDev) {
  logger.info(`⚡ ${config.appName} running in development mode`);
  logger.info(`🔗 API: ${config.apiUrl}`);
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}

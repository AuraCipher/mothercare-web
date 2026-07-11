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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: config.appName,
    template: `%s | ${config.appName}`,
  },
  description:
    'Mother Care School — school ERP, broadcasting, fees, attendance, results, and secure role-based communication for staff, teachers, and families.',
  applicationName: config.appName,
  keywords: [
    'Mother Care School',
    'MCS',
    'school ERP',
    'education',
    'attendance',
    'fees',
    'results',
    'school communication',
  ],
  authors: [{ name: config.appName }],
  creator: config.appName,
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: config.appName,
    description:
      'School broadcasting & communication platform — privacy-first, role-based access for Mother Care School.',
    type: 'website',
    locale: 'en_PK',
    siteName: config.appName,
    images: [
      {
        url: '/og-image.png',
        width: 512,
        height: 512,
        alt: `${config.appName} logo`,
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: config.appName,
    description: 'School broadcasting & communication platform.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    'theme-color': '#1a1614',
    'msapplication-TileColor': '#1a1614',
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

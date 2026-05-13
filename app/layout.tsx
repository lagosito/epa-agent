import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'ePA Agent — Deine Krankenakte, intelligent organisiert',
  description:
    'ePA Agent hilft dir, deine medizinischen Dokumente zu verstehen und zu verwalten. Datenschutzkonform, DSGVO-konform, in Deutschland gehostet.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className={inter.variable}>
      <body className="min-h-screen bg-bg font-sans antialiased">
        {children}
      </body>
    </html>
  );
}

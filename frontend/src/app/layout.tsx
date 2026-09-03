import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FolioPulse - Votre portefolio guidé par une IA',
  description: 'Gérez et analysez votre marché avec l\'IA.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark">
      <body className={`${inter.className} min-h-screen bg-background text-foreground flex flex-col`}>
        {children}
      </body>
    </html>
  );
}

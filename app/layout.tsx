// app/layout.tsx
import './clean.css';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SPST – Area riservata',
  description: 'Dashboard SPST',
};

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={inter.variable}>
      <body className="min-h-dvh bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}

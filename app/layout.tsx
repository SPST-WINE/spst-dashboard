// app/layout.tsx
import './clean.css';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';


export const metadata = {
  title: 'SPST – Area riservata',
  description: 'Dashboard SPST',
    icons: {
    icon: [
      { url: 'https://cdn.prod.website-files.com/6800cc3b5f399f3e2b7f2ffa/6859a72cac2c0604fbd192e3_favicon.ico', sizes: 'any' },
    ],
    shortcut: [
      'https://cdn.prod.website-files.com/6800cc3b5f399f3e2b7f2ffa/6859a72cac2c0604fbd192e3_favicon.ico',
    ],
  },
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

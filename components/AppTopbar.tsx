// components/AppTopbar.tsx
'use client';

import { usePathname } from 'next/navigation';

type RouteItem = { href: string; label: string };

const routes: RouteItem[] = [
  { href: '/dashboard/spedizioni', label: 'Le mie spedizioni' },
  { href: '/dashboard/nuova', label: 'Nuova spedizione' },
  { href: '/dashboard/quotazioni', label: 'Quotazioni' },
  { href: '/dashboard/quotazioni/nuova', label: 'Nuova Quotazione' }, 
  { href: '/dashboard/informazioni-utili', label: 'Informazioni utili' },
  { href: '/dashboard/impostazioni', label: 'Impostazioni' },
  { href: '/dashboard', label: 'Overview' }, // <- lasciata per ultima (fallback)
];

function titleFor(path: string) {
  // Prende la rotta più specifica (href più lungo) che fa match
  const match = routes
    .filter(r => path === r.href || path.startsWith(r.href + '/'))
    .sort((a, b) => b.href.length - a.href.length)[0];

  // Se non matcha niente ma siamo esattamente su '/dashboard'
  if (!match && path === '/dashboard') return 'Overview';
  return match?.label ?? 'Dashboard';
}

export default function AppTopbar() {
  const pathname = usePathname();
  const title = titleFor(pathname);

  const whatsappUrl =
    process.env.NEXT_PUBLIC_WHATSAPP_LINK ||
    'https://wa.me/message/CP62RMFFDNZPO1';

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b">
      <div className="mx-auto flex h-14 items-center justify-between px-4">
        <h1 className="text-sm font-semibold tracking-tight">{title}</h1>
        <div className="flex items-center gap-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            Supporto WhatsApp
          </a>
          <a
            href="/logout"
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            Logout
          </a>
        </div>
      </div>
    </header>
  );
}

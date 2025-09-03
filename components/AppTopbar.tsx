'use client';

import { usePathname } from 'next/navigation';

const routes = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/spedizioni', label: 'Le mie spedizioni' },
  { href: '/dashboard/nuova', label: 'Nuova spedizione' },
  // { href: '/dashboard/compliance', label: 'Compliance' }, // nascosta
  { href: '/dashboard/informazioni-utili', label: 'Informazioni utili' },
];

function titleFor(path: string) {
  const m = routes.find(r => path === r.href || path.startsWith(r.href + '/'));
  return m?.label ?? 'Dashboard';
}

export default function AppTopbar() {
  const pathname = usePathname();
  const title = titleFor(pathname);

  // URL WhatsApp fisso con fallback a env pubblica se vuoi gestirlo da .env
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

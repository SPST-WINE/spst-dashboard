'use client';

import { usePathname } from 'next/navigation';

const routes = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/spedizioni', label: 'Le mie spedizioni' },
  { href: '/dashboard/nuova', label: 'Nuova spedizione' },
  { href: '/dashboard/compliance', label: 'Compliance' },
  { href: '/dashboard/impostazioni', label: 'Impostazioni' },
  { href: '/dashboard/info', label: 'Informazioni utili' },
];

function titleFor(path: string) {
  const m = routes.find(r => path === r.href || path.startsWith(r.href + '/'));
  return m?.label ?? 'Dashboard';
}

export default function AppTopbar() {
  const pathname = usePathname();
  const title = titleFor(pathname);

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b">
      <div className="mx-auto flex h-14 items-center justify-between px-4">
        <h1 className="text-sm font-semibold tracking-tight">{title}</h1>
        <div className="flex items-center gap-2">
          <a
            href={process.env.NEXT_PUBLIC_WHATSAPP_LINK}
            target="_blank"
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

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ElementType } from 'react';
import {
  LayoutDashboard,
  PackageSearch,
  Box,
  ShieldCheck,
  Settings,
  BookOpen,
} from 'lucide-react';

// --- util: classnames senza dipendenze
function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

type NavItem = {
  label: string;
  href: string;
  icon: ElementType;
  activeWhen?: (path: string) => boolean;
};

// Modifica gli href se i tuoi path sono diversi
const NAV_ITEMS: NavItem[] = [
  {
    label: 'Overview',
    href: '/dashboard',
    icon: LayoutDashboard,
    activeWhen: (p) => p === '/dashboard', // evita che /dashboard/nuova evidenzi Overview
  },
  {
    label: 'Le mie spedizioni',
    href: '/dashboard/spedizioni',
    icon: PackageSearch,
    activeWhen: (p) => p.startsWith('/dashboard/spedizioni'),
  },
  {
    label: 'Nuova spedizione',
    href: '/dashboard/nuova',
    icon: Box,
    activeWhen: (p) => p.startsWith('/dashboard/nuova'), // include /nuova/vino e /nuova/altro
  },
  {
    label: 'Compliance',
    href: '/dashboard/compliance',
    icon: ShieldCheck,
    activeWhen: (p) => p.startsWith('/dashboard/compliance'),
  },
  {
    label: 'Impostazioni',
    href: '/dashboard/impostazioni',
    icon: Settings,
    activeWhen: (p) => p.startsWith('/dashboard/impostazioni'),
  },
  {
    label: 'Informazioni utili',
    href: '/dashboard/informazioni-utili',
    icon: BookOpen,
    activeWhen: (p) => p.startsWith('/dashboard/informazioni-utili'),
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        // colonna sempre visibile
        'sticky top-0 h-screen w-64 shrink-0',
        // stile fondo/contorno coerente con app
        'border-r bg-white',
        // gestione scroll interno se l’elenco fosse lungo
        'overflow-y-auto'
      )}
    >
      {/* Header piccolo della sidebar (logo/titolo se vuoi) */}
      <div className="px-4 py-4">
        <div className="flex items-center gap-2">
          {/* Se hai un logo, mettilo qui */}
          <span className="text-sm font-semibold text-slate-700">Area Riservata</span>
        </div>
      </div>

      {/* Navigazione */}
      <nav className="px-2 pb-6">
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ label, href, icon: Icon, activeWhen }) => {
            const active = activeWhen ? activeWhen(pathname) : pathname === href;

            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'group flex items-center gap-2 rounded-md px-3 py-2 text-sm',
                    'transition-colors',
                    active
                      ? 'bg-slate-100 text-slate-900 ring-1 ring-slate-200'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4',
                      active ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-900'
                    )}
                    strokeWidth={2.25}
                  />
                  <span className="truncate">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

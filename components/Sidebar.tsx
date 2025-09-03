// components/AppSidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  PackageSearch,
  PlusCircle,
  ShieldCheck,
  Settings,
  BookOpen,
} from 'lucide-react';

const nav = [
  { href: '/dashboard', label: 'Overview', Icon: LayoutDashboard },
  { href: '/dashboard/spedizioni', label: 'Le mie spedizioni', Icon: PackageSearch },
  { href: '/dashboard/nuova', label: 'Nuova spedizione', Icon: PlusCircle },
  // { href: '/dashboard/compliance', label: 'Compliance', Icon: ShieldCheck }, // <-- nascosto per ora
  { href: '/dashboard/impostazioni', label: 'Impostazioni', Icon: Settings },
  { href: '/dashboard/info', label: 'Informazioni utili', Icon: BookOpen },
];

export default function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="h-screen sticky top-0 bg-white border-r">
      <div className="p-4">
        {/* spazio per un mini logo se vuoi duplicarlo qui */}
      </div>
      <nav className="px-2">
        <ul className="space-y-1">
          {nav.map(({ href, label, Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={[
                    'group flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition',
                    active
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-700 hover:bg-slate-100',
                  ].join(' ')}
                >
                  <Icon className={active ? 'h-4 w-4 text-white' : 'h-4 w-4 text-slate-600 group-hover:text-slate-900'} />
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

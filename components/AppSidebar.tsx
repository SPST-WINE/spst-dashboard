'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, PackageSearch, PlusCircle, ShieldCheck, Settings, BookOpen,
} from 'lucide-react';

const LOGO = 'https://cdn.prod.website-files.com/6800cc3b5f399f3e2b7f2ffa/68079e968300482f70a36a4a_output-onlinepngtools%20(1).png';

const nav = [
  { href: '/dashboard', label: 'Overview', Icon: LayoutDashboard },
  { href: '/dashboard/spedizioni', label: 'Le mie spedizioni', Icon: PackageSearch },
  { href: '/dashboard/nuova', label: 'Nuova spedizione', Icon: PlusCircle },
  { href: '/dashboard/compliance', label: 'Compliance', Icon: ShieldCheck },
  { href: '/dashboard/impostazioni', label: 'Impostazioni', Icon: Settings },
  { href: '/dashboard/info', label: 'Informazioni utili', Icon: BookOpen },
];

export default function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="h-screen sticky top-0 bg-white border-r w-[260px]">
      {/* logo + claim */}
      <div className="h-14 flex items-center gap-3 px-3 border-b">
        <Image src={LOGO} alt="SPST" width={24} height={24} className="h-6 w-6" priority />
        <span className="text-sm font-semibold tracking-tight">SPST — Area Riservata</span>
      </div>

      <nav className="px-2 pt-3">
        <ul className="space-y-1">
          {nav.map(({ href, label, Icon }) => {
            const isOverview = href === '/dashboard';
            const active = isOverview
              ? pathname === '/dashboard' // solo esatto
              : pathname === href || pathname.startsWith(href + '/'); // prefix per le altre

            return (
              <li key={href}>
                <Link
                  href={href}
                  className={[
                    'group flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition',
                    active
                      ? 'bg-spst-blue text-white'
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

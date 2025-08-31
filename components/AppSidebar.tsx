'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, PlusSquare, ShieldCheck, Settings, Info, Home } from 'lucide-react';

const nav = [
  { label: 'Overview', icon: Home, href: '/dashboard' },
  { label: 'Le mie spedizioni', icon: Package, href: '/dashboard/spedizioni' },
  { label: 'Nuova spedizione', icon: PlusSquare, href: '/dashboard/nuova' },
  { label: 'Compliance', icon: ShieldCheck, href: '/dashboard/compliance' },
  { label: 'Impostazioni', icon: Settings, href: '/dashboard/impostazioni' },
  { label: 'Informazioni utili', icon: Info, href: '/dashboard/informazioniutili' },
];

export default function AppSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  return (
    <aside className="border-r bg-white">
      <div className="flex items-center gap-3 px-4 py-4">
        {/* logo + label */}
        <img
          src="https://cdn.prod.website-files.com/6800cc3b5f399f3e2b7f2ffa/68079e968300482f70a36a4a_output-onlinepngtools%20(1).png"
          alt="SPST"
          className="h-6 w-auto"
        />
        <span className="text-sm font-semibold text-slate-700"> Area Riservata</span>
      </div>

      <nav className="px-2 pb-6">
        <ul className="space-y-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={[
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition',
                    active
                      ? 'bg-spst-blue/10 text-spst-blue font-medium border-l-2 border-spst-blue'
                      : 'text-slate-600 hover:bg-slate-100',
                  ].join(' ')}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

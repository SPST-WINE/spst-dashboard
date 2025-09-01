'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  PackageSearch,
  Package,
  ShieldCheck,
  Settings,
  CircleHelp,
} from 'lucide-react';

function cn(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(' ');
}

type Item = {
  label: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  /** quando true l'item è attivo solo per path esattamente uguale */
  exact?: boolean;
};

const NAV: Item[] = [
  { label: 'Overview',           href: '/dashboard',                   icon: LayoutDashboard, exact: true },
  { label: 'Le mie spedizioni',  href: '/dashboard/spedizioni',        icon: PackageSearch },
  { label: 'Nuova spedizione',   href: '/dashboard/nuova',             icon: Package },
  { label: 'Compliance',         href: '/dashboard/compliance',        icon: ShieldCheck },
  { label: 'Impostazioni',       href: '/dashboard/impostazioni',      icon: Settings },
  { label: 'Informazioni utili', href: '/dashboard/informazioni-utili',icon: CircleHelp },
];

function BrandMark() {
  return (
    <div className="flex items-center gap-2">
      {/* <img> così non serve configurare domains in next/image */}
      <img
        src="https://cdn.prod.website-files.com/6800cc3b5f399f3e2b7f2ffa/68079e968300482f70a36a4a_output-onlinepngtools%20(1).png"
        alt="SPST"
        width={24}
        height={24}
        className="h-6 w-6 object-contain"
      />
      <span className="text-sm font-semibold text-slate-800">Area Riservata</span>
    </div>
  );
}

export default function AppSidebar() {
  const pathname = usePathname();

  const isActive = (item: Item) => {
    if (item.exact) {
      // attivo solo per match esatto (o con trailing slash)
      return pathname === item.href || pathname === item.href + '/';
    }
    // per gli altri item: attivo se è il path esatto o un sotto-percorso
    return pathname === item.href || pathname.startsWith(item.href + '/');
  };

  return (
    <aside className="sticky top-0 h-screen border-r bg-slate-50/60 backdrop-blur-sm">
      <div className="flex h-full flex-col">
        {/* header */}
        <div className="flex h-14 items-center gap-2 px-4">
          <BrandMark />
        </div>

        {/* nav */}
        <nav className="mt-2 flex-1 space-y-1 px-2">
          {NAV.map((item) => {
            const active = isActive(item);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  active
                    ? 'bg-blue-600 text-white ring-1 ring-blue-600 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )}
              >
                {/* icone sempre neutre */}
                <Icon className={cn('h-4 w-4', active ? 'text-slate-200' : 'text-slate-500')} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="h-4" />
      </div>
    </aside>
  );
}

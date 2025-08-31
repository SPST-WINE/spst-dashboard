'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, PackageSearch, ShieldCheck, Settings, CircleHelp, Package } from 'lucide-react';
// import Image from 'next/image';

function cn(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(' ');
}

type Item = {
  label: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  /** se true, l'item è attivo solo su match esatto (utile per Overview) */
  exact?: boolean;
};

const NAV: Item[] = [
  { label: 'Overview',          href: '/dashboard',                   icon: LayoutDashboard, exact: true },
  { label: 'Le mie spedizioni', href: '/dashboard/spedizioni',        icon: PackageSearch },
  { label: 'Nuova spedizione',  href: '/dashboard/nuova',             icon: Package },
  { label: 'Compliance',        href: '/dashboard/compliance',        icon: ShieldCheck },
  { label: 'Impostazioni',      href: '/dashboard/impostazioni',      icon: Settings },
  { label: 'Informazioni utili',href: '/dashboard/informazioni-utili',icon: CircleHelp },
];

/** Piccolo logo con fallback sicuro. Sostituisci col tuo SVG se disponibile. */
function BrandMark() {
  return (
    <div className="flex items-center gap-2">
      {/* Se hai il file, scommenta e imposta il path corretto:
      <Image src="https://cdn.prod.website-files.com/6800cc3b5f399f3e2b7f2ffa/68079e968300482f70a36a4a_output-onlinepngtools%20(1).png" alt="SPST" width={20} height={20} priority />
      */}
      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#F7911E] text-white text-[11px] font-bold">S</div>
      <span className="text-sm font-semibold text-slate-800">Area Riservata</span>
    </div>
  );
}

export default function AppSidebar() {
  const pathname = usePathname();

  const isActive = (item: Item) => {
    if (item.exact) {
      // attivo SOLO su /dashboard o /dashboard/
      return pathname === item.href || pathname === item.href + '/';
    }
    // per gli altri: attivo su /percorso o sottopagine
    return pathname === item.href || pathname.startsWith(item.href + '/');
  };

  return (
    <aside className="sticky top-0 h-screen border-r bg-slate-50/60 backdrop-blur-sm">
      <div className="flex h-full flex-col">
        {/* Header brand */}
        <div className="flex h-14 items-center gap-2 px-4">
          <BrandMark />
        </div>

        {/* Nav */}
        <nav className="mt-2 flex-1 space-y-1 px-2">
          {NAV.map((item) => {
            const active = isActive(item);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  active
                    ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                    : 'text-slate-600 hover:bg-white/70 hover:text-slate-900'
                )}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className={cn('h-4 w-4', active ? 'text-[#F7911E]' : 'text-slate-400')} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer opzionale (spacer) */}
        <div className="h-4" />
      </div>
    </aside>
  );
}

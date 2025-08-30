import Image from 'next/image';
const LOGO = 'https://cdn.prod.website-files.com/6800cc3b5f399f3e2b7f2ffa/68079e968300482f70a36a4a_output-onlinepngtools%20(1).png';

export default function AppTopbar() {
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b">
      <div className="mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Image src={LOGO} alt="SPST" width={28} height={28} className="h-7 w-7" priority />
          <div className="font-semibold tracking-tight">SPST — Area Riservata</div>
        </div>
        <a href="/logout" className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50">Logout</a>
      </div>
    </header>
  );
}

import Link from "next/link";

function Item({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="block p-2 rounded-lg hover:bg-gray-50">
      {label}
    </Link>
  );
}

export default function Sidebar() {
  return (
    <nav className="space-y-2">
      <div className="text-xs uppercase text-gray-500 px-2">Dashboard</div>
      <Item href="/dashboard/spedizioni" label="Le mie spedizioni" />
      <Item href="/dashboard/impostazioni" label="Impostazioni mittente" />
    </nav>
  );
}

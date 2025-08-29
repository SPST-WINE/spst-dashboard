// app/dashboard/spedizioni/page.tsx
export const dynamic = "force-dynamic";
import Protected from "@/components/Protected";
import SpedizioniClient from "@/components/SpedizioniClient";

export default function Page() {
  return (
    <Protected>
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-4">Le mie spedizioni</h1>
        <SpedizioniClient />
      </div>
    </Protected>
  );
}

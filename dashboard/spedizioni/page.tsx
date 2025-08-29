export const dynamic = "force-dynamic";
import SpedizioniClient from "@/components/SpedizioniClient";

export default function Page() {
  return (
    <>
      <h1 className="text-xl font-semibold mb-4">Le mie spedizioni</h1>
      <SpedizioniClient />
    </>
  );
}

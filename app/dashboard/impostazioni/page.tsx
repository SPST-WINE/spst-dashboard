// app/dashboard/impostazioni/page.tsx
"use client";
import { useForm } from "react-hook-form";
import { authedJson } from "@/lib/authed-fetch";

type FormData = {
  "Paese Mittente"?: string;
  "Mittente"?: string;
  "Città Mittente"?: string;
  "CAP Mittente"?: string;
  "Indirizzo Mittente"?: string;
  "Telefono Mittente"?: string;
};

export default function Page() {
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormData>();

  async function onSubmit(values: FormData) {
    await authedJson("/api/utenti", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    // opzionale: feedback
    alert("Impostazioni salvate");
    reset(values);
  }

  return (
    <div className="max-w-xl space-y-3">
      <h1 className="text-xl font-semibold mb-2">Impostazioni mittente</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3">
        <input className="border p-2 rounded-lg" placeholder="Paese" {...register("Paese Mittente")} />
        <input className="border p-2 rounded-lg" placeholder="Mittente" {...register("Mittente")} />
        <input className="border p-2 rounded-lg" placeholder="Città" {...register("Città Mittente")} />
        <input className="border p-2 rounded-lg" placeholder="CAP" {...register("CAP Mittente")} />
        <input className="border p-2 rounded-lg" placeholder="Indirizzo" {...register("Indirizzo Mittente")} />
        <input className="border p-2 rounded-lg" placeholder="Telefono" {...register("Telefono Mittente")} />
        <button disabled={isSubmitting} className="px-3 py-2 rounded-lg border hover:bg-gray-50">
          {isSubmitting ? "Salvo..." : "Salva"}
        </button>
      </form>
    </div>
  );
}

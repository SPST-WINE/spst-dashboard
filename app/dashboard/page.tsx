// app/dashboard/page.tsx
export default function DashboardHome() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <h1 className="text-lg font-semibold tracking-tight">Overview</h1>

      {/* KPI placeholder: li collegheremo ai dati più avanti */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-slate-500">Spedizioni mese</div>
          <div className="text-2xl font-semibold">—</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-slate-500">In transito</div>
          <div className="text-2xl font-semibold">—</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-slate-500">Consegnate</div>
          <div className="text-2xl font-semibold">—</div>
        </div>
      </div>
    </div>
  );
}

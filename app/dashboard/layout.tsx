// app/dashboard/layout.tsx
import "@/app/globals.css";
import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";
import Protected from "@/components/Protected";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Protected>
      <div className="min-h-screen grid md:grid-cols-12">
        <aside className="md:col-span-2 border-r p-4">
          <Sidebar />
        </aside>
        <main className="md:col-span-10">
          <Topbar />
          <div className="p-6">{children}</div>
        </main>
      </div>
    </Protected>
  );
}

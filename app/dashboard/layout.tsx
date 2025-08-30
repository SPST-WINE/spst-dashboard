// app/dashboard/layout.tsx
import AppSidebar from '@/components/AppSidebar';
import AppTopbar from '@/components/AppTopbar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid grid-cols-[260px_1fr]">
      <AppSidebar />
      <div className="flex min-h-screen flex-col">
        <AppTopbar />
        <main className="p-6">
          {/* wrapper centrato e con respiro verticale */}
          <div className="mx-auto w-full max-w-5xl space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

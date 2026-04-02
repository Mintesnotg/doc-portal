import type { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-10 space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-600">
              Doc Portal
            </p>
            <h1 className="text-2xl font-semibold">Dashboard</h1>
          </div>
          <div className="rounded-full bg-white shadow px-4 py-2 text-sm text-slate-600 border border-slate-100">
            Sidebar-ready layout
          </div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}

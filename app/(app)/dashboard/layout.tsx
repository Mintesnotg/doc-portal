import type { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 space-y-8">
      {children}
    </div>
  );
}

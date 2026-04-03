"use client";

import { useState } from "react";
import { Menu, X ,User} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { AuthProvider } from "@/context/auth-context";
import { LogoutButton } from "@/components/LogoutButton";

type AppShellProps = {
  token?: string;
  permissions: string[];
  roleIds: string[];
  user?: { uid?: string; email?: string };
  children: React.ReactNode;
};

export function AppShell({
  token,
  permissions,
  roleIds,
  user,
  children,
}: AppShellProps) {


  const [collapsed, setCollapsed] = useState(false);

  return (
    <AuthProvider
      token={token}
      initialPermissions={permissions}
      initialRoleIds={roleIds}
      initialUser={user}
    >
      <div className="min-h-screen flex">
        <Sidebar collapsed={collapsed} />

        <div className="flex-1 min-h-screen bg-white/80">
          <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-200 bg-white/70 backdrop-blur">
            <button
              onClick={() => setCollapsed((prev) => !prev)}
              className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-2.5 py-2 text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <X className="h-5 w-5" />  :  <Menu className="h-5 w-5" /> }
            </button>

            <div className="flex items-center gap-3">
              {user?.email ? (
                <span className="text-sm text-slate-600 hidden sm:inline">
                 <User/> {user.email} 
                </span>
              ) : null}
              <LogoutButton />
            </div>
          </header>

          <main className="min-h-[calc(100vh-4rem)]">{children}</main>
        </div>
      </div>
    </AuthProvider>
  );
}

export default AppShell;

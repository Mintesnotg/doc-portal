import { cookies } from "next/headers";
import Sidebar from "@/components/Sidebar";
import { AuthProvider } from "@/context/auth-context";
import { decodeJwt } from "@/lib/jwt";
import { LogoutButton } from "@/components/LogoutButton";
import type React from "react";

async function getInitialPermissions(token: string | undefined, roleIds: string[]) {
  if (!token || roleIds.length === 0) return [];

  const permissionApi =
    process.env.PERMISSION_API_URL ??
    (process.env.NEXT_PUBLIC_API_BASE_URL
      ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/permissions`
      : undefined);

  if (!permissionApi) return [];

  try {
    const res = await fetch(permissionApi, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
      credentials: "include",
      body: JSON.stringify({ role_ids: roleIds }),
    });

    if (!res.ok) return [];

    const data = (await res.json()) as { permissions?: string[] };
    return data.permissions ?? [];
  } catch {
    return [];
  }
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token =
    cookieStore.get("token")?.value ||
    cookieStore.get("access_token")?.value ||
    "";

  const decoded = token ? decodeJwt(token) : null;
  const roleIds = decoded?.role_ids ?? decoded?.roles ?? [];
  const permissions = await getInitialPermissions(token || undefined, roleIds);

  return (
    <AuthProvider
      token={token}
      initialPermissions={permissions}
      initialRoleIds={roleIds}
      initialUser={{ uid: decoded?.uid, email: decoded?.email }}
    >
      <div className="min-h-screen flex">
        <Sidebar />
        <div className="flex-1 min-h-screen bg-white/80">
          <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white/70 backdrop-blur">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-600">
                Doc Portal
              </p>
            </div>
            <LogoutButton />
          </header>
          <main className="min-h-[calc(100vh-4rem)]">{children}</main>
        </div>
      </div>
    </AuthProvider>
  );
}

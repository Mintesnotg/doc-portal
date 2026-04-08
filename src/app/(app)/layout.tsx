import { cookies } from "next/headers";
import { decodeJwt } from "@/lib/jwt";
import AppShell from "@/components/AppShell";
import type React from "react";

async function getInitialPermissions(token: string | undefined, roleIds: string[]) {
  if (!token || roleIds.length === 0) return [];

  const permissionApi =
    process.env.PERMISSION_API_URL ??
    (process.env.NEXT_PUBLIC_API_BASE_URL
      ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/permissions/resolve`
      : undefined);

  if (!permissionApi) return [];

  try {
    const res = await fetch(permissionApi, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Permission": "view_permissions",
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
    cookieStore.get("__Host-token")?.value ||
    cookieStore.get("token")?.value ||
    cookieStore.get("access_token")?.value ||
    "";

  const decoded = token ? decodeJwt(token) : null;
  const roleIds = decoded?.role_ids ?? decoded?.roles ?? [];
  const permissions = await getInitialPermissions(token || undefined, roleIds);

  return (
    <AppShell
      token={token}
      permissions={permissions}
      roleIds={roleIds}
      user={{ uid: decoded?.uid, email: decoded?.email }}
    >
      {children}
    </AppShell>
  );
}
